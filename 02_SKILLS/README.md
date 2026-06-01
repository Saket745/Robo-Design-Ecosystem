# 🛠️ Module 02: Skills System

## 🌌 Overview

The **Skills System** is the capability layer of the Antigravity platform. A **Skill** is a stateless, modular, and reusable package designed to execute a specific technical action or computation. 

By separating business logic and computational procedures from subagent models, the system ensures that agent logic remains simple while capability execution remains deterministic, testable, and sandboxed.

---

## 📂 System Structure

The `02_SKILLS` directory contains the registry, routing mechanisms, and skill domain files:

*   **`MANIFEST.yaml`**: The master registry catalog, registering active domains and their allowed sub-skills.
*   **`01_CAPABILITY_REGISTRY/`**: Code hooks and loaders that import and initialize skills dynamically.
*   **`02_AGENTIC_ROUTING/`**: The semantic routing protocol that maps natural language agent intents to specific, registered skills.
*   **`03_SYSTEM_SKILLS/`**: Platform utilities (e.g. git integrations, shell executors, workspace scanners).
*   **`04_SKILL_DOMAINS/`**: Domain-specific skill packs (e.g., `robotics_engineering` skills like CAD, PCB layout, kinematics solvers).

---

## 📦 Anatomy of a Skill

Each skill resides in its own folder under a domain (e.g., `04_SKILL_DOMAINS/robotics/kinematics/`) and must contain three mandatory files:

1.  **`skill.md`**: Human and AI-readable documentation detailing description, parameters, input/output schemas, and examples.
2.  **`validation.md`**: Testing checklists, verification commands, and pass criteria specific to the skill.
3.  **`dependencies.yaml`**: Explicit list of required libraries, external executables, and system-level permissions needed to run the skill.

For details on implementing these files, see the [[SKILL_CREATION_GUIDE]].

---

## 🧭 Active Domains & Skills (defined in MANIFEST.yaml)

### 1. Robotics Engineering
*   **CAD & PCB Layout**: Mechanical CAD models and PCB design layouts.
*   **Embedded & Control**: Embedded systems firmware, kinematics solvers, and motor controls.
*   **Simulation & ROS**: Simulation runners and ROS2 node layouts.

### 2. Coordination
*   **Master Orchestrator**: Manages workflow orchestration.
*   **Agentic Routing**: Decides which skills to route queries to.

### 3. Memory Management
*   **Memory OS**: Manages reading and writing to episodic/vector memory.