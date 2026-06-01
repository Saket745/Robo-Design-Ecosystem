# 🩺 Recovery Protocol Specification

This document defines the disaster recovery steps, data repair workflows, and rollback procedures triggered during critical system failures.

---

## 🚨 Recovery Trigger Conditions

The recovery pipeline is initialized when any of the following critical failures are detected:
*   **State Checksum Mismatch**: The active state file does not match its computed SHA-256 checksum.
*   **Sandbox Traversal Alert**: An agent or process attempts to escape the directory jail, triggering an emergency lock.
*   **Validation Failure Loop**: A task fails Gate 5 (Execution) or Gate 6 (Recovery) more than 3 consecutive times.
*   **Database Corruption**: SQLite database tables are unreadable or corrupt.

---

## 🔄 Chronological Recovery Process

When the recovery system is triggered, it executes these five steps:

```
[1. emergency_halt] -> [2. clean_runtimes] -> [3. resolve_stable_version]
                                                        |
[5. dry_run_verify] <------------------------ [4. restore_snapshot]
```

### Step 1: Emergency Halt
1.  Sends immediate `SIGKILL` signals to all active subagents and MCP child processes.
2.  Locks the task dispatcher queue, preventing new steps from starting.

### Step 2: Clean Runtimes
1.  Deletes all files in the `14_SANDBOX` slots.
2.  Closes open database connections and clears the in-memory cache.

### Step 3: Resolve Last Stable Version
1.  Scans `13_BACKUPS/01_SNAPSHOTS/` for version files (`state_v<version>.json`).
2.  Reads them in reverse chronological order, checking their checksums until it identifies the latest uncorrupted snapshot.

### Step 4: Restore Snapshot
1.  Calls `state_manager.js rollback <version>` to overwrite the active state file with the resolved stable version.
2.  Restores project files modified during the failed step using daily zip archives.

### Step 5: Dry-Run Verification
1.  Triggers a validation check against the restored files.
2.  If the checks pass, unlocks the task dispatcher queue. If verification fails, escalates the warning to the user and remains locked.
