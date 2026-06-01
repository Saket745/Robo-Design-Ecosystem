# 🏗️ DAG Engine Specification

This specification defines the internal representation, sorting algorithms, and execution logic of the Directed Acyclic Graph (DAG) scheduler.

---

## 🏛️ Graph Representation

A task workflow is represented as a directed graph $G = (V, E)$, where:
*   $V$ (Vertices) represent the executable task steps (e.g. `generate_gait_profile`, `compile_firmware`).
*   $E$ (Edges) represent dependency connections (e.g., step B depends on step A: $A \to B$).

---

## 🔄 Core Algorithms

### 1. Cycle Detection
Before execution, the engine must assert that the graph is acyclic. The engine uses a **DFS-based Graph Coloring Algorithm**:
*   **White (0)**: Unvisited nodes.
*   **Gray (1)**: Currently visiting (active in call stack).
*   **Black (2)**: Completed traversal.

If the DFS encounters a node that is colored **Gray**, a cycle is detected, and execution is aborted.

### 2. Topological Sorting (Kahn's Algorithm)
To schedule steps, the engine sorts nodes topologically.
1.  Compute the in-degree (number of incoming edges) for every node.
2.  Queue all nodes with an in-degree of 0 (no dependencies).
3.  While the queue is not empty:
    *   Pop a node $u$ and append it to the sorted list.
    *   For each outgoing edge $u \to v$, decrement the in-degree of $v$.
    *   If $v$'s in-degree becomes 0, add it to the queue.
4.  If the sorted list does not contain all nodes, the graph contains a cycle.

### 3. Parallel Scheduling
During execution, the engine schedules all nodes in the queue that have an in-degree of 0. These run concurrently in separate sandbox folders. As each node completes, the engine decrements in-degrees of their child nodes and queues new eligible nodes dynamically.

---

## 📄 Schema Format

DAG configuration files use the following format:

```yaml
dag_id: "robot_kinematics_workflow"
steps:
  - id: "load_parameters"
    agent: "planner_agent"
    dependencies: []

  - id: "calculate_kinematics"
    agent: "kinematics_agent"
    dependencies: ["load_parameters"]

  - id: "run_simulation"
    agent: "simulation_agent"
    dependencies: ["calculate_kinematics"]
```
