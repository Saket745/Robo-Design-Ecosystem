# 🧬 Project DNA Specification

The **Project DNA** is the configuration file defining a project's identity, tech stack constraints, subagent roles, and required capabilities. It must be stored in the project root directory as `project_dna.yaml`.

---

## 📄 Configuration Schema (YAML)

Every `project_dna.yaml` file must conform to the following schema constraints:

```yaml
# =========================================================
# PROJECT DNA TEMPLATE
# =========================================================
project:
  id: "project_identifier_string"
  name: "Human Readable Project Name"
  domain: "robotics_engineering" # Must map to an active domain in MANIFEST.yaml
  version: "1.0.0"

constraints:
  sandbox_level: 2 # 1: Host, 2: Isolated Sandbox, 3: Restricted
  network_access: false
  memory_isolation: true
  allowed_filesystem_scopes:
    - "sandbox/"
    - "projects/current/"

agents:
  planner: "planner_agent"
  architect: "architect_agent"
  builder: "code_engineer_agent"
  verifier: "validation_agent"
  documenter: "documentation_agent"

required_skills:
  - "robotics_kinematics"
  - "sensor_fusion"
  - "simulation"

custom_parameters:
  dof_limit: 12
  simulation_engine: "webots"
```

---

## 🧱 Properties Breakdown

### 1. `project` Properties
*   `id`: Unique alphanumeric key used to partition directory memory logs and database tables.
*   `domain`: Matches against the capability registry to enable or disable specific toolsets.

### 2. `constraints` Settings
*   `sandbox_level`: Controls the sandboxing safety level applied to execution runtimes.
*   `allowed_filesystem_scopes`: Directory list restriction. If an agent tries to modify files outside these paths, it is blocked.

### 3. `agents` Mappings
*   Defines agent allocations for execution steps. The master orchestrator uses these keys to instantiate the correct subagent models.

### 4. `required_skills` Check
*   A list of skills that must be registered. If any skill is missing from `02_SKILLS/MANIFEST.yaml`, the orchestrator fails during startup.
