# 🔒 Module 07: Security

## 🌌 Overview

The **Security Module** enforces zero-trust execution boundaries, manages access control policies, and prevents unauthorized actions across the Antigravity platform. By isolating filesystems, restricting network configurations, and verification of agent operations, the system guarantees host safety.

---

## 📂 Security Directory Layout

The module contains policies and sandbox rules:

*   **`01_POLICIES/`**: Houses role mappings, client permissions, and hardware credentials binding rules.
    *   [[07_SECURITY/01_POLICIES/ACCESS_CONTROL|ACCESS_CONTROL.md]]: Details the 3-tier access model (Public, Private, Critical).
*   **`02_SANDBOX_RULES/`**: Configures filesystem jails, environment variables masking, and network firewalls.
    *   [[07_SECURITY/02_SANDBOX_RULES/SANDBOX_RULES|SANDBOX_RULES.md]]: Specific path constraints and escape preventions.

---

## 🏛️ Security Hierarchy

Security guidelines are translated from global rules into concrete operational boundaries:

```
+-------------------------------------------------------------+
| TIER 1: GLOBAL RULES (01_GLOBAL_RULES/05_SECURITY_POLICIES)  |
| (General Security Laws & Guidelines)                        |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| TIER 3: SECURITY LAYER (07_SECURITY)                        |
| (Access Control Mappings & Sandbox Boundary Configurations)  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| TIER 4: RUNTIME UTILITIES (17_SECRETS & 14_SANDBOX)         |
| (AES encrypted vault and isolated file systems)             |
+-------------------------------------------------------------+
```

For secret vault implementation, see [[SECRETS_MANAGEMENT]].