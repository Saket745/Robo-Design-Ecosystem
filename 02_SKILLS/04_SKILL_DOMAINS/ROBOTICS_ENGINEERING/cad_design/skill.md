# Skill: CAD Design

## Purpose
Procedural and physical morphology modeling of robot chassis, legs, and mounts.

## Inputs
- Robot morphology dimensions (height, width, leg segments)
- Material specifications (density, yield strength)
- Actuator mounting layouts and dimensions

## Outputs
- 3D Mesh files (.stl, .obj)
- Exchangeable CAD files (.step)
- URDF link visual/collision geometry

## Required Tools
- Blender
- Fusion 360
- FreeCAD

## Workflow
1. Define structural parameters and coordinates of robot links.
2. Model base chassis and body layout with hollow cavities for electronics.
3. Design multi-segment legged joints with actuator clearance.
4. Export visual and collision meshes for ROS2/Gazebo integration.
5. Export STEP files for CNC milling and manufacturing.

## Constraints
- Minimal shell thickness of 3mm for 3D printed structural parts.
- Clearance of at least 1mm around rotating joint actuators.

## Validation
- Visual inspections for structural self-intersections.
- Check mesh manifold integrity (no open edges).
- Verify weight estimations match budget limits.

## Failure Conditions
- Non-manifold geometry errors.
- Insufficient clearances around structural actuators.

## Dependencies


## Deliverables
- chassis.step
- leg_upper.stl
- leg_lower.stl
