# Validation Protocols Rules

## Rule 1: Mandatory Validation Prior to Execution
**Severity**: ERROR
**Description**: No task in the execution engine can progress from `pending` to `running` without its associated schema, dependencies, and configuration validation passing successfully.
**Rationale**: Eliminates runtime crashes by resolving format and type issues before code starts executing.
**Example (Correct)**:
`The server runs the Validator runPipeline on the configuration payload prior to updating the project state.`
**Example (Violation)**:
`Running a simulation run on a raw unvalidated URDF configuration containing potential physical limits violations.`

## Rule 2: Validation Severity Escalation
**Severity**: ERROR
**Description**: If any validation check returns a severity level of `ERROR`, the validation pipeline must fail immediately, returning `passed: false` and throwing an error to halt execution.
**Rationale**: Ensures that critical naming, schema, or structural flaws block execution, while `WARNING` items can be logged without halting.
**Example (Correct)**:
`A naming check failure triggers passed: false, halting the execution flow.`
**Example (Violation)**:
`A schema mismatch is marked as a warning, allowing invalid configs to run.`

## Rule 3: Comprehensive Validation Reporting
**Severity**: WARNING
**Description**: All validation executions must output a structured validation report containing the timestamp, checked targets, pass/fail status, error lists, and warning lists.
**Rationale**: Ensures auditability and diagnostics are immediately visible in the command center.
**Example (Correct)**:
`The validation pipeline returning { pass: true, errors: [], warnings: ['Minor naming issue'] }.`
**Example (Violation)**:
`A validation script outputting a simple console.log('OK') without returning a structured JSON response.`
