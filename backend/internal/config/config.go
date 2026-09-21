package config

import (
	"fmt"
	"os"
	"time"
)

type Config struct {
	Port            string
	DBHost          string
	DBPort          string
	DBUser          string
	DBPass          string
	DBName          string
	CORSOrigins     string
	JWTSecret       string
	JWTExpiry       time.Duration
	AdminEmail      string
	AdminPassword   string
}

func Load() Config {
	return Config{
		Port:          getEnv("APP_PORT", "8080"),
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "3306"),
		DBUser:        getEnv("DB_USER", "pencatatan"),
		DBPass:        getEnv("DB_PASSWORD", "pencatatan"),
		DBName:        getEnv("DB_NAME", "pencatatan"),
		CORSOrigins:   getEnv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"),
		JWTSecret:     getEnv("JWT_SECRET", "dev-secret-change-me-in-production"),
		JWTExpiry:     parseDuration(getEnv("JWT_EXPIRY", "24h"), 24*time.Hour),
		AdminEmail:    getEnv("ADMIN_EMAIL", "admin@pencatatan.local"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "changeme123"),
	}
}

func (c Config) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local",
		c.DBUser, c.DBPass, c.DBHost, c.DBPort, c.DBName,
	)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func parseDuration(value string, fallback time.Duration) time.Duration {
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return parsed
}
