# 🧠 Module 00: Core Brain

## 🌌 Overview

The **Core Brain** acts as the supreme governance, identity, and architectural definition layer of the Antigravity platform. It defines the immutable rules, philosophy, and constraints under which all agents, automation workflows, and infrastructure layers must operate.

---

## 📂 Key Governance Documents

This module contains the three primary governance files of the system:

1.  **[[SYSTEM_CONSTITUTION]]**:
    *   *Purpose*: The legal and ethical framework for the platform.
    *   *Contents*: Core philosophy, immutable architectural laws, validation requirements, and AI agent behavioral constraints.
2.  **[[SYSTEM_DNA.yaml]]**:
    *   *Purpose*: The configuration file representing the system's structural and operational identity.
    *   *Contents*: Module directories list, sandbox requirements, subagent types, memory segmentation strategy, and future expansion domains.
3.  **[[ARCHITECTURE_OVERVIEW]]**:
    *   *Purpose*: High-level technical description of the system architecture.
    *   *Contents*: Data flow maps, execution pipeline breakdowns, and inter-module communications.

---

## 🏛️ Governance Policy

*   **Immutable Boundaries**: No subagent is permitted to edit files inside `00_CORE_BRAIN` or `01_GLOBAL_RULES` without explicit, high-clearance system update permissions.
*   **Compliance Verification**: Every pipeline in `08_VALIDATION` checks incoming tasks against the constitutional mandates defined in this module. Any deviation results in an immediate execution halt.

---

## 🔗 Related Modules

*   [[01_GLOBAL_RULES/README|01_GLOBAL_RULES]]: Translates the principles in the Constitution into concrete, programmatically-enforceable rule sets.
*   [[03_SUBAGENTS/README|03_SUBAGENTS]]: Implements the specialized agents that are governed by this Core Brain.
*   [[08_VALIDATION/README|08_VALIDATION]]: The operational arm that enforces constitutional policies.