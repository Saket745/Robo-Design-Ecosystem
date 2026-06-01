# 📜 Module 01: Global Rules

## 🌌 Overview

The **Global Rules** module is the policy engine of the Antigravity system. It contains specific, programmatically enforceable guidelines, contracts, and boundaries. All layers—from subagents to execution schedules—refer to these rules for structural conformity, validation thresholds, and behavioral expectations.

---

## 📂 Rule Directories

| Submodule | Policy Document | Purpose |
| :--- | :--- | :--- |
| **01_ARCHITECTURE_RULES** | [[architecture_rules]] | Enforces layering, modularity, and DAG constraints. |
| **02_ENGINEERING_STANDARDS** | [[engineering_standards]] | Codes quality, code style, testing, and reviews. |
| **03_AGENT_BEHAVIOR** | [[agent_behavior_rules]] | Subagent operations, loops, and escalation logic. |
| **04_MEMORY_RULES** | [[memory_rules]] | Context isolation, indexing, and cleanup policies. |
| **05_SECURITY_POLICIES** | [[security_policies]] | Secrets management, sandboxing, and trust limits. |
| **06_VALIDATION_PROTOCOLS** | [[validation_protocols]] | Schema validation, check orders, and criteria. |
| **07_EXECUTION_POLICIES** | [[execution_policies]] | Execution gates, error rollbacks, and recovery triggers. |
| **09_NAMING_CONVENTIONS** | [[naming_conventions]] | File structure, schemas, and directory names. |

---

## 🛠️ Enforcement Pipeline

These rules are not merely documentation. The Validation Engine (`08_VALIDATION`) parses these files during static analysis and runtime assertion checks to verify that:
1.  No circular references are introduced in import trees.
2.  Files are named strictly according to naming rules.
3.  Memory blocks do not leak cross-project context.
4.  No secret tokens are leaked in code changes.