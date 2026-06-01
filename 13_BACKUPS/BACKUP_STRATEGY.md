# 💾 Backup Strategy Specification

This specification defines the snapshot frequencies, archival structures, and backup verification protocols applied to the Antigravity platform.

---

## 📅 Backup Cadence & Types

The backup coordinator runs three schedules to protect database states and code changes:

### 1. Incremental State Snapshots (High Frequency)
*   **Trigger**: Automatically fired by the State Manager on every successful `updateState()` commit.
*   **Target**: `09_EXECUTION_ENGINE/05_STATE_MANAGER/robot_project_state.json`
*   **Output Path**: `13_BACKUPS/01_SNAPSHOTS/state_v<version>.json`
*   **Policy**: Immutable snapshot files. Once saved, they are read-only.

### 2. Daily Workspace Backups (Medium Frequency)
*   **Trigger**: Chronological trigger run daily at 02:00 AM.
*   **Target**: The active project source folders and configuration workspaces (excluding `node_modules` and raw log folders).
*   **Output Path**: `13_BACKUPS/02_DAILY/project_<id>_YYYYMMDD.zip`
*   **Policy**: Retained for the last 7 days.

### 3. Weekly Archives (Low Frequency)
*   **Trigger**: Chronological trigger run every Sunday at 03:00 AM.
*   **Target**: Consolidated daily backups and historical audit logs.
*   **Output Path**: `13_BACKUPS/03_WEEKLY/archive_YYYYMMDD_v<version>.tar.gz`
*   **Policy**: Retained for 4 weeks.

---

## ⚡ Pruning & De-duplication

To optimize disk usage, the system prunes old backup files daily:
*   **Daily backups**: Older than 7 days are deleted.
*   **Weekly archives**: Older than 28 days are deleted.
*   **Version snapshots**: Snapshots older than 30 versions are consolidated into weekly archives, keeping only the final version snapshot of each day.

---

## 🔬 Integrity Verification

Backups are verified daily:
1.  **Checksum Generation**: When a backup is created, the system generates a SHA-256 hash.
2.  **Validation Scan**: A cron validator attempts to unpack the latest archive in `14_SANDBOX` and verify that the hashes match.
3.  **Corruption Alert**: If a hash mismatch or decompression error is found, the system logs a critical warning and alerts the user.
