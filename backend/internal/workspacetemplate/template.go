package workspacetemplate

const (
	TemplateLele     = "lele"
	TemplateGeneric  = "generic"
	TemplatePersonal = "personal"
)

func SupportsPondModule(templateID string) bool {
	return templateID == TemplateLele
}

func SupportsOperationalUnits(templateID string) bool {
	return templateID == TemplateGeneric
}
