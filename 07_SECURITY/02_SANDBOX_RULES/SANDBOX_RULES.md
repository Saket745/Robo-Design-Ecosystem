# 🛡️ Sandbox Rules Specification

This document defines the filesystem, network, and environment constraints applied to processes executing inside the isolated runner environment.

---

## 📂 Path Constraints

All sandboxed executions must run within the designated sandbox folder:
`c:/Users/mssak/OneDrive/Desktop/Robo Model/antigravity-platform/14_SANDBOX/`

*   **Path Traversal Prevention**: File access requests are parsed using absolute paths. Paths containing double dots (e.g. `..`) are normalized. If the resolved path does not start with the sandbox path or the designated active project folder, the execution is blocked.
*   **Write Restriction**: Sandboxed processes have read/write access *only* within the sandbox path and active project workspace subfolders. Attempts to write to system directories (e.g. `C:\Windows` or system root) trigger process termination.

---

## 🌐 Network Rules

*   **Outbound Block**: By default, the sandbox environment blocks all outbound TCP and UDP network connections.
*   **DNS Resolution**: External DNS lookups are blocked. Localhost connections are permitted only for registered services (e.g., local database servers or simulator interfaces).
*   **Whitelisting**: Any skill or server requiring internet access (e.g., retrieving online libraries or connecting to remote APIs) must declare it in `dependencies.yaml`. The orchestrator will verify this flag and prompt the user for permission prior to starting execution.

---

## 🧹 Environment Filtering

To prevent API tokens or environment passwords from leaking into logs or code files:
*   **Secret Scrubbing**: The runtime manager strips all environment variables starting with `SECRET_`, `KEY_`, `PASS_`, or `TOKEN_` before passing `process.env` to a sandboxed process.
*   **Explicit Injection**: Only environment variables defined in the task step schema are injected.
*   **Console Interception**: `stdout` and `stderr` streams are scanned for credential-like patterns (e.g. high-entropy strings, base64 blocks, private key headers) and masked before being logged.
