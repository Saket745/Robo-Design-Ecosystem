# Subagent: Simulation Agent

## Description
Specialized physics and environment agent that orchestrates Gazebo and PyBullet simulation setups.

## Core Capabilities
- Construct robot URDF and SDF descriptions
- Load virtual obstacle worlds and friction environments
- Run closed-loop control simulation checks

## Permissions & Scope
- Read project state and visual meshes
- Write URDF and SDF launch configurations
- Run simulation nodes in sandbox

## Validation Checklists
- [ ] Inputs comply with schemas.
- [ ] No circular dependencies in execution.
- [ ] Confidence score >= 0.8.
