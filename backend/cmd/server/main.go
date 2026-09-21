package main

import (
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
	"github.com/kikichan/pencatatan/backend/internal/migrate"
	"github.com/kikichan/pencatatan/backend/internal/repository"
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

	pondRepo := repository.NewPondRepository(db)
	waterQualityRepo := repository.NewWaterQualityRepository(db)

	healthHandler := handler.NewHealthHandler(db)
	pondHandler := handler.NewPondHandler(pondRepo)
	waterQualityHandler := handler.NewWaterQualityHandler(waterQualityRepo, pondRepo)

	app := fiber.New(fiber.Config{
		AppName:      "pencatatan-api",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: strings.Join(splitOrigins(cfg.CORSOrigins), ","),
		AllowHeaders: "Origin, Content-Type, Accept, X-Workspace-ID",
	}))

	app.Get("/health", healthHandler.Check)

	api := app.Group("/api/v1")
	api.Get("/ponds", pondHandler.List)
	api.Get("/ponds/:id", pondHandler.Get)
	api.Post("/ponds", pondHandler.Create)
	api.Put("/ponds/:id", pondHandler.Update)
	api.Delete("/ponds/:id", pondHandler.Delete)

	api.Get("/water-quality-logs/trends", waterQualityHandler.Trends)
	api.Get("/water-quality-logs", waterQualityHandler.List)
	api.Get("/water-quality-logs/:id", waterQualityHandler.Get)
	api.Post("/water-quality-logs", waterQualityHandler.Create)
	api.Put("/water-quality-logs/:id", waterQualityHandler.Update)
	api.Delete("/water-quality-logs/:id", waterQualityHandler.Delete)

	api.Get("/reports/water-quality", waterQualityHandler.Report)
	api.Get("/dashboard", waterQualityHandler.DashboardSummary)

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
