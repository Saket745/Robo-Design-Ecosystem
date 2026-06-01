# ⚙️ Configuration Management Specification

This specification defines the configuration hierarchy, parameter precedence, and validation rules applied across the Antigravity platform.

---

## 🏛️ Configuration Precedence Hierarchy

Settings parameters are resolved at runtime using the following hierarchy, where higher numbers override lower numbers:

```
[Level 1: System Defaults] ---> [Level 2: Profile Settings] ---> [Level 3: Project DNA]
                                                                        |
                                                                        v
                                                              [Level 4: Env Variables]
```

### Level 1: System Defaults (`00_CORE_BRAIN/SYSTEM_DNA.yaml`)
*   Defines system-wide directory mapping, subagent type specifications, and global security policies.

### Level 2: Profile Settings (`05_MCP/04_PROJECT_MCP_PROFILES/`)
*   Defines MCP server directories, connection modes (stdio/sse), and environment configurations for active domains.

### Level 3: Project DNA (`project_dna.yaml`)
*   Workspace-specific overrides, determining agent roles, allowed sandbox scopes, and active skill requirements.

### Level 4: Environment Variables (`.env` or process env)
*   Highest priority runtime overrides, used for credentials injection and developer-specific flag settings.

---

## 📄 Validation Rules for Configurations

To prevent configuration errors from halting execution pipelines:
1.  **Strict YAML Validation**: All configurations must pass static syntax linting checks.
2.  **No Undeclared Keys**: Fields in `project_dna.yaml` must map to defined keys in `08_VALIDATION/schemas/dna_schema.json`. Unknown properties trigger startup failures.
3.  **Path Resolution Check**: Any path configured in profiles or DNA files must be validated to ensure it exists on the host machine and does not violate boundary constraints.
