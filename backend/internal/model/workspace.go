package model

import "time"

const DefaultPersonalWorkspaceID = "00000000-0000-4000-8000-000000000002"

type WorkspaceType string

const (
	WorkspaceBusiness WorkspaceType = "BUSINESS"
	WorkspacePersonal WorkspaceType = "PERSONAL"
)

type Workspace struct {
	ID         string        `json:"id"`
	Name       string        `json:"name"`
	Type       WorkspaceType `json:"type"`
	TemplateID string        `json:"templateId"`
	CreatedAt  time.Time     `json:"createdAt"`
	UpdatedAt  time.Time     `json:"updatedAt"`
}
