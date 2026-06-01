# Skill: Robotics Kinematics

## Purpose
Compute forward and inverse kinematics models and generate gait trajectories.

## Inputs
- Leg segment lengths and physical offsets
- Joint angle limits (minimum/maximum degrees)
- Target foot tip trajectories (x, y, z path)

## Outputs
- Kinematic models (DH parameters or analytical solutions)
- Gait trajectory tables (.json, .csv)

## Required Tools
- Python
- NumPy
- SciPy
- SymPy

## Workflow
1. Construct analytical Forward Kinematics (FK) equations for leg links.
2. Derive Inverse Kinematics (IK) solver using trigonometric or numerical methods.
3. Validate IK solver against mechanical joint limit constraints.
4. Generate foot gait curves (e.g. cycloid swing curves).
5. Generate joint angles trajectory list for coordination.

## Constraints
- IK solver must resolve within 2ms per leg loop.
- Disallow joint angle commands beyond physical motor limits.

## Validation
- Compare target foot position with computed FK position.
- Ensure joint trajectories contain no sudden spikes or discontinuities.

## Failure Conditions
- IK solver singularity (unresolvable math).
- Joint speed limit violations during swing phase.

## Dependencies


## Deliverables
- kinematics_model.py
- gait_profile.json
