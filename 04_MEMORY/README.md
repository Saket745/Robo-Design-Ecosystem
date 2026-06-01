# 🧠 Module 04: Memory OS

## 🌌 Overview

The **Memory OS** is the persistent knowledge and experience storage system of the Antigravity platform. Rather than retaining transient, unstructured agent chat logs, Memory OS structures experience into segments, indexes documents vectorially, and retains episodic records of execution steps. This ensures that agents learn from past runs, share coding patterns, and operate with context isolation.

---

## 📂 Memory Directory Layout

The memory module is divided into kernel scripts and segmented database folders:

*   **`00_MEMORY_KERNEL/`**: Core databases, indexing engines, semantic retrievers, and memory configuration keys.
    *   [[04_MEMORY/00_MEMORY_KERNEL/MEMORY_ARCHITECTURE|MEMORY_ARCHITECTURE.md]]: Architectural spec of the indexing and search algorithms.
*   **`01_GLOBAL_MEMORY/`**: Core system preferences, global run summaries, and user feedback logs.
*   **`02_PROJECT_MEMORY/`**: Project-specific task outputs, code metrics, and state snapshots.
*   **`03_REUSABLE_PATTERNS/`**: Synthesized solutions, optimization routines, and troubleshooting lessons.
*   **`MEMORY_SEGMENTATION_POLICY.md`**: Policies ensuring context segregation and namespace safety.

---

## 🧱 The Segmentation Strategy

Memory is segmented into distinct namespaces to prevent context pollution:

```
+------------------------------------------------------------+
|                       GLOBAL MEMORY                        |
|   (User Preferences, Global CLI settings, System Rules)    |
+------------------------------------------------------------+
       |                                              |
       v                                              v
+-------------------------------+      +-------------------------------+
|      PROJECT A MEMORY         |      |      PROJECT B MEMORY         |
|  (Task Steps, Local State)    |      |  (Task Steps, Local State)    |
+-------------------------------+      +-------------------------------+
```

*   **Episodic Isolation**: Tasks running in Project A cannot query or read files inside Project B's namespace directory.
*   **Decoupled Vector Spaces**: Retrieval queries are filtered by project tags, preventing cross-project code contamination.
*   **Archive Consolidation**: High-frequency step logs are compressed into single, structured project summaries after 30 days to avoid context bloating.

For guidelines on context separation, see [[MEMORY_SEGMENTATION_POLICY]].