# Naming Conventions Rules

## Rule 1: Directory Naming Structure
**Severity**: ERROR
**Description**: Top-level platform directories must match the pattern `^\d{2}_[A-Z0-9_]+$` (e.g., `02_SKILLS`, `04_MEMORY`). Submodule directories must match `^[a-zA-Z0-9_]+$`. Skill domain folders must match `^[a-z0-9_]+$`.
**Rationale**: Keeps the folder structure uniform and easily scan-able by validation regex checks.
**Example (Correct)**:
`02_SKILLS/04_SKILL_DOMAINS/ROBOTICS_ENGINEERING/cad_design/`
**Example (Violation)**:
`02_SKILLS/04_SKILL_DOMAINS/ROBOTICS_ENGINEERING/CadDesign/`

## Rule 2: File Naming Conventions
**Severity**: ERROR
**Description**: Javascript files must use snake_case or kebab-case: `^[a-z0-9_-]+\.js$`. YAML files must match `^([a-z0-9_\.-]+|MANIFEST|RECOVERY_MASTER|SYSTEM_DNA)\.ya?ml$`.
**Rationale**: Guarantees file naming compatibility across case-insensitive filesystems (like Windows/macOS) and case-sensitive environments (Linux).
**Example (Correct)**:
`dag_engine.js`, `validation_pipeline.js`
**Example (Violation)**:
`dagEngine.js`, `ValidationPipeline.JS`

## Rule 3: Schema Naming Standard
**Severity**: WARNING
**Description**: JSON Schema definition files under the validation core must end with `_schema.json`.
**Rationale**: Helps developers and scripts quickly identify schema validation files from standard data configs.
**Example (Correct)**:
`agent_schema.json`, `config_schema.json`
**Example (Violation)**:
`agent_contract.json`, `config.json`
