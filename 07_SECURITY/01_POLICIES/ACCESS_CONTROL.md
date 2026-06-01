# 🔑 Access Control Specification

This document details the access levels, credentials permissions, and hardware authorization mechanisms of the Antigravity platform.

---

## 🏛️ The 3-Tier Access Model

System resources, directory paths, and database operations are classified into three safety zones:

### 1. Public Tier (Low Risk)
*   **Resources**: Platform documentation (`README.md`), general audit logs, public capability lists.
*   **Access**: Open read access to all subagents and tools. Write access is restricted to the `documentation_agent`.
*   **Verification**: Static linting check only.

### 2. Private Tier (Medium Risk)
*   **Resources**: Project workspaces, local database stores, project state files (`robot_project_state.json`), and custom domain skills.
*   **Access**: Restricted read/write access based on agent ID matching (e.g. `code_engineer` has write permission inside the code workspace folder).
*   **Verification**: Schema validation and automated unit testing pass required.

### 3. Critical Tier (High Risk)
*   **Resources**: Core governance files (`00_CORE_BRAIN`), global policy rules (`01_GLOBAL_RULES`), security configs (`07_SECURITY`), and the credential vault (`17_SECRETS`).
*   **Access**: Read-only by default. Write access requires a system version migration plan and human confirmation.
*   **Verification**: Absolute validation chain pass, security checks, and User approval.

---

## 💻 Hardware Bindings & Windows Hello

*   **TPM Key Protection**: The master encryption key used to decode the secure vault in `17_SECRETS` is bound to the system's Trusted Platform Module (TPM). It cannot be extracted or run on other machines.
*   **Windows Hello Prompts**: Any request by an agent to access Critical Tier assets (e.g., retrieving cloud credentials or writing to system rules) triggers a native Windows Hello authentication dialog. Execution is paused until fingerprint, facial recognition, or PIN entry succeeds.
