# Execution Policies Rules

## Rule 1: Mandatory Task Execution Timeouts
**Severity**: ERROR
**Description**: Every task definition must specify a non-zero `timeout` parameter in milliseconds. The task runtime must race the execution against this timeout limit and abort if exceeded.
**Rationale**: Prevents dangling or deadlocked tasks from hanging the execution worker process indefinitely.
**Example (Correct)**:
`Task definition having timeout: 30000 (30 seconds) which is verified by task_schema.json.`
**Example (Violation)**:
`Running a gait generation task without a timeout parameter, risking infinite loops if the kinematics solver fails.`

## Rule 2: Exponential Backoff Retry Policy
**Severity**: WARNING
**Description**: Transient errors (e.g. network failure, simulation collision) should be retried using an exponential backoff formula: `delay = base * 2^attempt`.
**Rationale**: Reduces system load and gives transient service outages time to recover before retrying.
**Example (Correct)**:
`Retrying T4 after 100ms, then 200ms, then 400ms, up to a configured retries limit of 3.`
**Example (Violation)**:
`Retrying a failing task instantly in an active loop, locking up the CPU.`

## Rule 3: Execution Checkpoint Coverage
**Severity**: WARNING
**Description**: The execution engine must create a rollback checkpoint via the `state_manager` immediately before starting a task and immediately after a task finishes successfully.
**Rationale**: Ensures that system state can be rolled back to a clean checkpoint in case of intermediate task failures.
**Example (Correct)**:
`stateManager.createCheckpoint('pre_task_T1') before starting T1, and stateManager.createCheckpoint('post_task_T1') on success.`
**Example (Violation)**:
`Executing the entire DAG from start to finish without saving checkpoints, requiring full rerun on failure.`
