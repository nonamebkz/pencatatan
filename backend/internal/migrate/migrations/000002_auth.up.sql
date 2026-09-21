CREATE TABLE IF NOT EXISTS users (
    id            CHAR(36)                  PRIMARY KEY,
    email         VARCHAR(255)              NOT NULL UNIQUE,
    password_hash VARCHAR(255)              NOT NULL,
    name          VARCHAR(255)              NOT NULL,
    role          ENUM('ADMIN','USER')      NOT NULL DEFAULT 'USER',
    is_active     TINYINT(1)                NOT NULL DEFAULT 1,
    created_at    DATETIME(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
