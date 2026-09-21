package httpx

import "github.com/gofiber/fiber/v2"

type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func OK(c *fiber.Ctx, data any) error {
	return c.JSON(fiber.Map{"success": true, "data": data})
}

func OKWithMeta(c *fiber.Ctx, data any, meta fiber.Map) error {
	return c.JSON(fiber.Map{"success": true, "data": data, "meta": meta})
}

func Fail(c *fiber.Ctx, status int, code, message string) error {
	return c.Status(status).JSON(fiber.Map{
		"success": false,
		"error": ErrorBody{
			Code:    code,
			Message: message,
		},
	})
}
