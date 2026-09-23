CREATE TABLE IF NOT EXISTS cash_accounts (
    id           CHAR(36)     PRIMARY KEY,
    workspace_id CHAR(36)     NOT NULL,
    name         VARCHAR(255) NOT NULL,
    is_default   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    INDEX idx_cash_accounts_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transactions (
    id               CHAR(36)      PRIMARY KEY,
    workspace_id     CHAR(36)      NOT NULL,
    cash_account_id  CHAR(36)      NOT NULL,
    transaction_type ENUM('PURCHASE','RENT_PAYMENT','FEED_PURCHASE','PROFIT_SHARE_PAYOUT','OTHER_EXPENSE','OTHER_INCOME') NOT NULL,
    amount           DECIMAL(15,2) NOT NULL,
    transaction_date DATE          NOT NULL,
    description      TEXT,
    business_unit_id CHAR(36),
    batch_id         CHAR(36),
    category         VARCHAR(100),
    created_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (cash_account_id) REFERENCES cash_accounts(id),
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    INDEX idx_transactions_workspace_date (workspace_id, transaction_date),
    INDEX idx_transactions_workspace_type (workspace_id, transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_line_items (
    id                   CHAR(36)      PRIMARY KEY,
    transaction_id       CHAR(36)      NOT NULL,
    item_name            VARCHAR(255)  NOT NULL,
    item_name_normalized VARCHAR(255)  NOT NULL,
    category             ENUM('FEED','TOOL','MEDICINE','MAINTENANCE','SUPPLY','OTHER') NOT NULL DEFAULT 'OTHER',
    qty                  DECIMAL(10,2) NOT NULL,
    unit                 VARCHAR(50)   NOT NULL,
    unit_price           DECIMAL(15,2) NOT NULL,
    total_price          DECIMAL(15,2) NOT NULL,
    supplier_name        VARCHAR(255),
    notes                TEXT,
    created_at           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_purchase_items_transaction (transaction_id),
    INDEX idx_purchase_items_normalized (item_name_normalized)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO cash_accounts (id, workspace_id, name, is_default)
SELECT '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Kas Utama', 1
WHERE NOT EXISTS (
    SELECT 1 FROM cash_accounts WHERE id = '00000000-0000-4000-8000-000000000002'
);
