# Skill: ROS2 Architecture

## Purpose
Configure topics, services, actions, and custom interfaces for multi-node communication.

## Inputs
- List of software nodes and responsibilities
- Communication update rate constraints

## Outputs
- Node dependency charts
- ROS2 Packages, launch scripts, and custom message schemas (.msg, .srv)

## Required Tools
- ROS2 Humble
- colcon
- rclpy
- rclcpp

## Workflow
1. Design clean topic structure with customized namespaces.
2. Define custom messages (e.g. LegJointState.msg).
3. Create ros2 workspace and scaffold packages.
4. Write launch.py script integrating parameters and nodes.
5. Build workspace using colcon and source setups.

## Constraints
- Crucial control messages must be delivered with QoS reliability.
- Nodes must compile without warning logs.

## Validation
- ROS2 topic list and graph inspections.
- Bandwidth analysis on communication channels.

## Failure Conditions
- DDS communication dropouts or high packet latencies.
- Circular node dependency locking runtime threads.

## Dependencies
- embedded_systems

## Deliverables
- LegJointState.msg
- robot_nodes.launch.py
- package.xml
