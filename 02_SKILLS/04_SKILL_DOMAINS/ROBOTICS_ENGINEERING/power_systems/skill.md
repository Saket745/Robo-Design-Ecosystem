# Skill: Power Systems

## Purpose
Design battery configurations, charge protection circuits, and regulator distributions.

## Inputs
- Continuous and peak current draw requirements
- Operating voltage requirements of all subsystems
- Target battery chemistry and weight limits

## Outputs
- Ecosystem power distribution budget
- Regulator schematics

## Required Tools
- LTSpice
- KiCad
- Excel

## Workflow
1. Sum continuous/peak current metrics for all motors and computing cores.
2. Select cell configurations (e.g. 4S2P Li-Ion).
3. Integrate Battery Management System (BMS) with overcurrent protection.
4. Design buck-boost regulators for clean logic power supply.
5. Perform thermal sizing for heat sinks and copper power planes.

## Constraints
- Logic power supply ripple must remain below 50mV peak-to-peak.
- BMS must shut off power if cell voltage drops below 3.0V.

## Validation
- Simulate regulator load transitions in LTSpice.
- Measure voltage drop across power delivery network under peak loads.

## Failure Conditions
- Regulator thermal shutdown due to overheating.
- Logic reset (brownout) during actuator high-draw startup.

## Dependencies


## Deliverables
- power_budget.xlsx
- regulator_schematic.sch
