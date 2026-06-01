# 🤖 Automation Framework Specification

This specification defines the triggers, lifecycle events, and security constraints governing background automation and file watching.

---

## 🏛️ Event Triggers

The dispatcher listens for three primary trigger classes:

### 1. File Watchers (Change Events)
*   **Implementation**: Utilizes filesystem listeners (e.g. `chokidar` in Node.js) to monitor workspace paths.
*   **Triggers**:
    *   `on_create`: Fires when a new specification document or file is saved.
    *   `on_change`: Fires when files in active project workspaces are edited.

### 2. State Triggers (Lifecycle Events)
*   **Implementation**: Hooked into the State Manager updates.
*   **Triggers**:
    *   `on_state_version_change`: Fires when the state version is incremented.
    *   `on_milestone_completion`: Fires when a key task (e.g. `scaffold` or `validation`) completion score becomes `1.0`.

### 3. Chronological Triggers (Time Events)
*   **Implementation**: standard cron-like parser (e.g. `node-cron`).
*   **Triggers**:
    *   `daily`: Executes daily snapshot cleanups and validation scans.
    *   `weekly`: Compresses episodic memory logs and compiles system-wide audit reports.

---

## 🔄 Startup Boot Sequence

When the platform CLI starts up, the dispatcher runs the following boot hook sequence:

1.  **System Check**: Scans `09_EXECUTION_ENGINE/05_STATE_MANAGER/robot_project_state.json` to load the current version and configuration metrics.
2.  **Schema Check**: Validates active files to verify that no manual alterations broke validation rules.
3.  **Active Watcher Init**: Initializes watchers on project directories.
4.  **Cron Scheduler Init**: Spawns background threads for daily/weekly maintenance tasks.

---

## 🔒 Security & Loop Guardrails

To prevent background tasks from consuming excessive system resources or entering infinite loops:
*   **Maximum Runtime Limit**: Automated tasks must complete in **180 seconds** (3 minutes). If exceeded, the process is killed.
*   **Rate Limiting**: Watcher events on the same file are debounced by **1500ms** to prevent multiple runs during save cycles.
*   **Prohibited Actions**: Background scripts are forbidden from calling npm/pip installations or executing git push commands without explicit, manual confirmation from the user.
