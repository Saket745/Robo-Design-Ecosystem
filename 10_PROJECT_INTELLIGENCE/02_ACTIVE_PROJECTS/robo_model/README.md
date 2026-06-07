# Robo Model Project DNA

Overview documentation for the customizable quadruped robot platform, developed on the Antigravity Autonomous Engineering Ecosystem.

---

## Project Specifications

- **Robot Name**: Robo Model
- **Configuration**: Quadruped (12 DOF, 3 joints per leg)
- **Actuators**: 12 × MG996R high-torque servos
- **Compute Layer**: Raspberry Pi 4 (802.11ac communication) + ESP32 (MicroROS firmware)
- **Kinematics Definition**: Geometric 3-DOF legged Inverse Kinematics solver
- **Project DNA Config**: [project_dna.yaml](file:///c:/Users/mssak/OneDrive/Desktop/Robo%20Model/antigravity-platform/10_PROJECT_INTELLIGENCE/02_ACTIVE_PROJECTS/robo_model/project_dna.yaml)

## Morphology and Link Definitions
```
       Front
    LF ┌───┐ RF
       │   │
       │   │   Body Dimensions: 300mm x 180mm x 80mm
       │   │
    LB └───┘ RB
        Back
```

Each of the 4 legs (LF, RF, LB, RB) has 3 links:
1. **Hip Joint** — Rotation around Z axis (yaw)
2. **Upper Leg Link** — 120mm length, rotation around Y axis (pitch)
3. **Lower Leg Link** — 130mm length, rotation around Y axis (pitch)

## Locomotion and Gait Modes
- **Trotting Gait**: Diagonal leg pairs synchronized (LF+RB and RF+LB). Standard stable locomotive gait.
- **Walking Gait**: 3 legs planted, 1 leg swinging at a time. Maximum static stability.
- **Standing Gait**: Balance control and shifting body center of mass.
