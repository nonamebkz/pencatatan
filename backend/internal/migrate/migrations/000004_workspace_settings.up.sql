CREATE TABLE IF NOT EXISTS workspace_settings (
    workspace_id CHAR(36)     NOT NULL,
    setting_key  VARCHAR(100)  NOT NULL,
    value_json   JSON          NOT NULL,
    updated_at   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (workspace_id, setting_key),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
