# 👑 Master Orchestrator Protocol

## 1. Role & Responsibility

The **Master Orchestrator** is the core director of the Antigravity multi-agent workspace. It acts as the primary interface between the user/event-trigger and the specialized subagents, managing the planning, execution, and validation cycles.

---

## 2. Document Processing & Task Pipeline

When a new engineering goal or specification is submitted:

```
[User Spec] -> [Parser] -> [Decomposer] -> [DAG Builder] -> [Subagent Dispatch]
```

1.  **Specification Parsing**: Read and parse the input document or instruction set, checking formatting and extracting requirements.
2.  **Scope Decomposition**: Route the parsed requirements to the `planner_agent` to split the task into sequential, independent milestones.
3.  **DAG Construction**: Convert the milestones into a Directed Acyclic Graph (DAG) using the DAG Engine (`09_EXECUTION_ENGINE`). Steps represent individual subagent task calls.
4.  **Subagent Dispatch**: Instantiate and monitor the required specialized agents (e.g. `architect_agent`, `code_engineer_agent`) to execute specific DAG nodes.
5.  **State Consolidation**: Collate results from completed nodes, verify output schemas, and trigger state saves.

---

## 3. Dynamic Skill Activation

The Orchestrator determines which skills are needed for a task:
*   Queries the **Semantic Router** (`02_SKILLS/02_AGENTIC_ROUTING`) with the task step description.
*   Resolves routing requests by dynamically loading the skill's `dependencies.yaml` and checking permission requirements.
*   Enforces sandbox execution rules for skills that are classified as untrusted or restricted.

---

## 4. Conflict Resolution Strategies

When multiple subagents propose conflicting changes (e.g. modifying the same source file, or conflicting state parameters):

*   **File Write Lock**: The orchestrator grants write permissions for specific files to only one subagent at a time. Other agents requesting access are queued.
*   **State Diffs Verification**: State changes are compared line-by-line. If a state property is modified concurrently, the orchestrator triggers the `validation_agent` to resolve the conflict.
*   **State Rollback**: In the event of a validation fail or collision, the orchestrator halts execution, rolls back to the last known stable state, and recalculates the planning DAG.
*   **User Escalation**: If conflicts cannot be resolved automatically, the system is paused, and the state diff is presented to the User for approval.
