# 🏷️ Naming Conventions

## 1. Directory Naming standards

*   **Top-level Folders (Tiers)**: Must begin with a two-digit prefix indicating layer order, followed by uppercase snake case (e.g. `00_CORE_BRAIN`, `03_SUBAGENTS`, `17_SECRETS`).
*   **Submodules**: Use uppercase snake case with numbers when specifying sequence or priority (e.g. `00_AGENT_KERNEL`, `01_COORDINATION_AGENTS`).
*   **Domain Directories**: Use lowercase snake case for domain-specific files (e.g. `kinematics_agent`, `quadruped_agent`).

---

## 2. File Naming Rules

### Scripts & Source Files
*   **JavaScript/TypeScript**: Use camelCase or snake_case consistently within a module. For state manager and orchestrator modules, use `snake_case.js` (e.g., `state_manager.js`, `scaffold.js`).
*   **Python**: Use `snake_case.py`.

### Configuration & Data Files
*   **JSON/YAML Schemas**: Use `snake_case` with lowercase file extensions (e.g. `execution_schema.yaml`, `memory_schema.json`).
*   **Environment Settings**: Use `.env` or `.env.example`.

### Documentation
*   **Standard Documentation**: Use uppercase snake case for overview design documents (e.g. `ARCHITECTURE_OVERVIEW.md`, `DAG_ENGINE_SPEC.md`).
*   **Agent & Skill Specifications**: Use lowercase names for single agent definitions (e.g. `architect_agent.md`) and standard uppercase `README.md` for folder indexes.
*   **Global Rules**: Use lowercase snake case for rules (e.g., `naming_conventions.md`, `architecture_rules.md`).

---

## 3. Code Identifiers & Symbols

*   **Classes**: Use PascalCase (e.g. `StateManager`, `DagEngine`).
*   **Functions**: Use camelCase (e.g. `validateState`, `executeStep`).
*   **Variables**: Use camelCase (e.g. `projectState`, `activeTasks`).
*   **Constants**: Use uppercase snake case (e.g. `MAX_RETRIES`, `DEFAULT_TIMEOUT`).
*   **YAML/JSON keys**: Use lowercase snake case (e.g. `agent_id`, `capabilities`).

---

## 4. Obsidian Backlinking Conventions

*   **Wikilinks Style**: Use double brackets `[[TargetName]]` for links.
*   **Direct Pathing**: Link using file basename without file extension when linking within the same workspace (e.g., `[[naming_conventions]]`).
*   **Aliasing**: Use pipe character `[[Path/To/README|Custom Label]]` to display human-readable labels instead of long system paths.
