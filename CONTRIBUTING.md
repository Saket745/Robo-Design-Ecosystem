# Contributing to Robo Design Ecosystem

Thank you for contributing to the **Robo Design Ecosystem** — an autonomous engineering infrastructure for robotics, AI systems, and multi-domain project orchestration.

---

## 🏛️ Core Principles

All contributions are bound by the [SYSTEM_CONSTITUTION](./00_CORE_BRAIN/SYSTEM_CONSTITUTION.md) and [SYSTEM_DNA](./00_CORE_BRAIN/SYSTEM_DNA.yaml). Please read them before contributing.

### Immutable Zones

The following directories are **governance-critical** and require explicit owner approval for any modification:

- `00_CORE_BRAIN/`
- `01_GLOBAL_RULES/`
- `07_SECURITY/`
- `SYSTEM_DNA.yaml`

### Validation-First Rule

No code, configuration, or skill may be merged without passing the validation pipeline defined in `08_VALIDATION/`. If no automated pipeline exists yet, a manual review checklist must be completed in the PR.

---

## 🌿 Branching Strategy

| Branch | Purpose |
|:---|:---|
| `main` | Stable, validated releases only |
| `develop` | Integration branch for feature work |
| `feature/<description>` | Individual feature branches (branch from `develop`) |
| `hotfix/<description>` | Emergency fixes to `main` |

### Workflow

1. Branch from `develop`: `git checkout -b feature/your-feature develop`
2. Make changes following the engineering standards in `01_GLOBAL_RULES/02_ENGINEERING_STANDARDS/`
3. Commit with conventional commit messages: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
4. Open a Pull Request against `develop`
5. Complete the PR checklist template
6. Request review from the project owner

---

## 📂 Adding New Skills

New skills must be placed under `02_SKILLS/04_SKILL_DOMAINS/<DOMAIN>/` and contain:

| File | Purpose |
|:---|:---|
| `skill.md` | Human + AI readable documentation |
| `validation.md` | Testing checklist and pass criteria |
| `dependencies.yaml` | Explicit dependency declarations |

See the [SKILL_CREATION_GUIDE](./02_SKILLS/SKILL_CREATION_GUIDE.md) for full details.

---

## 🔐 Security Rules

- **NEVER** commit API keys, secrets, or credentials
- **NEVER** store plaintext passwords in any file
- All secrets go through `17_SECRETS/` (which is gitignored)
- Use environment variables for runtime injection

---

## 📝 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**Scope examples**: `core-brain`, `skills`, `subagents`, `dashboard`, `validation`, `security`

**Example**:
```
feat(skills): add sensor_fusion skill for robotics domain

Added skill.md, validation.md, and dependencies.yaml for the
sensor_fusion skill under ROBOTICS_ENGINEERING domain.

Closes #12
```
