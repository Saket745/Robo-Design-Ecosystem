# 🧠 Memory Rules

## 1. Memory Segmentation Policy

To maintain high performance and prevent context saturation, the Memory OS segments knowledge into six logical layers:

1.  **Global Memory**: System-wide configuration history, global parameters, and persistent user preference profiles.
2.  **Project Memory**: Workspace-specific execution logs, code dependencies, and task tracking details.
3.  **Reusable Patterns**: Synthesized coding templates, debug strategies, and optimization rules derived from previous runs.
4.  **Preference Learning**: User feedback, style overrides, and preferred libraries.
5.  **Vector Memory**: High-dimensional vector embeddings representing documentation and source files for semantic search.
6.  **Architecture Memory**: The structural representation of imports, exports, and relationships in the codebase.

---

## 2. Context Isolation & Contamination Prevention

*   **Strict Namespace Segregation**: No agent operating within Project A can read or write to Project B's memory workspace.
*   **Contamination Checks**: Before retrieving context from the vector database, queries are filtered by `project_id`.
*   **Model Isolation**: Under no circumstances should agent-generated local files or parameters from one project be referenced in another project's DAG.

---

## 3. Memory Cleanup & Retention Policies

To avoid context decay and data bloating:
*   **Episodic Memory Pruning**: Task-level execution details are kept in active memory for **30 days**. After this, they are archived into a compressed historical logs file.
*   **Consolidation**: At the end of every task execution, the memory system consolidates individual step logs into a single summary block. The raw step logs are then deleted.
*   **Out-of-Scope Pruning**: If a project directory is deleted or moved, its memory workspace is automatically scheduled for cleanup.

---

## 4. Anti-Pollution Guidelines

*   **No Chat Dumps**: Storing raw agent chat history, chat transcripts, or prompt chains in the memory module is prohibited.
*   **Structure First**: All memory entries must follow the schema specified in [[memory_schema.json]]. Unstructured strings will be rejected.
*   **Noise Reduction**: Remove redundant log stamps, repetitive warnings, and intermediate console output before writing to memory.
