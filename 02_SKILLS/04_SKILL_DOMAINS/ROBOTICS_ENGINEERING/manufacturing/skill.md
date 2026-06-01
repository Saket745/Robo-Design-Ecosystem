# Skill: Manufacturing

## Purpose
Generate toolpaths, infill patterns, and machining plans for mechanical parts.

## Inputs
- STEP/STL mechanical mesh files
- Material density and strength requirements
- Target tolerances

## Outputs
- Slicer printer configurations
- CNC milling G-Code files

## Required Tools
- PrusaSlicer
- Cura
- Fusion 360 CAM

## Workflow
1. Orient meshes to minimize stress on print layer boundaries.
2. Configure infill densities (min 40% gyroid for structural parts).
3. Generate support structures for overhang angles exceeding 45 degrees.
4. Generate CNC paths for aluminum joint structural plates.
5. Export G-Code files ready for manufacturing machines.

## Constraints
- Structural links must be printed in PETG or Carbon Fiber filament.
- Part tolerances must fall within +/- 0.1mm limits.

## Validation
- G-code dry run simulations.
- Verify layer adhesion and wall counts (min 4 walls).

## Failure Conditions
- Layer shearing under load.
- CNC toolpath collisions.

## Dependencies
- cad_design

## Deliverables
- chassis.gcode
- leg_upper.3mf
