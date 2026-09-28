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
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
	"github.com/kikichan/pencatatan/backend/internal/seed"
	"github.com/kikichan/pencatatan/backend/internal/workspacetemplate"
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
	if err := seed.EnsureRBAC(context.Background(), db); err != nil {
		log.Fatalf("seed rbac failed: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	rbacRepo := repository.NewRBACRepository(db)
	batchRepo := repository.NewBatchRepository(db)
	pondRepo := repository.NewPondRepository(db)
	waterQualityRepo := repository.NewWaterQualityRepository(db)
	financeRepo := repository.NewFinanceRepository(db)
	auditRepo := repository.NewAuditRepository(db)
	rentRepo := repository.NewRentRepository(db)
	reportRepo := repository.NewReportRepository(db)
	settingsRepo := repository.NewSettingsRepository(db)
	workspaceRepo := repository.NewWorkspaceRepository(db)
	opUnitRepo := repository.NewOperationalUnitRepository(db)

	healthHandler := handler.NewHealthHandler(db)
	authHandler := handler.NewAuthHandler(userRepo, rbacRepo, workspaceRepo, cfg.JWTSecret, cfg.JWTExpiry)
	userHandler := handler.NewUserHandler(userRepo, rbacRepo, workspaceRepo)
	roleHandler := handler.NewRoleHandler(rbacRepo)
	permissionHandler := handler.NewPermissionHandler(rbacRepo)
	batchHandler := handler.NewBatchHandler(batchRepo)
	pondHandler := handler.NewPondHandler(pondRepo, settingsRepo)
	waterQualityHandler := handler.NewWaterQualityHandler(waterQualityRepo, pondRepo, settingsRepo)
	financeHandler := handler.NewFinanceHandler(financeRepo, auditRepo, opUnitRepo)
	opUnitHandler := handler.NewOperationalUnitHandler(opUnitRepo)
	rentHandler := handler.NewRentHandler(rentRepo, financeRepo)
	reportHandler := handler.NewReportHandler(reportRepo, rentRepo, workspaceRepo)
	workspaceHandler := handler.NewWorkspaceHandler(workspaceRepo, settingsRepo, financeRepo)

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

	protected := api.Group(
		"",
		middleware.Auth(cfg.JWTSecret),
		middleware.LoadPermissions(rbacRepo),
		middleware.ValidateWorkspace(workspaceRepo),
		middleware.RequireWorkspaceMembership(workspaceRepo),
	)
	protected.Post("/auth/logout", authHandler.Logout)
	protected.Get("/auth/me", authHandler.Me)

	protected.Get("/workspaces", workspaceHandler.List)
	protected.Get("/workspaces/all", middleware.RequireAnyPermission(model.PermUserAssignWorkspace, model.PermWorkspaceRead), workspaceHandler.ListAll)
	protected.Post("/workspaces", middleware.RequirePermission(model.PermWorkspaceCreate), workspaceHandler.Create)
	protected.Put("/workspaces/:id", middleware.RequirePermission(model.PermWorkspaceUpdate), workspaceHandler.Update)
	protected.Delete("/workspaces/:id", middleware.RequirePermission(model.PermWorkspaceDelete), workspaceHandler.Delete)

	protected.Get("/users", middleware.RequirePermission(model.PermUserRead), userHandler.List)
	protected.Get("/users/:id", middleware.RequirePermission(model.PermUserRead), userHandler.Get)
	protected.Post("/users", middleware.RequirePermission(model.PermUserCreate), userHandler.Create)
	protected.Put("/users/:id", middleware.RequirePermission(model.PermUserUpdate), userHandler.Update)
	protected.Put("/users/:id/reset-password", middleware.RequirePermission(model.PermUserUpdate), userHandler.ResetPassword)
	protected.Put("/users/:id/roles", middleware.RequirePermission(model.PermUserAssignRole), userHandler.SetRoles)
	protected.Put("/users/:id/workspaces", middleware.RequirePermission(model.PermUserAssignWorkspace), userHandler.SetWorkspaces)
	protected.Delete("/users/:id", middleware.RequirePermission(model.PermUserDelete), userHandler.Delete)

	protected.Get("/roles", middleware.RequirePermission(model.PermRoleRead), roleHandler.List)
	protected.Post("/roles", middleware.RequirePermission(model.PermRoleCreate), roleHandler.Create)
	protected.Get("/roles/:id", middleware.RequirePermission(model.PermRoleRead), roleHandler.Get)
	protected.Put("/roles/:id", middleware.RequirePermission(model.PermRoleUpdate), roleHandler.Update)
	protected.Delete("/roles/:id", middleware.RequirePermission(model.PermRoleDelete), roleHandler.Delete)
	protected.Put("/roles/:id/permissions", middleware.RequirePermission(model.PermRoleAssignPerm), roleHandler.SetPermissions)

	protected.Get("/permissions", middleware.RequireAnyPermission(
		model.PermPermissionRead,
		model.PermRoleRead,
		model.PermRoleCreate,
		model.PermRoleAssignPerm,
	), permissionHandler.List)

	leleOnly := middleware.RequireWorkspaceTemplate(workspacetemplate.TemplateLele)
	genericOnly := middleware.RequireWorkspaceTemplate(workspacetemplate.TemplateGeneric)

	protected.Get("/batches", leleOnly, batchHandler.List)
	protected.Get("/ponds", leleOnly, pondHandler.List)
	protected.Get("/ponds/:id", leleOnly, pondHandler.Get)
	protected.Post("/ponds", leleOnly, pondHandler.Create)
	protected.Put("/ponds/:id", leleOnly, pondHandler.Update)
	protected.Delete("/ponds/:id", leleOnly, middleware.RequirePermission(model.PermPondDelete), pondHandler.Delete)

	protected.Put("/water-quality/config", leleOnly, middleware.RequirePermission(model.PermWaterQualityCfgUp), waterQualityHandler.UpdateConfig)

	protected.Get("/water-quality-logs/trends", leleOnly, waterQualityHandler.Trends)
	protected.Get("/water-quality/config", leleOnly, waterQualityHandler.GetConfig)
	protected.Post("/water-quality/evaluate", leleOnly, waterQualityHandler.EvaluateMeasurements)
	protected.Get("/water-quality-logs", leleOnly, waterQualityHandler.List)
	protected.Get("/water-quality-logs/:id", leleOnly, waterQualityHandler.Get)
	protected.Post("/water-quality-logs", leleOnly, waterQualityHandler.Create)
	protected.Put("/water-quality-logs/:id", leleOnly, waterQualityHandler.Update)
	protected.Delete("/water-quality-logs/:id", leleOnly, middleware.RequirePermission(model.PermWaterQualityDelete), waterQualityHandler.Delete)

	protected.Get("/reports/water-quality", leleOnly, waterQualityHandler.Report)
	protected.Get("/reports/purchases", middleware.RequirePermission("finance.read"), reportHandler.Purchases)
	protected.Get("/reports/price-history", middleware.RequirePermission("finance.read"), reportHandler.PriceHistory)
	protected.Get("/reports/price-history/items", middleware.RequirePermission("finance.read"), reportHandler.PriceHistoryItems)
	protected.Get("/reports/rent", leleOnly, middleware.RequirePermission("finance.rent.read"), reportHandler.Rent)
	protected.Get("/reports/summary", middleware.RequirePermission("finance.read"), reportHandler.Summary)
	protected.Get("/reports/consolidated/summary", middleware.RequirePermission("finance.read"), reportHandler.ConsolidatedSummary)
	protected.Get("/dashboard", leleOnly, waterQualityHandler.DashboardSummary)

	protected.Get("/operational-units", genericOnly, middleware.RequirePermission(model.PermOperationalUnitRead), opUnitHandler.List)
	protected.Get("/operational-units/:id", genericOnly, middleware.RequirePermission(model.PermOperationalUnitRead), opUnitHandler.Get)
	protected.Post("/operational-units", genericOnly, middleware.RequirePermission(model.PermOperationalUnitCreate), opUnitHandler.Create)
	protected.Put("/operational-units/:id", genericOnly, middleware.RequirePermission(model.PermOperationalUnitUpdate), opUnitHandler.Update)
	protected.Delete("/operational-units/:id", genericOnly, middleware.RequirePermission(model.PermOperationalUnitDelete), opUnitHandler.Delete)

	protected.Get("/cash-accounts", middleware.RequirePermission(model.PermCashAccountRead), financeHandler.ListCashAccounts)
	protected.Get("/cash-accounts/:id", middleware.RequirePermission(model.PermCashAccountRead), financeHandler.GetCashAccount)
	protected.Post("/cash-accounts", middleware.RequirePermission(model.PermCashAccountCreate), financeHandler.CreateCashAccount)
	protected.Put("/cash-accounts/:id", middleware.RequirePermission(model.PermCashAccountUpdate), financeHandler.UpdateCashAccount)
	protected.Delete("/cash-accounts/:id", middleware.RequirePermission(model.PermCashAccountDelete), financeHandler.DeleteCashAccount)
	protected.Get("/finance/summary", financeHandler.Summary)
	protected.Get("/transactions", financeHandler.ListTransactions)
	protected.Get("/transactions/:id", financeHandler.GetTransaction)
	protected.Get("/purchases", financeHandler.ListPurchases)
	protected.Get("/purchases/:id", financeHandler.GetPurchase)
	protected.Post("/purchases", financeHandler.CreatePurchase)
	protected.Put("/purchases/:id", middleware.RequirePermission(model.PermFinancePurchaseUpdate), financeHandler.UpdatePurchase)
	protected.Delete("/purchases/:id", middleware.RequirePermission(model.PermFinancePurchaseDelete), financeHandler.DeletePurchase)
	protected.Post("/transactions/other-expenses", financeHandler.CreateOtherExpense)
	protected.Put("/transactions/other-expenses/:id", middleware.RequirePermission(model.PermFinanceExpenseUpdate), financeHandler.UpdateOtherExpense)
	protected.Delete("/transactions/other-expenses/:id", middleware.RequirePermission(model.PermFinanceExpenseDelete), financeHandler.DeleteOtherExpense)

	protected.Get("/rent-contracts", leleOnly, middleware.RequirePermission(model.PermFinanceRentRead), rentHandler.List)
	protected.Get("/rent-contracts/:id", leleOnly, middleware.RequirePermission(model.PermFinanceRentRead), rentHandler.Get)
	protected.Post("/rent-contracts", leleOnly, middleware.RequirePermission(model.PermFinanceRentCreate), rentHandler.Create)
	protected.Post("/rent-contracts/schedules/:scheduleId/pay", leleOnly, middleware.RequirePermission(model.PermFinanceRentPay), rentHandler.PaySchedule)

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
