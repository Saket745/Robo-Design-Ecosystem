# 🪐 Module 10: Project Intelligence

## 🌌 Overview

The **Project Intelligence** module is the metadata and project classification layer of the Antigravity platform. It detects new codebases, analyzes project tech stacks (e.g. Node.js, Python, ROS2), maps workspace paths, and parses **Project DNA** configuration files to dynamically load relevant skills, agents, and validation policies.

---

## 📂 Project Intelligence Directory Layout

The module contains the project registry, active contexts, and DNA templates:

*   **`01_PROJECT_REGISTRY/`**: Master list cataloging all registered workspaces and project metadata.
*   **`02_ACTIVE_PROJECTS/`**: Holds current execution variables, active path configurations, and specific connection sockets for projects.
    *   [[10_PROJECT_INTELLIGENCE/PROJECT_DETECTION|PROJECT_DETECTION.md]]: How the system scans directories, detects programming languages, and registers new projects.
*   **`03_PROJECT_DNA/`**: Defines project-specific constraints, required agent assignments, and workspace configurations.
    *   [[10_PROJECT_INTELLIGENCE/03_PROJECT_DNA/PROJECT_DNA_SPEC|PROJECT_DNA_SPEC.md]]: DNA yaml specification template and parsing schema.

---

## 🔄 Dynamic Loading Pipeline

When a user initializes or opens a project workspace:

```
[Scan Directory] ---> [Classify Stack] ---> [Read Project DNA] ---> [Load Agents & Skills]
```

1.  **Detection**: The scanner checks for signature files (e.g., `package.json`, `requirements.txt`, `CMakeLists.txt`).
2.  **Domain Classification**: Matches directories to known patterns (e.g. `robotics_engineering`, `ecommerce`, `logistics`).
3.  **DNA Parsing**: Resolves parameters, agent configurations, and safety levels defined in the project's DNA file.
4.  **Registry Update**: Registers the project under `01_PROJECT_REGISTRY/` and exposes project paths to the Memory OS and execution runners.