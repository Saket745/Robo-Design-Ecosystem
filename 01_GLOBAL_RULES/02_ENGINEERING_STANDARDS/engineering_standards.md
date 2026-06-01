# 🛠️ Engineering Standards

## 1. Language-Specific Guidelines

### JavaScript / TypeScript (Node.js)
*   **Version**: Node.js v18 LTS or higher.
*   **Syntax**: Modern ES6+ syntax (async/await, destructuring, arrow functions). Prefer Clean Code practices.
*   **Typing**: If using TypeScript, avoid `any` cast. Always define interfaces/types.
*   **Errors**: Do not swallow exceptions. Always throw descriptive errors or return structured error states.

### YAML / JSON
*   **Format**: Double spaces for indentation. Never use tabs.
*   **Consistency**: Keys must follow lower_snake_case.
*   **Comments**: Include comments in YAML to explain complex configurations or constants.

### Markdown
*   **Format**: Use standard GitHub Flavored Markdown (GFM).
*   **Linking**: Use Obsidian double-bracket `[[wikilinks]]` for internal reference links.

---

## 2. Formatting & Documentation Style

*   **Indentation**: 2 spaces for JS/JSON/YAML, 4 spaces for Python.
*   **Documentation Integrity**: Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless specified otherwise.
*   **Self-Documenting Code**: Choose descriptive variable and function names. A function name should state exactly what it does (e.g. `validateSchema` instead of `chk`).
*   **Comments**: Use comments to explain *why* something is done, not *what* is done.

---

## 3. Testing Protocols

*   **Unit Tests**: Every new feature or skill must have associated unit tests.
*   **Mocking**: External APIs, system configurations, and environment configurations must be mocked during testing to ensure tests run offline.
*   **Coverage**: Target a minimum of 80% test coverage for operational modules.
*   **Command execution**: Run verification commands or scripts to validate code changes prior to pushing changes.

---

## 4. Quality Gates

Before code can be integrated into the main execution branches:
1.  **Linter Pass**: Zero linting warnings or errors.
2.  **Test Suite Pass**: All local and integrated tests must pass.
3.  **Schema Check**: All JSON/YAML schemas matching the modifications must pass validation.
4.  **Dry-Run Simulation**: The execution engine should execute a dry-run DAG verification to ensure no failures.
