# 🔒 Security Policies

## 1. Zero-Trust Local Model

The Antigravity platform operates on a **Zero-Trust Local Model**. Even though all modules are executed locally on the user's host machine:
*   Every agent action and file modification is treated as potentially unsafe until validated.
*   Cross-module API calls must utilize token-authenticated interfaces.
*   No external tool execution (like third-party MCP servers) has read access to the master security key or credential vault.

---

## 2. Secrets Management

*   **Zero Plaintext Secrets**: Writing passwords, API tokens, OAuth keys, or private certificates to source files, configurations, documentation, or logs is strictly prohibited.
*   **Runtime Environment Injection**: Secrets must be stored in the OS environment variables or in the encrypted vault (`17_SECRETS`). They are injected into agent runtimes only during the setup phase of the step.
*   **Encryption Standard**: Credentials stored in the local vault must be encrypted using AES-256-GCM. The decryption key is derived using a master passphrase or system-bound hardware key.

---

## 3. Sandbox Requirements

Execution is classified into **three safety levels**:

| Level | Execution Zone | Triggers |
| :--- | :--- | :--- |
| **Level 1 (Safe)** | Host Environment | Running static linters, parsing configurations, formatting code, reading documentation. |
| **Level 2 (Isolated)** | Sandbox (`14_SANDBOX`) | Building code packages, running test suites, executing mathematical calculations, running local web servers. |
| **Level 3 (Restricted)** | Strict Sandbox + Approval | Accessing internet API endpoints, installing new npm/pip packages, running third-party binary executables. |

*   **Escape Prevention**: Filesystem access inside the sandbox is restricted to the sandbox directory and workspace subdirectories using directory boundaries.

---

## 4. Hardware Bindings & Windows Hello Integration

*   **TPM Binding**: Vault keys are bound to the local Trusted Platform Module (TPM) to ensure they cannot be copied or executed on another machine.
*   **Windows Hello Auth**: Access to high-privilege operations (e.g. updating the Core Brain constitution, modifying global rules, exporting vault secrets) requires the agent to trigger a local Windows Hello verification prompt.
