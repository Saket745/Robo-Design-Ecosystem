# Skill: Motor Control

## Purpose
Actuator driver tuning, calibration, and closed-loop speed/position control.

## Inputs
- Motor voltage, phase resistance, and KV ratings
- Encoder counts per revolution (CPR)
- Target torque, speed, or position commands

## Outputs
- Calibrated motor feedback configurations
- Actuator command loops

## Required Tools
- ODrive Tool
- STM32 CubeMX
- Arduino Control Libraries

## Workflow
1. Measure phase resistance and inductance parameters.
2. Calibrate encoder alignment with motor pole pairs.
3. Tune proportional-integral-derivative (PID) gains for current loop.
4. Tune velocity and position loop feedback gains.
5. Implement motor thermal safety thresholds.

## Constraints
- Actuator overshoot must remain under 5% during step inputs.
- Current draw must not exceed motor continuous rating.

## Validation
- Execute step response checks.
- Verify current limiting logic triggers under stall conditions.

## Failure Conditions
- Motor runaway (positive feedback loops).
- Encoder slip causing misalignment errors.

## Dependencies


## Deliverables
- motor_calibration.json
- pid_tuner.py
