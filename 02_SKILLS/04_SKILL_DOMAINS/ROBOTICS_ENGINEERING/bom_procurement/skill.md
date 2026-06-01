# Skill: BOM & Procurement

## Purpose
Generate components bill of materials, verify supply chains, and calculate budget costs.

## Inputs
- Chassis CAD components list
- PCB schematics component list
- Subsystem target budgets

## Outputs
- Ecosystem Bill of Materials spreadsheet (.xlsx, .csv)

## Required Tools
- Excel
- Python
- DigiKey API

## Workflow
1. Extract components from CAD structures and PCB files.
2. Deduplicate components and consolidate packages.
3. Query online APIs for availability and bulk price models.
4. Select alternative component paths for long lead-time parts.
5. Generate consolidated purchase files with pricing summaries.

## Constraints
- Consolidated parts list must remain within project budget.
- Zero active components marked as obsolete or end-of-life.

## Validation
- Check footprint sizes against footprints defined in PCB files.
- Verify lead-time constraints align with build roadmaps.

## Failure Conditions
- Footprint mismatch causing assembly assembly locks.
- Out-of-stock items stalling PCB production.

## Dependencies
- pcb_design
- cad_design

## Deliverables
- bom_master.xlsx
- procurement_sources.csv
