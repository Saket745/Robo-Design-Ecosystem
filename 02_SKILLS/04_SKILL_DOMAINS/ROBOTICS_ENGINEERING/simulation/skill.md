# Skill: Simulation

## Purpose
Physics-based evaluation of kinematics, controllers, and odometry in virtual environments.

## Inputs
- Robot URDF descriptions
- World collision models and mesh environments
- Control node topics

## Outputs
- Simulation log outputs
- Sensor emulation data streams

## Required Tools
- Gazebo Classic
- ROS2 Gazebo Plugins
- PyBullet

## Workflow
1. Generate complete URDF with correct visual/collision/inertial properties.
2. Configure Gazebo ros2_control hardware interface plugin.
3. Construct virtual world with obstacles and slip friction surfaces.
4. Launch simulation and verify joint controllers respond correctly.
5. Record and plot telemetry curves comparing sim against math targets.

## Constraints
- Real-time factor (RTF) in simulation must hold >= 0.8.
- Inertial matrices of URDF links must be positive-definite.

## Validation
- URDF validation checks (check_urdf).
- Verify joint limits match physical robot specifications.

## Failure Conditions
- Simulation explosion (non-physical inertial properties).
- Controller joint oscillation in gazebo physics engine.

## Dependencies
- cad_design
- robotics_kinematics

## Deliverables
- robot.urdf
- gazebo_world.sdf
- sim_launch.py
