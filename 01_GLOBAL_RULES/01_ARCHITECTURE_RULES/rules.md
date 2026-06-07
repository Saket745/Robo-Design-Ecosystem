# Architecture Rules

## Rule 1: Downward Layer Imports Only
**Severity**: ERROR
**Description**: High governance layers (lower index, e.g. Tier 1, 2) can import lower governance layers (higher index, e.g. Tier 3, 4). A higher-index tier (e.g. Tier 4 Support) is strictly prohibited from statically importing a lower-index tier (e.g. Tier 1 Governance).
**Rationale**: Prevents circular dependencies and maintains clean separation of concerns in the governance/execution hierarchy.
**Example (Correct)**:
```javascript
// Inside Tier 3: 09_EXECUTION_ENGINE/02_DAG_ENGINE/dag_engine.js (Tier 3)
// Importing Tier 4: 16_CONFIG/workspace.config.yaml (Tier 4) is permitted.
```
**Example (Violation)**:
```javascript
// Inside Tier 4: 12_SYSTEM_LOGS/01_AUDIT_LOGS/audit_logger.js (Tier 4)
// Importing Tier 1: 00_CORE_BRAIN/ SYSTEM_DNA.yaml (Tier 1) is forbidden.
```

## Rule 2: No Circular Dependencies
**Severity**: ERROR
**Description**: No circular dependencies are allowed in the skills dependency graph or static module require imports.
**Rationale**: Circular dependencies cause stack overflows, memory leaks, and unpredictable initialization.
**Example (Correct)**:
`A depends on B, B depends on C.`
**Example (Violation)**:
`A depends on B, B depends on C, C depends on A.`

## Rule 3: Single Point of Entry for Domain Skills
**Severity**: WARNING
**Description**: All domain skill folders must have a single `skill.md` entrypoint.
**Rationale**: Keeps skill registration and dynamic routing predictable and standardized.
**Example (Correct)**:
`02_SKILLS/04_SKILL_DOMAINS/ROBOTICS_ENGINEERING/cad_design/skill.md`
**Example (Violation)**:
`02_SKILLS/04_SKILL_DOMAINS/ROBOTICS_ENGINEERING/cad_design/extra_skill_description.md`
