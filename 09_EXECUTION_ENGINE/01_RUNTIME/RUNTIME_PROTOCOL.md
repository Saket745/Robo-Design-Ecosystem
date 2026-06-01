# ⚙️ Runtime Protocol

## 1. Execution Environments

The **Runtime** submodule manages the instantiation and lifecycle of step execution processes. Runtimes must execute within the designated sandbox area (`14_SANDBOX`) to protect the host OS.

*   **Node.js Runtime**: Used for orchestrators, state management, and tooling scripts.
*   **Python Runtime**: Used for AI solvers, mathematical computations, and data analytics.
*   **Isolated Shells**: Subprocess shells are spawned with environment configurations containing only the variables explicitly registered for the task step.

---

## 2. Process Lifecycle Management

```
[Spawn Subprocess] ---> [Monitor Resources & Timeouts] ---> [Catch Signals / Errors] ---> [Collect Exit Code]
```

### Timeout Limits
By default, execution steps are bound by a **300-second (5-minute) timeout limit**. 
*   If a process exceeds this limit, the runtime sends a termination signal (`SIGKILL` or Windows taskkill).
*   The step is marked as failed, and the rollback pipeline is initialized.

### Signal Handling
Runtimes trap the following signals to prevent orphaned processes and memory leaks:
*   **`SIGINT` / `SIGTERM`**: Instructs the child process to release database hooks, save current logs, and exit cleanly within 5 seconds. If the process does not terminate, it is killed.
*   **`SIGSEGV` / Crashes**: Caught as uncaught exceptions, triggering immediate cleanup and rollback.

---

## 3. Failure Recovery & Post-Mortem

When a process exits with a non-zero code or fails a validation gate:
1.  **Stop Execution**: Kill all running sister processes in the current DAG layer.
2.  **Dump Diagnostic Logs**: Write the stderr output, active environment variables (excluding secrets), and execution trace details to `12_SYSTEM_LOGS/crashes/`.
3.  **Initiate Rollback**: Call the State Manager (`09_EXECUTION_ENGINE/05_STATE_MANAGER`) to revert project files and DB states to the last successful checkpoint.
4.  **Escalate**: Send status reports to the Master Orchestrator, pausing the queue for user review.
