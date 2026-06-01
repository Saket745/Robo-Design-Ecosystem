# 🕸️ Knowledge Graph Specification

This specification defines the query APIs, connection interfaces, and synchronization loops driving the semantic graph database.

---

## 🏛️ Graph Sync Engine

The knowledge graph is updated automatically by file watchers and execution hooks:

```
[File Edit / Commit] ---> [Extract Graph Delta] ---> [Transaction Queue] ---> [Update Graph Core]
```

1.  **Change Detection**: The watcher intercepts file updates, state modifications, or task completions.
2.  **Delta Extraction**: An agent or compiler parser extracts relationships (e.g. `File A imports File B` $\to$ `dependency` edge).
3.  **Transaction Committal**: Operations are queued and executed as an atomic transaction on the database to prevent graph corruption.

---

## 💻 Query API & Traversal Methods

The graph API exposes methods to query and traverse relationships:

### 1. `addNode(id, type, properties)`
Adds a vertex to the graph. Node types include `file`, `agent`, `skill`, `rule`, `memory`, and `task`.

### 2. `addEdge(source, target, relation_type, properties)`
Creates a directed edge between nodes. Relation types:
*   `dependency`: Import/export relations.
*   `architecture`: Layer boundaries and component rules.
*   `workflow`: Task orderings in a DAG.
*   `project_relation`: Workspace assignments.
*   `skill_relation`: Mapping agents to skills.
*   `memory_relation`: Connecting episodic logs.

### 3. `findPath(startNode, endNode)`
Executes a Breadth-First Search (BFS) to find the shortest connection path between two nodes. Useful for resolving dependency chains.

### 4. `getDependencies(nodeId)`
Returns all nodes connected to `nodeId` via outgoing `dependency` edges. Used by the validation engine to check compile order.

---

## 📊 Database Schema (SQLite-compatible)

```sql
CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    properties TEXT
);

CREATE TABLE edges (
    source_id TEXT,
    target_id TEXT,
    relation TEXT NOT NULL,
    properties TEXT,
    PRIMARY KEY (source_id, target_id, relation),
    FOREIGN KEY (source_id) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES nodes(id) ON DELETE CASCADE
);
```
