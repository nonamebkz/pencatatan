CREATE TABLE IF NOT EXISTS operational_units (
    id CHAR(36) NOT NULL PRIMARY KEY,
    workspace_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NULL,
    notes TEXT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_operational_units_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    INDEX idx_operational_units_workspace (workspace_id),
    INDEX idx_operational_units_workspace_status (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
