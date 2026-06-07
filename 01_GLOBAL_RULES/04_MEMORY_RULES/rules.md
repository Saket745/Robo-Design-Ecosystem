# Memory Rules

## Rule 1: Layer isolation and Isolation Boundaries
**Severity**: ERROR
**Description**: Subagents and capability modules are strictly prohibited from writing cross-layer memory entries. The `memory_kernel` must ensure that global memory writes do not contaminate project memory or architecture patterns.
**Rationale**: Prevents corruption of global patterns by project-specific local variables.
**Example (Correct)**:
`project keys are saved to project_store.json, while global reusable templates are read from global_store.json.`
**Example (Violation)**:
`Writing a local robot height measurement variable directly into global_store.json.`

## Rule 2: Capacity Control and FIFO Eviction
**Severity**: WARNING
**Description**: All memory layers must respect the `max_entries` limits configured in `memory_config.yaml`. When a write operation exceeds these limits, the oldest entry (FIFO) must be evicted automatically.
**Rationale**: Limits filesystem consumption and memory usage to prevent performance degradation.
**Example (Correct)**:
`Evicting arch_key_0 from the architecture layer after writing the 101st key when max_entries is set to 100.`
**Example (Violation)**:
`Allowing infinite key writes to the architecture layer, bloating memory_index.json beyond manageable size.`

## Rule 3: Required Write Metadata
**Severity**: WARNING
**Description**: Every memory write transaction must include metadata indicating the timestamp, agent, project, and classification tags.
**Rationale**: Allows for structured querying and auditing of stored knowledge and states.
**Example (Correct)**:
`memoryKernel.write('project', 'chassis_dimensions', { width: 180 }, { agent: 'cad_agent', domain: 'robotics' });`
**Example (Violation)**:
`memoryKernel.write('project', 'chassis_dimensions', { width: 180 }); // missing metadata tags`
