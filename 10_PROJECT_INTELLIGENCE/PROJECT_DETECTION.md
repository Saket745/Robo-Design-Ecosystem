# 🪐 Project Detection Specification

This document details the signature rules, classification models, and autoloader sequences utilized to discover and register new project workspaces.

---

## 🔍 Signature-Based Detection Rules

The scanner crawls directories recursively up to 3 folders deep to identify file patterns:

| Domain | Signature Files | Folder Identifiers | Classification |
| :--- | :--- | :--- | :--- |
| **Robotics** | `package.xml`, `setup.py` | `urdf/`, `launch/`, `worlds/` | `robotics_engineering` |
| **Web App** | `package.json`, `next.config.js` | `src/components/`, `public/` | `web_development` |
| **Data/AI** | `requirements.txt`, `environment.yml` | `notebooks/`, `models/` | `data_science` |
| **Embedded** | `platformio.ini`, `Makefile` | `include/`, `src/` | `embedded_systems` |

---

## 🏛| Domain Classification

Once file signatures are detected, the system determines the project's operational domain:
1.  **Tag Matching**: Scans README content and source code comments for keywords (e.g. "gait", "imu", "kinematics" $\to$ `robotics`).
2.  **Tech Stack Scoring**: Allocates score metrics based on file counts. For example:
    *   3 or more `.urdf` files $\to$ high confidence for `robotics_simulation`.
    *   Presence of `ros2` libraries in imports $\to$ high confidence for `ros2_architecture`.
3.  **Domain Assignment**: Resolves the domain matching and writes it to the project's profile settings.

---

## 🔄 Registration & Auto-Loading Sequence

When a project is detected:
1.  **Registry Log**: Create a metadata record in `10_PROJECT_INTELLIGENCE/01_PROJECT_REGISTRY/registry.json`:
    ```json
    {
      "project_id": "robot_gait_generator",
      "path": "c:/Users/mssak/OneDrive/Desktop/Robo Model/projects/gait_gen",
      "domain": "robotics_engineering",
      "detected_stack": ["python", "ros2"],
      "registered_at": "2026-06-01T03:32:31Z"
    }
    ```
2.  **Namespace Allocation**: The Memory OS creates a dedicated database folder at `04_MEMORY/02_PROJECT_MEMORY/robot_gait_generator/`.
3.  **DNA Matching**: If the workspace does not contain a `project_dna.yaml` configuration, the system copies a template file matching the classified domain from `10_PROJECT_INTELLIGENCE/03_PROJECT_DNA/`.
