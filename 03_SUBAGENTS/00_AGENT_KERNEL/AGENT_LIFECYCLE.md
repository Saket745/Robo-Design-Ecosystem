# 🔄 Agent Lifecycle Specification

This document details the standard lifecycle stages for all subagents operating within the Antigravity framework.

---

## 🗺️ Lifecycle Flow

```
[1. SPAWN] ---> [2. EXECUTE] ---> [3. VALIDATE] ---> [4. PERSIST] ---> [5. TERMINATE]
```

---

## 1. Spawn Phase
When the Master Orchestrator delegates a task step, the Agent Kernel initializes the subagent:
1.  **Identity Loading**: Parse the agent's `capabilities.yaml` and `permissions.yaml` configurations.
2.  **Context Creation**: Allocate local memory slots and pull relevant project state details.
3.  **Sandbox Allocation**: Initialize an isolated execution space inside `14_SANDBOX`.
4.  **Verification Check**: Confirm the agent is authorized to access requested files and commands.

---

## 2. Execute Phase
During execution, the agent works on the task:
1.  **State Loading**: Read `robot_project_state.json` via the State Manager to establish local workspace parameters.
2.  **Intent Parsing**: Analyze the subtask description and match it with registered skills using the Routing Protocol.
3.  **Skill Dispatching**: Call the Execution Engine to run sandboxed skills.
4.  **Logging**: Write step-by-step telemetry and warnings to `12_SYSTEM_LOGS`.

---

## 3. Validate Phase
Before committing any changes, the agent's output undergoes verification:
1.  **Schema Compliance**: Verify output objects match the registered JSON schema in `capabilities.yaml`.
2.  **Linter and Tests**: If code changes were made, execute syntax linters and tests inside the sandbox.
3.  **Boundary Inspection**: Confirm no files in unauthorized directories were modified.
4.  **Self-Scoring**: Compute self-confidence score. If $< 0.8$, escalate to validation agent.

---

## 4. Persist Phase
If validation yields a `Pass` verdict:
1.  **State Delta Committal**: Send the state change payload to the State Manager (`09_EXECUTION_ENGINE/05_STATE_MANAGER`).
2.  **Memory Compression**: Synthesize the steps taken into a semantic block and commit to `04_MEMORY`.
3.  **Artifact Generation**: Save any persistent design files or source files to their workspace paths.

---

## 5. Terminate Phase
After the task is saved:
1.  **Resource Release**: Kill active child processes, release network hooks, and close open file streams.
2.  **Sandbox Reset**: Clean temporary folders inside the sandbox directory.
3.  **Termination Call**: Return execution control to the Master Orchestrator, reporting success or failure.
