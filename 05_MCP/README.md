# 🔌 Module 05: Model Context Protocol (MCP)

## 🌌 Overview

The **Model Context Protocol (MCP)** module connects LLM-driven agents to local databases, development environments, and hardware simulators. Rather than writing custom API wrappers for every agent and tool, the system utilizes the standardized MCP interface. This architecture separates tool definitions from agent code and implements uniform validation, permission, and security controls.

---

## 📂 MCP Directory Layout

The module contains the core protocol files, server catalogs, and profile definitions:

*   **`01_MCP_KERNEL/`**: Core connection hubs, client managers, and security boundary checkers.
    *   [[05_MCP/01_MCP_KERNEL/MCP_INTEGRATION_GUIDE|MCP_INTEGRATION_GUIDE.md]]: How to register and expose new servers.
    *   [[05_MCP/01_MCP_KERNEL/MCP_SECURITY_MODEL|MCP_SECURITY_MODEL.md]]: Sandbox guidelines and permission scopes.
*   **`02_STANDARD_MCPS/`**: Standard community servers (e.g. SQLite adapters, Puppeteer, local file search).
*   **`03_CUSTOM_MCPS/`**: In-house proprietary tools (e.g., custom CAD tools, kinematics calculators).
*   **`04_PROJECT_MCP_PROFILES/`**: Project-specific server settings, specifying which tools are activated for which workspace.

---

## 🏗️ Architecture

```
+----------------+      +---------------+      +----------------------+
| Subagent calls | ---> | MCP client    | ---> | Local Host           |
| (e.g., code    |      | (Validation   |      | (Sandbox execution,  |
|  engineer)     |      |  & Security)  |      |  Filesystem, DB)     |
+----------------+      +---------------+      +----------------------+
```

*   **Schema-First Interactions**: Dynamic tool schemas are fetched from the active servers at startup.
*   **Audit Logging**: Tool calls, arguments, and return statuses are recorded in `12_SYSTEM_LOGS`.
*   **Least-Privilege Routing**: Subagents are restricted to the tools declared in their `permissions.yaml` configurations.