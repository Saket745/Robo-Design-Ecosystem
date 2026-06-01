# 📝 Module 12: System Logs

## 🌌 Overview

The **System Logs** module is the central repository for execution telemetry, security audits, and validation records across the Antigravity platform. Structured logging allows both developers and validation agents to inspect execution traces and reconstruct system events.

---

## 📂 Submodule Structure

*   **`LOGGING_PROTOCOL.md`**: Specification defining log classification (Audit, Execution, Security, Recovery) and JSON formatting rules.
*   **`audit.log`**: Append-only log recording high-level agent tasks and state transitions.
*   **`execution.log`**: Run metrics, timeouts, and process outputs from sandboxed slots.
*   **`security.log`**: Logs detailing access violations, blocked path attempts, and API credential requests.

For formatting schemas and log rotation rules, see [[LOGGING_PROTOCOL]].