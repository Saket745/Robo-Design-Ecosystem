# ⚙️ Execution Policies

## 1. Execution Gates

All system tasks and scripts must pass through pre-execution and post-execution gates before they are marked as completed.

### Pre-Execution Gates
Before any code block is run in the host or sandbox environment:
1.  **State Verification**: The execution engine reads the active project state and verifies its checksum.
2.  **Schema Check**: Task input arguments are verified against the specific execution schema.
3.  **Dependency Verification**: Check that all libraries, directories, and files needed are present.
4.  **Sandbox Isolation**: Verify that sandbox variables and isolation environments are initialized.

### Post-Execution Gates
After execution is completed:
1.  **Execution Output Verification**: Check that the output format conforms to expectations.
2.  **State Delta Validation**: Generate a state diff, ensuring that only expected keys have been updated.
3.  **Logs Committal**: Commit structured logs and audit trail updates.
4.  **State Save**: Commit changes to the State Manager and write the state checksum.

---

## 2. Rollback Triggers

An execution step rollback is automatically triggered under the following conditions:
*   **Uncaught Exceptions**: Runtime crashes or unhandled script failures.
*   **Post-Gate Failure**: The execution output fails schema verification or violates system security boundaries.
*   **Timeout Limits Exceeded**: A step runs longer than its designated timeout parameter (default: 300 seconds).
*   **State Contamination**: Post-execution checks reveal that files inside immutable zones or unauthorized project zones were modified.

### Rollback Process
When triggered, the State Manager:
1.  Terminates active processes inside the sandbox.
2.  Restores the database or project configuration file from the pre-execution backup.
3.  Deletes any partial output files created during the failed step.
4.  Logs a detailed error message and halts execution.

---

## 3. Retry and Recovery Strategies

*   **Max Retry Limits**: By default, a failing task can be retried up to **3 times**.
*   **Exponential Backoff**: If a step fails due to external resources or API timeouts, retries must use exponential backoff:
    $$\text{delay} = \text{initial\_delay} \times 2^{\text{retry\_count}}$$
*   **Manual Escalation**: If all retries fail, the system is paused, and control is returned to the user.
*   **No Auto-Override**: Retries must never modify the code automatically to bypass validation errors. Code edits must go through the standard planning-review cycle.
