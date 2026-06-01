# 🔒 MCP Security Model

## 1. Permission Scoping

Model Context Protocol (MCP) servers run with restricted access to system resources.

*   **Explicit Registration**: An agent cannot call a tool unless it is explicitly declared in the agent's `permissions.yaml` file.
*   **Method Scoping**: Permissions are restricted down to specific methods (e.g. an agent may call `read_query` but is blocked from calling `write_query` on a database server).
*   **Argument Masking**: Sensitive fields, such as database passphrases or API tokens, must be masked in log files.

---

## 2. Sandbox Isolation

*   **Directory Jails**: File-system-interacting tools must resolve all paths relative to the project directory. Path resolution that escapes this directory (e.g. `../../etc`) triggers an immediate termination error.
*   **Network Guardrails**: External HTTP/WebSocket network calls from servers are blocked by default. Any server requiring network access must be registered as `internet_access: true` in the profile and requires explicit user authorization at startup.
*   **Process Restraints**: MCP server processes run inside sandboxed environments with low system priority and minimal OS user permissions.

---

## 3. Tool Authorization & Verification Limits

The client client-gate validates every tool request against safety guidelines:

| Safety Level | Action Type | Trigger Condition |
| :--- | :--- | :--- |
| **Level 1 (Auto)** | Read-Only | Reading schemas, querying local databases, requesting model states. |
| **Level 2 (Verify)** | Write-Only | Modifying files, creating database entries, executing local scripts. |
| **Level 3 (Prompt)** | Core/System Change | Altering Git repositories, modifying platform rules, importing external binary files. |

*   **Level 3 Prompt**: Requires the client to pause execution, display the proposed command and parameters to the user, and wait for manual approval.

---

## 4. Execution Audit Logging

Every tool call triggers an append-only audit log in `12_SYSTEM_LOGS/mcp_audit.log`:

```json
{
  "timestamp": "2026-06-01T03:32:31Z",
  "agent_id": "code_engineer_agent",
  "server_id": "sqlite_db",
  "tool_name": "execute_query",
  "arguments": {
    "sql": "SELECT * FROM joints LIMIT 5;"
  },
  "status": "success",
  "duration_ms": 12
}
```
