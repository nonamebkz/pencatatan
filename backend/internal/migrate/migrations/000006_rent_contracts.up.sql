CREATE TABLE IF NOT EXISTS periodic_contracts (
    id                 CHAR(36)      PRIMARY KEY,
    workspace_id       CHAR(36)      NOT NULL,
    business_unit_id   CHAR(36)      NOT NULL,
    start_date         DATE          NOT NULL,
    end_date           DATE          NOT NULL,
    duration_months    INT           NOT NULL,
    total_amount       DECIMAL(15,2) NOT NULL,
    payment_scheme     ENUM('LUMP_SUM','INSTALLMENT') NOT NULL,
    monthly_equivalent DECIMAL(15,2) NOT NULL,
    notes              TEXT,
    created_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id),
    INDEX idx_contracts_workspace (workspace_id),
    INDEX idx_contracts_pond (business_unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_schedules (
    id          CHAR(36)      PRIMARY KEY,
    contract_id CHAR(36)      NOT NULL,
    due_date    DATE          NOT NULL,
    amount      DECIMAL(15,2) NOT NULL,
    is_paid     TINYINT(1)    NOT NULL DEFAULT 0,
    paid_at     DATETIME(3),
    created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (contract_id) REFERENCES periodic_contracts(id) ON DELETE CASCADE,
    INDEX idx_schedules_contract (contract_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contract_payments (
    id             CHAR(36)      PRIMARY KEY,
    schedule_id    CHAR(36)      NOT NULL UNIQUE,
    transaction_id CHAR(36)      NOT NULL UNIQUE,
    amount         DECIMAL(15,2) NOT NULL,
    payment_date   DATE          NOT NULL,
    notes          TEXT,
    created_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (schedule_id) REFERENCES payment_schedules(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
