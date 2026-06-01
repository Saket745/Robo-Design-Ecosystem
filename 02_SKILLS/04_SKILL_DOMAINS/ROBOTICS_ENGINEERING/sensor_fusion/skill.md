# Skill: Sensor Fusion

## Purpose
Synthesize data from IMUs, LiDAR, encoders, and cameras to estimate robot pose.

## Inputs
- Raw IMU accelerometer/gyroscope readings
- Wheel/joint encoder state telemetry
- Lidar scanning arrays

## Outputs
- Filtered robot pose (orientation, position, velocity)

## Required Tools
- ROS2 Robot Localization
- Python
- C++

## Workflow
1. Read and normalize high-frequency IMU sensors.
2. Apply Madgwick or Extended Kalman Filter (EKF) algorithms.
3. Fuse encoder telemetry to estimate linear/angular displacement.
4. Configure transform tree (TF2 static/dynamic transforms).
5. Output consolidated odometry updates to navigation stack.

## Constraints
- Fused pose drift must not exceed 5% over 10m traversal.
- Sensor fusion loops must operate at >= 50Hz.

## Validation
- Verify covariance matrices decrease on consistent sensor feeds.
- Cross-check orientation outputs against ground truth state.

## Failure Conditions
- Filter divergence under high-acceleration movements.
- LiDAR/IMU coordinate frame misalignment.

## Dependencies


## Deliverables
- ekf_node.py
- tf_broadcaster.cpp
