# 🛠️ MCP Integration Guide

This guide describes how to register, configure, and integrate new Model Context Protocol (MCP) servers into the Antigravity system.

---

## 🚀 Integration Steps

### Step 1: Place Server Assets
Place the server code or executable in the appropriate directory:
*   Standard community servers go in `05_MCP/02_STANDARD_MCPS/`
*   Custom/in-house servers go in `05_MCP/03_CUSTOM_MCPS/`

### Step 2: Configure the Profile
Define connection parameters in the project's profile settings. For example, in `05_MCP/04_PROJECT_MCP_PROFILES/robotics/profile.yaml`:

```yaml
mcp_servers:
  sqlite_db:
    command: "node"
    args:
      - "c:/Users/mssak/OneDrive/Desktop/Robo Model/antigravity-platform/05_MCP/02_STANDARD_MCPS/sqlite/dist/index.js"
      - "c:/Users/mssak/OneDrive/Desktop/Robo Model/database.db"
    env:
      DB_TIMEOUT: 5000
    status: active

  robotics_solver:
    command: "python"
    args:
      - "c:/Users/mssak/OneDrive/Desktop/Robo Model/antigravity-platform/05_MCP/03_CUSTOM_MCPS/solver.py"
    status: active
```

### Step 3: Test Connections
Use the CLI tool to verify connectivity, retrieve tool schemas, and test execution results:
```powershell
node scripts/mcp_test.js --server sqlite_db
```

---

## 🔌 Connection Protocols

The platform supports two transport layers:

### 1. Standard Input/Output (stdio)
*   **Best for**: Fast, local helper tools running on the host machine.
*   **Details**: The MCP client launches the server as a child process and reads/writes messages over `stdin` and `stdout`.

### 2. Server-Sent Events (sse)
*   **Best for**: Networked databases, cloud platforms, or shared local servers.
*   **Details**: The client connects to an HTTP server and listens to an SSE stream for server events, sending requests via HTTP POST.
