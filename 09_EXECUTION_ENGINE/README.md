# ⚙️ Module 09: Execution Engine

## 🌌 Overview

The **Execution Engine** is the orchestration runtime of the Antigravity platform. It translates project plans into structured graphs, schedules execution steps, runs code in sandboxed runners, and persists the resulting system and project states.

---

## 📂 Submodules Directory Layout

The execution engine is organized into three core components:

*   **`01_RUNTIME/`**: Manages step-level sandbox execution environments, process logging, timeouts, and signal handling.
    *   [[09_EXECUTION_ENGINE/01_RUNTIME/RUNTIME_PROTOCOL|RUNTIME_PROTOCOL.md]]: Details runner environments and rollback triggers.
*   **`02_DAG_ENGINE/`**: Builds and validates Directed Acyclic Graphs (DAGs) representing tasks and steps.
    *   [[09_EXECUTION_ENGINE/02_DAG_ENGINE/DAG_ENGINE_SPEC|DAG_ENGINE_SPEC.md]]: Algorithms for cycle detection, topological sorting, and parallel step execution.
*   **`05_STATE_MANAGER/`**: Coordinates updates to the project state.
    *   [[09_EXECUTION_ENGINE/05_STATE_MANAGER/STATE_MANAGEMENT|STATE_MANAGEMENT.md]]: State schema files, transactional commits, and history tracking.

---

## 🏗️ DAG Execution Model

Execution is divided into discrete node steps structured as a Directed Acyclic Graph (DAG). This model ensures that:
1.  **Strict Step Ordering**: Steps with dependencies are never executed until all their parent nodes report a `success` state.
2.  **Parallel Execution**: Steps with independent dependencies are run concurrently inside isolated sandbox slots.
3.  **Checkpointing**: After every node completes, the State Manager persists a checkpoint. If subsequent steps fail, the engine can roll back the workspace to the last successful checkpoint.