# Changelog

All notable changes to the **Robo Design Ecosystem** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-06-02

### Added

- **Platform Scaffold**: Full 18-module directory structure generated via `scripts/scaffold.js`
- **00_CORE_BRAIN**: System DNA (`SYSTEM_DNA.yaml`), System Constitution, and Architecture Overview
- **01_GLOBAL_RULES**: 20 policy sub-modules covering engineering standards, security, naming, git workflows, and more
- **02_SKILLS**: Capability registry with semantic routing engine and 12 robotics engineering skill domains:
  - CAD Design, PCB Design, Embedded Systems, Robotics Kinematics, Sensor Fusion, Motor Control, Power Systems, Computer Vision, Simulation, Manufacturing, ROS2 Architecture, BOM Procurement
- **03_SUBAGENTS**: Agent kernel with contract, lifecycle, and communication protocols; 4 agent categories (Coordination, Intelligence, Engineering, Robotics)
- **04_MEMORY**: Segmented memory kernel with global, project, and reusable pattern layers
- **05_MCP**: Model Context Protocol connectors (standard, custom, project profiles)
- **06_AUTOMATION**: Workflow and cron job infrastructure
- **07_SECURITY**: Policies and sandbox rules
- **08_VALIDATION**: Core validation engine with robotics-specific validation
- **09_EXECUTION_ENGINE**: Runtime, DAG engine, and versioned state manager with rollback
- **10_PROJECT_INTELLIGENCE**: Project registry, active projects, and project DNA parser
- **11_KNOWLEDGE_GRAPH**: Graph core and knowledge graph specification
- **12_SYSTEM_LOGS**: Audit, execution, and agent log infrastructure
- **13_BACKUPS**: Snapshot strategy and backup policies
- **14_SANDBOX**: Secure execution zone specification
- **15_RECOVERY**: Recovery protocol with master configuration
- **16_CONFIG**: Configuration management layer
- **17_SECRETS**: Secrets management documentation (directory gitignored)
- **Dashboard**: Web-based visualization command center (HTML/CSS/JS + Vite)
- **Scripts**: Scaffold generator, state manager CLI, logger, semantic router, robotics skill/agent generators
- **GitHub Templates**: Issue templates (bug report, feature request) and PR template
- **CONTRIBUTING.md**: Contribution guidelines aligned with System Constitution
