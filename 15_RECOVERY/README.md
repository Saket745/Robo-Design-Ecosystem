# 🩺 Module 15: Recovery

## 🌌 Overview

The **Recovery** module coordinates system restores, state rollbacks, and workspace repairs when critical failures occur. It works in conjunction with the State Manager and Backups module to revert project settings and verify system stability.

---

## 📂 Submodule Content

*   **`RECOVERY_PROTOCOL.md`**: Specification defining recovery trigger conditions, chronological recovery steps, and dry-run unlocks.
*   **`repair_logs/`**: Detailed traceback files and logs generated during system restorations.

For recovery steps and triggers, see [[RECOVERY_PROTOCOL]].