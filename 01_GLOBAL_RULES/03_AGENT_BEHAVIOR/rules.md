# Agent Behavior Rules

## Rule 1: Isolation Boundary Compliance
**Severity**: ERROR
**Description**: Subagents marked as `isolated_execution: true` in their definition contract must run in a sandboxed, restricted execution context and cannot spawn un-vetted subprocesses.
**Rationale**: Limits the blast radius of potential failures or unexpected code execution inside individual worker agents.
**Example (Correct)**:
`cad_agent operates purely within its sandboxed directory without executing system-level scripts.`
**Example (Violation)**:
`cad_agent executing node scripts outside of the sandbox directory to access global environment variables.`

## Rule 2: Message Schema Conformance
**Severity**: ERROR
**Description**: All inter-agent message payloads must conform to the required JSON schema mapping sender, recipient, intent, trace_id, timestamp, and payload.
**Rationale**: Standardizes agent communications, making task orchestrations audit-friendly and trace-compatible.
**Example (Correct)**:
```json
{
  "trace_id": "99f8d167-bc18-4b77-a89e-4e4b7be8e788",
  "sender": "planner_agent",
  "recipient": "cad_agent",
  "intent": "REQUEST_CAPABILITY",
  "payload": { "chassis_width": 180 },
  "timestamp": "2026-06-07T20:25:00Z"
}
```
**Example (Violation)**:
```json
{
  "from": "planner",
  "to": "cad",
  "data": { "chassis_width": 180 }
}
```

## Rule 3: Single Master Orchestration
**Severity**: ERROR
**Description**: The `planner_agent` or coordinator level is the sole authority for dispatching DAG tasks. Individual worker subagents must not schedule or coordinate other tasks independently.
**Rationale**: Prevents uncoordinated loop execution or deadlocks between worker agents.
**Example (Correct)**:
`planner_agent receives a spec, compiles the task graph, and schedules the execution.`
**Example (Violation)**:
`cad_agent directly invoking pcb_agent to perform board layout after finishing chassis meshes.`
