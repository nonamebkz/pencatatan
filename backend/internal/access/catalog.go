package access

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

//go:embed catalog.json
var embeddedCatalog []byte

type Catalog struct {
	Version           int                `json:"version"`
	Sections          []Section          `json:"sections"`
	MetaPermissions   []PermissionEntry  `json:"metaPermissions"`
	RoleDefaults      RoleDefaults       `json:"roleDefaults"`
}

type Section struct {
	ID    string     `json:"id"`
	Label string     `json:"label"`
	Menu  []MenuItem `json:"menu,omitempty"`
}

type MenuItem struct {
	ID             string `json:"id"`
	Label          string `json:"label"`
	Description    string `json:"description,omitempty"`
	Path           string `json:"path"`
	Icon           string `json:"icon,omitempty"`
	End            bool   `json:"end,omitempty"`
	MenuPermission string `json:"menuPermission,omitempty"`
	Pages          []Page `json:"pages,omitempty"`
}

type Page struct {
	ID     string           `json:"id"`
	Label  string           `json:"label"`
	Path   string           `json:"path,omitempty"`
	Actions []PermissionEntry `json:"actions"`
}

type PermissionEntry struct {
	ID              string   `json:"id"`
	Label           string   `json:"label"`
	Permission      string   `json:"permission"`
	Resource        string   `json:"resource"`
	Action          string   `json:"action"`
	Description     string   `json:"description,omitempty"`
	Routes          []string `json:"routes,omitempty"`
	OperatorDefault bool     `json:"operatorDefault,omitempty"`
}

type RoleDefaults struct {
	WorkspaceAdmin          string   `json:"workspaceAdmin"`
	OperatorPermissionCodes []string `json:"operatorPermissionCodes"`
}

type PermissionMeta struct {
	Code        string
	Name        string
	Resource    string
	Action      string
	Description string
}

func Load() (*Catalog, error) {
	raw, err := readCatalogBytes()
	if err != nil {
		return nil, err
	}
	var cat Catalog
	if err := json.Unmarshal(raw, &cat); err != nil {
		return nil, fmt.Errorf("access catalog JSON: %w", err)
	}
	return &cat, nil
}

func readCatalogBytes() ([]byte, error) {
	if path := os.Getenv("ACCESS_CATALOG_PATH"); path != "" {
		return os.ReadFile(path)
	}
	for _, rel := range []string{
		"shared/access-catalog.json",
		filepath.Join("..", "shared", "access-catalog.json"),
		filepath.Join("..", "..", "shared", "access-catalog.json"),
	} {
		if b, err := os.ReadFile(rel); err == nil {
			return b, nil
		}
	}
	return embeddedCatalog, nil
}

func (c *Catalog) FlattenPermissions() []PermissionMeta {
	seen := make(map[string]struct{})
	out := make([]PermissionMeta, 0)

	add := func(e PermissionEntry) {
		if e.Permission == "" {
			return
		}
		if _, ok := seen[e.Permission]; ok {
			return
		}
		seen[e.Permission] = struct{}{}
		out = append(out, PermissionMeta{
			Code:        e.Permission,
			Name:        e.Label,
			Resource:    e.Resource,
			Action:      e.Action,
			Description: e.Description,
		})
	}

	for _, section := range c.Sections {
		for _, menu := range section.Menu {
			for _, page := range menu.Pages {
				for _, action := range page.Actions {
					add(action)
				}
			}
		}
	}
	for _, meta := range c.MetaPermissions {
		add(meta)
	}
	return out
}

func (c *Catalog) AllPermissionCodes() []string {
	perms := c.FlattenPermissions()
	codes := make([]string, len(perms))
	for i, p := range perms {
		codes[i] = p.Code
	}
	return codes
}

func (c *Catalog) OperatorPermissionCodes() []string {
	if len(c.RoleDefaults.OperatorPermissionCodes) == 0 {
		return nil
	}
	out := make([]string, len(c.RoleDefaults.OperatorPermissionCodes))
	copy(out, c.RoleDefaults.OperatorPermissionCodes)
	return out
}
