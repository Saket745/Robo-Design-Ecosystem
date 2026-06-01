# 📦 Sandbox Specification

This document details the configuration, security boundaries, and cleanup protocols applied to the isolated task runner environment.

---

## 📂 Sandbox Workspace Directory

All sandboxed executions run within this directory:
`c:/Users/mssak/OneDrive/Desktop/Robo Model/antigravity-platform/14_SANDBOX/`

The folder is structured into isolated slots:
```
14_SANDBOX/
├── slot_01/  <-- Executing Kinematics Solver
├── slot_02/  <-- Executing Unit Tests
└── temp/     <-- Intermediate build targets
```

---

## 🔒 Security Restrictions

### 1. Filesystem Jail
*   **Virtual Root**: Process runtimes resolve file paths relative to their assigned execution slot (e.g. `slot_01/`).
*   **Absolute Path Blocking**: System calls attempting to read from `C:/` or mount other folders are blocked by the OS-level subprocess user restrictions.

### 2. Network Isolation
*   **Localhost Only**: Subprocesses are spawned without internet gateways. They can query local loopback ports (e.g. `127.0.0.1:50051` for MCP connections) but cannot resolve external domains.
*   **Port Firewalls**: Active firewall rules block inbound connections to sandbox slots.

### 3. Resource & Memory Limits
To prevent system lockups:
*   **Maximum CPU Limit**: A sandbox process is restricted to 2 CPU cores.
*   **Memory Cap**: Node.js and Python runtimes are capped at **2GB RAM** (e.g. `--max-old-space-size=2048`).
*   **File Handle Cap**: Capped at 256 open descriptors.

---

## 🧹 Sandbox Cleanup Protocol

To maintain a clean state, the system executes a cleanup script after each step:
1.  **Stop Processes**: Terminate any running child threads in the sandbox slot.
2.  **Clear Temporary Files**: Delete compile caches, intermediate build files, and log dumps.
3.  **Sanitize Slots**: Re-initialize the slot directory with a fresh copy of the workspace configuration files.
