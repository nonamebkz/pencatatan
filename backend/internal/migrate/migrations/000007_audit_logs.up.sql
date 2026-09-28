CREATE TABLE IF NOT EXISTS audit_logs (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    workspace_id    CHAR(36)     NOT NULL,
    actor_user_id   CHAR(36)     NULL,
    entity_type     VARCHAR(64)  NOT NULL,
    entity_id       CHAR(36)     NOT NULL,
    event_type      VARCHAR(32)  NOT NULL,
    changes_json    JSON         NULL,
    created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    INDEX idx_audit_logs_workspace_created (workspace_id, created_at),
    INDEX idx_audit_logs_entity (workspace_id, entity_type, entity_id),
    INDEX idx_audit_logs_actor (actor_user_id),
    INDEX idx_audit_logs_event (workspace_id, event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
