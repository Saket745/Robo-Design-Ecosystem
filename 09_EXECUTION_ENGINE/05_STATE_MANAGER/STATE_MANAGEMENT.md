# 💾 State Management Specification

The **State Manager** is the data persistence kernel of the Antigravity platform. It maintains project variables, tracks task completions, and manages rollbacks by saving incremental snapshot files during execution.

---

## 📂 File Map & Locations

*   **Active State File**: `09_EXECUTION_ENGINE/05_STATE_MANAGER/robot_project_state.json`
*   **Snapshot Backups**: `13_BACKUPS/01_SNAPSHOTS/state_v<version>.json`
*   **State Code Hook**: `09_EXECUTION_ENGINE/05_STATE_MANAGER/state_manager.js` (delegates to `scripts/state_manager.js`)

---

## 🧱 State Schema

The system state is represented by the following JSON structure:

```json
{
  "robot_type": "quadruped",
  "purpose": "indoor navigation + interactive mobile species",
  "version": 12,
  "timestamp": "2026-06-01T03:32:31.000Z",
  "docs_processed": ["SYSTEM_CONSTITUTION.md"],
  "skills_activated": ["robotics_kinematics"],
  "completion_map": {
    "scaffold": 1.0,
    "core_brain": 1.0,
    "global_rules": 1.0,
    "skills": 0.5,
    "subagents": 0.4,
    "memory": 0.5,
    "validation": 0.2,
    "execution": 0.3,
    "dashboard": 0.0
  },
  "history": [
    {
      "version": 11,
      "timestamp": "2026-06-01T03:20:00.000Z",
      "changes": ["skills_activated"]
    }
  ]
}
```

---

## 🔄 Operations & Transactions

### 1. `getState()`
Reads the active state file. If the file is missing or corrupt, it writes and returns a default state template.

### 2. `updateState(updates)`
Executes transactional updates:
1.  Loads the current state file.
2.  Increments the `version` number.
3.  Merges modifications into the state, including partial updates to the `completion_map`.
4.  Appends a record of the changed keys to the `history` array (capped at the last 50 commits).
5.  Saves the updated state to the active state file.
6.  Saves a backup copy as `state_v<version>.json` in the snapshots folder.

### 3. `rollback(targetVersion)`
Reverts the project state:
1.  Locates the snapshot matching `targetVersion` inside `13_BACKUPS/01_SNAPSHOTS/`.
2.  Asserts path safety to prevent directory traversal.
3.  Overwrites the active state file with the snapshot content.

---

## 💻 CLI Commands

The State Manager script can be executed directly from the terminal to inspect or manipulate the system state:

```powershell
# Retrieve current state in JSON format
node scripts/state_manager.js get

# Commit updates
node scripts/state_manager.js update '{"skills_activated": ["pcb_design"]}'

# Revert to version 5
node scripts/state_manager.js rollback 5
```
