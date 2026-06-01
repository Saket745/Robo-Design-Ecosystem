# 📝 Logging Protocol Specification

This document defines the structured logging format, log classification, and log retention rules applied across the Antigravity ecosystem.

---

## 🏛️ Log Classification

Logs are categorized into four distinct streams:

1.  **Audit Logs (`audit.log`)**: Record high-level agent tasks, state updates, and human commands. These must never be altered or cleared.
2.  **Execution Logs (`execution.log`)**: Detail process logs, exit codes, and timing metrics from sandboxed runs.
3.  **Security Logs (`security.log`)**: Track access control violations, blocked path attempts, and API credential requests.
4.  **Recovery Logs (`recovery.log`)**: Document failure details, traceback dumps, and rollback histories.

---

## 📄 Log Formatting (JSON Schema)

All logs are written as single-line JSON records using the following layout:

```json
{
  "timestamp": "2026-06-01T03:32:31.000Z",
  "level": "INFO",
  "module": "09_EXECUTION_ENGINE",
  "event": "state_updated",
  "data": {
    "version": 4,
    "keys_modified": ["completion_map"]
  },
  "context": {
    "project_id": "quadruped_walk",
    "task_id": "scaffold_01"
  }
}
```

### Log Levels
*   `DEBUG`: Granular debugging data (usually disabled in production).
*   `INFO`: Normal execution events (e.g. step started, state committed).
*   `WARN`: Non-fatal issues (e.g. slow response, retry attempt).
*   `ERROR`: Task execution failures or schema violations.
*   `CRITICAL`: System-level failures (e.g. database corruption, sandbox escapes).

---

## ⏳ Log Rotation & Retention

To prevent disk bloating:
*   **Rotation trigger**: Active logs are rotated when they exceed **10MB** in size.
*   **Archiving**: Rotated files are renamed (e.g. `execution.1.log`), compressed using gzip, and kept in `12_SYSTEM_LOGS/archive/`.
*   **Retention Period**:
    *   *Execution logs*: Retained for **14 days**.
    *   *Audit logs*: Retained for **90 days** (archived for historical record).
    *   *Security logs*: Retained for **365 days**.
