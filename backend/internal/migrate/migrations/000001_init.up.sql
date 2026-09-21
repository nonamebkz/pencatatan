CREATE TABLE IF NOT EXISTS workspaces (
    id          CHAR(36)                    PRIMARY KEY,
    name        VARCHAR(255)                NOT NULL,
    type        ENUM('BUSINESS','PERSONAL') NOT NULL DEFAULT 'BUSINESS',
    template_id VARCHAR(50)                 NOT NULL DEFAULT 'lele',
    created_at  DATETIME(3)                 NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  DATETIME(3)                 NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS business_units (
    id           CHAR(36)                  PRIMARY KEY,
    workspace_id CHAR(36)                  NOT NULL,
    unit_type    ENUM('POND')              NOT NULL DEFAULT 'POND',
    name         VARCHAR(255)              NOT NULL,
    location     VARCHAR(255),
    size         VARCHAR(100),
    owner_name   VARCHAR(255),
    status       ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    notes        TEXT,
    created_at   DATETIME(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at   DATETIME(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    INDEX idx_business_units_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS batches (
    id               CHAR(36)     PRIMARY KEY,
    workspace_id     CHAR(36)     NOT NULL,
    business_unit_id CHAR(36),
    name             VARCHAR(255) NOT NULL,
    start_date       DATE,
    end_date         DATE,
    status           ENUM('ACTIVE','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    notes            TEXT,
    created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL,
    INDEX idx_batches_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS water_quality_logs (
    id                 CHAR(36)     PRIMARY KEY,
    workspace_id       CHAR(36)     NOT NULL,
    business_unit_id   CHAR(36)     NOT NULL,
    batch_id           CHAR(36),
    measured_at        DATETIME(3)  NOT NULL,
    ammonia_ppm        DECIMAL(6,3),
    ph                 DECIMAL(4,2),
    notes              TEXT,
    created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    INDEX idx_wq_logs_workspace_measured (workspace_id, measured_at),
    INDEX idx_wq_logs_business_unit (business_unit_id, measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO workspaces (id, name, type, template_id)
SELECT '00000000-0000-4000-8000-000000000001', 'Usaha Lele', 'BUSINESS', 'lele'
WHERE NOT EXISTS (
    SELECT 1 FROM workspaces WHERE id = '00000000-0000-4000-8000-000000000001'
);
