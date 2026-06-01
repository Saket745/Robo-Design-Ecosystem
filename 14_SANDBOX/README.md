# 📦 Module 14: Sandbox

## 🌌 Overview

The **Sandbox** module is the secure execution environment of the Antigravity platform. All third-party skills, test suites, and agent scripts are executed within isolated sandbox folders (slots) to protect the host filesystem and network connections.

---

## 📂 Sandbox Directories & Specs

*   **`slot_01/`, `slot_02/`**: Isolated directory slots where code runtimes are executed.
*   **`temp/`**: Folder for temporary compiler targets and test assets.
*   **`SANDBOX_SPEC.md`**: Specification defining path constraints, network blocking, and environment variable filtering.

For slot allocations and resource limits, see [[SANDBOX_SPEC]].