# AGENTS.md

This file provides guidance to **Jules** (Google's AI coding agent) and other AI agents when working with code in this repository.

## Project Overview

**Robo Design Ecosystem** is an autonomous engineering infrastructure platform for building a customizable quadruped robot. It uses a modular 18-directory architecture governed by `SYSTEM_DNA.yaml` and a `SYSTEM_CONSTITUTION.md`.

The platform is built on Node.js and serves as an orchestration backbone for robotics development — covering skills, subagents, memory, validation, execution, and security.

**Key directories:**
- `00_CORE_BRAIN/` — System identity, DNA, and constitution (IMMUTABLE — do not modify)
- `01_GLOBAL_RULES/` — Engineering policies and standards (IMMUTABLE — do not modify)
- `02_SKILLS/` — Modular capability registry with 12 robotics skill domains
- `03_SUBAGENTS/` — Autonomous agent definitions and lifecycle management
- `04_MEMORY/` — Segmented memory kernel (global, project, patterns)
- `05_MCP/` — Model Context Protocol server connectors
- `06_AUTOMATION/` — Workflow triggers and cron jobs
- `07_SECURITY/` — Access control and sandbox policies (IMMUTABLE — do not modify)
- `08_VALIDATION/` — Pre-execution validation engine
- `09_EXECUTION_ENGINE/` — DAG engine, runtime, and state manager
- `10_PROJECT_INTELLIGENCE/` — Project classification and registry
- `11_KNOWLEDGE_GRAPH/` — Entity relationships
- `12_SYSTEM_LOGS/` — Append-only audit and execution logs
- `13_BACKUPS/` — Snapshot and backup policies
- `14_SANDBOX/` — Secure execution zone
- `15_RECOVERY/` — Rollback and repair protocols
- `16_CONFIG/` — Configuration hierarchy
- `17_SECRETS/` — Encrypted credentials (gitignored)
- `dashboard/` — Vite-based web command center (HTML/CSS/JS)
- `scripts/` — CLI utilities (scaffold, state manager, logger, server)
- `robot/` — Robot-specific code (URDF, kinematics, gait controllers)

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run the dashboard dev server (Vite)
npm run dev

# Start the dashboard with backend API
node scripts/server.js

# Scaffold the ecosystem structure (already done, use cautiously)
npm run scaffold

# Validate the entire ecosystem
npm run validate

# Run robotics unit tests (Python)
cd robot && python -m pytest tests/ -v

# Check URDF validity
python -c "import xml.etree.ElementTree as ET; ET.parse('robot/urdf/robo_model.urdf')"
```

## Architecture Rules (CRITICAL)

1. **No circular dependencies.** All module imports must form a DAG (Directed Acyclic Graph).
2. **Tier boundaries must be respected:**
   - Tier 1 (Governance): `00_CORE_BRAIN`, `01_GLOBAL_RULES`
   - Tier 2 (Operations): `02_SKILLS`, `03_SUBAGENTS`, `04_MEMORY`, `05_MCP`
   - Tier 3 (Infrastructure): `06_AUTOMATION`, `07_SECURITY`, `08_VALIDATION`, `09_EXECUTION_ENGINE`, `10_PROJECT_INTELLIGENCE`, `11_KNOWLEDGE_GRAPH`
   - Tier 4 (Support): `12_SYSTEM_LOGS`, `13_BACKUPS`, `14_SANDBOX`, `15_RECOVERY`, `16_CONFIG`, `17_SECRETS`
   - Higher tiers may import from lower tiers, but **never the reverse**.
3. **No external npm dependencies** for platform runtime. Use Node.js built-in modules only. Exception: `vite` for dashboard dev.
4. **Schema-first contracts.** All inter-module communication uses JSON/YAML schemas.
5. **Validation before execution.** Nothing runs without passing `08_VALIDATION`.
6. **Append-only logging.** Never modify or delete entries in `12_SYSTEM_LOGS`.
7. **No plaintext secrets.** API keys, tokens, and credentials go in `17_SECRETS/` (gitignored) or environment variables.

## File Conventions

| Pattern | Language | Purpose |
|:--------|:---------|:--------|
| `*.js` | JavaScript (CommonJS) | Platform modules and scripts |
| `*.py` | Python 3.10+ | Robot kinematics, gait control, tests |
| `*.yaml` / `*.yml` | YAML | Configuration, schemas, project DNA |
| `*.md` | Markdown (GitHub Flavored) | Documentation, skill definitions |
| `*.json` | JSON | State files, schemas, memory entries |
| `*.jsonl` | JSON Lines | Log files (one JSON object per line) |
| `*.urdf` | XML (URDF) | Robot model descriptions |
| `*.launch.py` | Python | ROS2 launch files |

## Naming Conventions

- **Directories**: `UPPER_SNAKE_CASE` for top-level modules (e.g., `00_CORE_BRAIN`), `lower_snake_case` for subdirectories
- **JavaScript files**: `lower_snake_case.js` (e.g., `state_manager.js`)
- **Python files**: `lower_snake_case.py` (e.g., `inverse_kinematics.py`)
- **Config files**: `lower_snake_case.yaml` or `lower_snake_case.json`
- **Constants**: `UPPER_SNAKE_CASE` in code
- **Functions/Variables**: `camelCase` in JavaScript, `snake_case` in Python

## Commit Message Format

Use conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**Scopes**: `core-brain`, `skills`, `subagents`, `memory`, `validation`, `execution`, `dashboard`, `robot`, `security`, `config`

**Example**:
```
feat(validation): implement core validation engine

Added validator.js with schema validation, dependency cycle
detection, and naming convention checks. Includes JSON schemas
for skills, agents, and configs.

Closes #12
```

## Testing Strategy

- **JavaScript modules**: Manual validation via `npm run validate`
- **Python robotics code**: `pytest` with test files in `robot/tests/`
- **URDF models**: XML parsing validation
- **Integration**: Dashboard API endpoint testing via `curl` or browser

## Immutable Zones (DO NOT MODIFY)

These directories/files are governance-critical. Any changes require explicit owner approval:

- `00_CORE_BRAIN/SYSTEM_DNA.yaml`
- `00_CORE_BRAIN/SYSTEM_CONSTITUTION.md`
- `01_GLOBAL_RULES/` (all rule files)
- `07_SECURITY/` (all policy files)

## Current Task Reference

The active development tasks are tracked in `docs/tasks/PRD.md` with progress logged in `docs/tasks/progress.txt`. Check these files to understand what needs to be done next.

## Environment

- **OS**: Windows 11 (PowerShell default)
- **Node.js**: v18+ (installed globally)
- **Python**: 3.10+ (for robotics code)
- **Git**: Conventional commits, `main`/`develop`/`feature/*` branching
- **IDE**: Antigravity IDE (VS Code fork)
