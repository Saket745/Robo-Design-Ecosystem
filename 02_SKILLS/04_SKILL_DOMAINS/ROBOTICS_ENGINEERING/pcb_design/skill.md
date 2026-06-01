# Skill: PCB Design

## Purpose
Design and validate custom robotics control system PCBs.

## Inputs
- Schematic design requirements
- Target microcontroller pinouts (ESP32/Jetson)
- Sensor interfaces and voltage limits

## Outputs
- Schematics files (.sch)
- PCB Layout design (.kicad_pcb)
- Gerber manufacturing files

## Required Tools
- KiCad
- Altium Designer
- LTSpice

## Workflow
1. Draw schematic with voltage dividers and power management stages.
2. Configure trace widths based on target continuous current ratings.
3. Position MCU and decoupling capacitors near power input pins.
4. Route differential pairs and signal lines separating analog/digital paths.
5. Execute DRC/ERC rules and export fabrication Gerbers.

## Constraints
- Ground loops must be prevented using single-point grounding.
- Trace widths must handle peak actuator current without overheating (min 1mm/A).

## Validation
- Zero ERC errors.
- Zero DRC clearance errors.
- Thermal load simulation checks.

## Failure Conditions
- Voltage instability and high ripple under motor loads.
- Signal noise interference in sensor lines due to poor trace isolation.

## Dependencies
- power_systems

## Deliverables
- control_board.kicad_pcb
- gerber_pack.zip
