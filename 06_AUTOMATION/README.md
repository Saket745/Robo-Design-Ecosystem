# 🤖 Module 06: Automation

## 🌌 Overview

The **Automation Module** manages event-driven background processes, file watchers, and cron-scheduled tasks. It enables the Antigravity platform to run background checks, automate workspace builds, parse documents, and trigger backup scripts without active human intervention.

---

## 📂 Automation Directory Layout

The module contains workflow templates and scheduled jobs:

*   **`01_WORKFLOWS/`**: Defines automated pipelines triggered by events (e.g., git commits, file updates, or schema changes).
    *   [[06_AUTOMATION/01_WORKFLOWS/AUTOMATION_FRAMEWORK|AUTOMATION_FRAMEWORK.md]]: Technical specification of the automation triggers, handlers, and security constraints.
*   **`02_CRON_JOBS/`**: Houses time-based background schedules (e.g., daily database cleaning, weekly backups, system checkouts).

---

## 🏗️ Event-Driven Model

Automation works on an **Event-Handler model**:

```
[Event Trigger (e.g. file edit)] ---> [Automation Dispatcher] ---> [Validation Filter] ---> [Execute Workflow]
```

1.  **Event Capture**: File-system watchers (e.g., Chokidar) or timer hooks capture file edits, state changes, or time events.
2.  **Filter/Validation**: The Event Dispatcher checks the event against the Security and Validation rules. Unregistered scripts are blocked.
3.  **Task Dispatch**: Triggered tasks are formatted as steps, sorted, and submitted to the Execution Engine (`09_EXECUTION_ENGINE`).
4.  **Logging**: Workflow completions, stdout traces, and errors are written to `12_SYSTEM_LOGS/automation.log`.