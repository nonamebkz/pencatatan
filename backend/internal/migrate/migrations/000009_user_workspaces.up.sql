CREATE TABLE IF NOT EXISTS user_workspaces (
    user_id      CHAR(36)    NOT NULL,
    workspace_id CHAR(36)    NOT NULL,
    created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id, workspace_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    INDEX idx_user_workspaces_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO user_workspaces (user_id, workspace_id)
SELECT u.id, w.id FROM users u CROSS JOIN workspaces w
WHERE u.is_active = 1
ON DUPLICATE KEY UPDATE user_id = user_workspaces.user_id;
