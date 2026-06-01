# Skill: Embedded Systems

## Purpose
Write and flash micro-controller firmware for sensor reading and actuator commands.

## Inputs
- Target pinout map from PCB schematic
- Sensor sampling rates and communication protocols (I2C/SPI/CAN)
- Target micro-controller specification

## Outputs
- C++ firmware source code (.cpp, .h)
- Compiled binary firmware (.bin, .hex)

## Required Tools
- PlatformIO
- Arduino IDE
- ESP-IDF

## Workflow
1. Configure peripherals (GPIO, PWM, I2C, SPI, CAN bus).
2. Write real-time sensor polling threads (e.g. FreeRTOS tasks).
3. Implement communication packet parser for master commands.
4. Configure safety watchdog timers and emergency stop handlers.
5. Compile firmware and upload to the target micro-controller.

## Constraints
- Firmware execution loops must run deterministically at min 100Hz.
- Zero blocking delay() calls in real-time control threads.

## Validation
- Compile checks (warnings treated as errors).
- Verify sensor data streams are noise-filtered.
- Check watchdog timer response.

## Failure Conditions
- Thread lock or deadlock in task scheduler.
- CAN/I2C communication packet timeout.

## Dependencies
- motor_control
- sensor_fusion

## Deliverables
- firmware.bin
- main.cpp
