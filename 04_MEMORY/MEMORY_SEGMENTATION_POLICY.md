# 🔒 Memory Segmentation Policy

## 1. Namespace Separation

To prevent agents from confusing project contexts or leaking information across client workspaces, the Memory OS enforces namespace segregation.

*   **Namespace Structure**: Memory files are organized under specific directories mapping to project IDs:
    `04_MEMORY/02_PROJECT_MEMORY/<project_id>/`
*   **Contamination Checks**: The retrieval engine rejects any search query that does not supply a valid `project_id`. The returned vectors are restricted to matches containing the query's `project_id`.
*   **Sandbox Isolation**: Runtimes execute inside independent workspaces. Temporary execution files must be kept inside the project sandbox directory.

---

## 2. Access Permissions by Agent Role

Agents operate with distinct read and write permissions in the Memory OS:

| Agent Role | Global Memory | Reusable Patterns | Project Memory (Active) |
| :--- | :--- | :--- | :--- |
| **Master Orchestrator** | Read/Write | Read/Write | Read/Write |
| **Planner Agent** | Read | Read | Read/Write |
| **Code Engineer Agent** | Read | Read/Write | Read/Write (Code only) |
| **Validation Agent** | Read | Read | Read |
| **Documentation Agent** | Read | Read | Read/Write (Docs only) |

---

## 3. Storage Schemas

### Episodic Memory Object Schema
All episodic memory blocks committed to `04_MEMORY/02_PROJECT_MEMORY/` must match the following format:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "task_id": { "type": "string" },
    "project_id": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "agent_id": { "type": "string" },
    "summary": { "type": "string" },
    "steps_taken": {
      "type": "array",
      "items": { "type": "string" }
    },
    "state_deltas": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "required": ["task_id", "project_id", "timestamp", "agent_id", "summary", "steps_taken"]
}
```
