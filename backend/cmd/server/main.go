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
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	db, err := database.Connect(cfg.DSN())
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer db.Close()

	app := fiber.New(fiber.Config{
		AppName:      "pencatatan-api",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: strings.Join(splitOrigins(cfg.CORSOrigins), ","),
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	healthHandler := handler.NewHealthHandler(db)
	app.Get("/health", healthHandler.Check)

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
