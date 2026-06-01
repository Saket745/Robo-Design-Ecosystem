# 🏗️ Memory Architecture Specification

This document defines the technical design, databases, and algorithms powering the Antigravity Memory OS.

---

## 🏛️ System Components

The Memory OS is composed of three core subsystems:

```
                  +--------------------------------+
                  |           Memory OS            |
                  +--------------------------------+
                     /            |             \
                    v             v              v
            [Vector Store]  [Episodic Database] [Semantic Parser]
                  |               |              |
           Semantic Search   Step Logs & Diffs   Keyword Matching
```

### 1. Vector Store (Semantic Search)
*   **Purpose**: Indexes code documentation, library APIs, and system specifications.
*   **Database**: Local sqlite-based vector table or embedded vector library.
*   **Algorithm**: Cosine similarity on sentence-transformer embeddings:
    $$\text{similarity} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$

### 2. Episodic Database (Step Logs & Diffs)
*   **Purpose**: Logs chronological agent execution steps, outputs, and diff reports.
*   **Structure**: Append-only JSON files index-keyed by `task_id` and `timestamp`.
*   **Retention**: Consolidated and compressed after 30 days.

### 3. Semantic Parser (Keyword & Concept Index)
*   **Purpose**: Fast lookup of system APIs and rule files.
*   **Structure**: Trie-based index mapping terms to file paths.

---

## 🔄 Indexing & Retrieval Process

```
[New Execution Step] ---> [Extract Key Entities] ---> [Generate Embedding] ---> [Write to JSON & Vector DB]
```

### Writing to Memory
1.  **Extraction**: The Semantic Parser processes the step log to pull entity terms (e.g. `ros2_sensor_node`, `inverse_kinematics`).
2.  **Embedding**: Generate vector representations of the log summary text.
3.  **Commit**: Save the raw JSON data to the Episodic database, and write the vector index to the Vector Store.

### Retrieving from Memory
1.  **Query Formulation**: An agent sends a question (e.g., "how did we resolve joint velocity limits?").
2.  **Vector Scan**: The retrieval engine fetches the top 5 embedding matches with cosine scores $\ge 0.75$, filtered by `project_id`.
3.  **Context Assembly**: The retrieved segments are compiled into a formatted context block and returned to the agent.
