# 🏛️ Architecture Rules

## 1. Modularity Enforcement

*   **Stateless Capability Rules**: All core logic and computational routines must be exposed as reusable, stateless modules called **Skills**. Business logic must not reside inside subagents.
*   **Encapsulation**: No internal modules should expose private properties or undocumented exports. All external interactions must go through official exports (e.g. `index.js` or `api.js` entry points).
*   **Separation of Concerns**: Single responsibilities only. No script or directory should handle both data management (e.g. memory database storage) and presentation (e.g. dashboard rendering).

---

## 2. Layer Boundary Contracts

To maintain system integrity, boundaries must be enforced:

1.  **Core Governance Layer** (`00_CORE_BRAIN`, `01_GLOBAL_RULES`):
    *   No dependencies on operations, infrastructure, or support layers.
    *   Read-only at runtime by all agents, except during system-wide version updates.
2.  **Operational Layer** (`02_SKILLS`, `03_SUBAGENTS`, `04_MEMORY`, `05_MCP`):
    *   Can depend on Core Governance.
    *   Exposes APIs for execution.
    *   No direct file manipulation of core files or infrastructure components.
3.  **Infrastructure Layer** (`06_AUTOMATION` to `11_KNOWLEDGE_GRAPH`):
    *   Acts as the execution and validation pipeline.
    *   Controls runtime sandboxing and state commits.
    *   Should remain domain-agnostic (does not know about "robotics", "e-commerce", etc.).
4.  **Support Layer** (`12_SYSTEM_LOGS` to `17_SECRETS`):
    *   Provides utilities like backups, logging, sandbox files, config files, and credentials.
    *   Accessed only via official access-control protocols.

---

## 3. Directed Acyclic Graph (DAG) Constraints

*   **No Circular Dependencies**: Circular imports (e.g., A imports B, B imports A) are strictly prohibited.
*   **Verification**: The validation tool checks all imports and exports on every file modification. A circular import triggers an immediate compilation/runtime rejection.
*   **Import Trees**: Higher-numbered modules may import lower-numbered modules (e.g., `09_EXECUTION_ENGINE` can import from `04_MEMORY`), but lower-numbered modules must never import from higher-numbered modules.

---

## 4. Component Interfaces

*   **Schema Enforcement**: All inter-module communication is done via defined structures.
*   **Communication Contract**: JSON/YAML is the only acceptable transport layout. Arguments must be schema-validated before any method is invoked.
