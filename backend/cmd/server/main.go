package main

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"github.com/kikichan/pencatatan/backend/internal/config"
	"github.com/kikichan/pencatatan/backend/internal/database"
	"github.com/kikichan/pencatatan/backend/internal/handler"
	"github.com/kikichan/pencatatan/backend/internal/middleware"
	"github.com/kikichan/pencatatan/backend/internal/migrate"
	"github.com/kikichan/pencatatan/backend/internal/repository"
	"github.com/kikichan/pencatatan/backend/internal/seed"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	db, err := database.Connect(cfg.DSN())
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer db.Close()

	if err := migrate.Up(db); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	if err := seed.EnsureAdmin(context.Background(), db, cfg.AdminEmail, cfg.AdminPassword); err != nil {
		log.Fatalf("seed admin failed: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	batchRepo := repository.NewBatchRepository(db)
	pondRepo := repository.NewPondRepository(db)
	waterQualityRepo := repository.NewWaterQualityRepository(db)
	financeRepo := repository.NewFinanceRepository(db)

	settingsRepo := repository.NewSettingsRepository(db)

	healthHandler := handler.NewHealthHandler(db)
	authHandler := handler.NewAuthHandler(userRepo, cfg.JWTSecret, cfg.JWTExpiry)
	userHandler := handler.NewUserHandler(userRepo)
	batchHandler := handler.NewBatchHandler(batchRepo)
	pondHandler := handler.NewPondHandler(pondRepo, settingsRepo)
	waterQualityHandler := handler.NewWaterQualityHandler(waterQualityRepo, pondRepo, settingsRepo)
	financeHandler := handler.NewFinanceHandler(financeRepo)

	app := fiber.New(fiber.Config{
		AppName:      "pencatatan-api",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: strings.Join(splitOrigins(cfg.CORSOrigins), ","),
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, X-Workspace-ID",
	}))

	app.Get("/health", healthHandler.Check)

	api := app.Group("/api/v1")

	api.Post("/auth/login", authHandler.Login)

	protected := api.Group("", middleware.Auth(cfg.JWTSecret))
	protected.Post("/auth/logout", authHandler.Logout)
	protected.Get("/auth/me", authHandler.Me)

	protected.Get("/users", userHandler.List)
	protected.Get("/users/:id", userHandler.Get)
	protected.Post("/users", userHandler.Create)
	protected.Put("/users/:id", userHandler.Update)
	protected.Put("/users/:id/reset-password", userHandler.ResetPassword)

	protected.Get("/batches", batchHandler.List)
	protected.Get("/ponds", pondHandler.List)
	protected.Get("/ponds/:id", pondHandler.Get)
	protected.Post("/ponds", pondHandler.Create)
	protected.Put("/ponds/:id", pondHandler.Update)

	adminOnly := protected.Group("", middleware.AdminOnly())
	adminOnly.Delete("/users/:id", userHandler.Delete)
	adminOnly.Delete("/ponds/:id", pondHandler.Delete)
	adminOnly.Delete("/water-quality-logs/:id", waterQualityHandler.Delete)
	adminOnly.Delete("/cash-accounts/:id", financeHandler.DeleteCashAccount)

	protected.Put("/water-quality/config", waterQualityHandler.UpdateConfig)

	protected.Get("/water-quality-logs/trends", waterQualityHandler.Trends)
	protected.Get("/water-quality/config", waterQualityHandler.GetConfig)
	protected.Post("/water-quality/evaluate", waterQualityHandler.EvaluateMeasurements)
	protected.Get("/water-quality-logs", waterQualityHandler.List)
	protected.Get("/water-quality-logs/:id", waterQualityHandler.Get)
	protected.Post("/water-quality-logs", waterQualityHandler.Create)
	protected.Put("/water-quality-logs/:id", waterQualityHandler.Update)

	protected.Get("/reports/water-quality", waterQualityHandler.Report)
	protected.Get("/dashboard", waterQualityHandler.DashboardSummary)

	protected.Get("/cash-accounts", financeHandler.ListCashAccounts)
	protected.Get("/cash-accounts/:id", financeHandler.GetCashAccount)
	protected.Post("/cash-accounts", financeHandler.CreateCashAccount)
	protected.Put("/cash-accounts/:id", financeHandler.UpdateCashAccount)
	protected.Get("/finance/summary", financeHandler.Summary)
	protected.Get("/transactions", financeHandler.ListTransactions)
	protected.Get("/purchases", financeHandler.ListPurchases)
	protected.Get("/purchases/:id", financeHandler.GetPurchase)
	protected.Post("/purchases", financeHandler.CreatePurchase)
	protected.Post("/transactions/other-expenses", financeHandler.CreateOtherExpense)

	log.Printf("server listening on :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

func splitOrigins(value string) []string {
	parts := strings.Split(value, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return origins
}
