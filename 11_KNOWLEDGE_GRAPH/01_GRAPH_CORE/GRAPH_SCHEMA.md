# 🕸️ Graph Schema Specification

This document details the attributes, property schemas, and indexing strategies applied to nodes and edges in the Knowledge Graph.

---

## 🧱 Node Properties

Nodes are categorized into five primary types, each carrying a specific metadata payload in their JSON `properties` column.

### 1. File Node (`type: "file"`)
*   **Properties**:
    ```json
    {
      "path": "c:/Users/mssak/OneDrive/Desktop/Robo Model/antigravity-platform/00_CORE_BRAIN/SYSTEM_CONSTITUTION.md",
      "file_size": 2910,
      "last_modified": "2026-06-01T03:32:31Z",
      "mime_type": "text/markdown"
    }
    ```

### 2. Agent Node (`type: "agent"`)
*   **Properties**:
    ```json
    {
      "agent_id": "code_engineer_agent",
      "name": "Code Engineer Agent",
      "capabilities": ["write_code", "refactor"]
    }
    ```

### 3. Skill Node (`type: "skill"`)
*   **Properties**:
    ```json
    {
      "skill_id": "robotics_kinematics",
      "domain": "robotics_engineering",
      "runtime": "python"
    }
    ```

### 4. Rule Node (`type: "rule"`)
*   **Properties**:
    ```json
    {
      "rule_id": "no_circular_dependencies",
      "severity": "critical",
      "description": "Bans imports that form loops"
    }
    ```

---

## 🔗 Edge Properties

Edges are directed, linking a source node to a target node.

*   **Attributes**:
    *   `source_id`: The starting node ID.
    *   `target_id`: The ending node ID.
    *   `relation`: The relationship tag (e.g. `dependency`, `validated_by`).
    *   `weight`: Numeric value (0.0 to 1.0) indicating relation strength (default: 1.0).
    *   `description`: Human-readable explanation of why the edge exists.

---

## ⚡ Indexing & Performance Optimization

To ensure real-time graph traversals during build validation steps, the database maintains three secondary indexes:

1.  **Incoming Edge Index**:
    `CREATE INDEX idx_edges_target ON edges(target_id);`
    *   *Purpose*: Speeds up checking what rules validate a specific code file.
2.  **Relation Type Index**:
    `CREATE INDEX idx_edges_relation ON edges(relation);`
    *   *Purpose*: Speeds up filtering dependencies for a file.
3.  **Caching Strategy**: Frequently traversed subtrees (such as the imports tree for active build files) are stored in an in-memory Redis or LRU Node cache.
