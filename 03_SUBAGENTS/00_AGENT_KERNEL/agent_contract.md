# Subagent Behavioral Contract

**Universal Protocol & Rules for All Antigravity Autonomous Subagents**

---

## Rule 1: Bounded Execution Scope
- **One Job Per Agent**: Each subagent must focus on exactly one single domain or responsibility (e.g., `cad_engineer` does not write code, `firmware_engineer` does not plan PCB layout).
- **Execution Limits**: Subagents must not spawn recursive loops, execute unsandboxed terminal operations, or make external API calls unless authorized.

## Rule 2: State Lifecycle
- **Read-First, Update-Last**: Before beginning execution, the subagent must read the Project State (`robot_project_state.json`) to establish context. After execution, the agent must output its result and trigger the state manager to persist modifications.
- **Rollback Compliance**: On execution failure, subagents must immediately halt, revert local mutations, and return an error state. Do not continue or try to ignore exceptions.

## Rule 3: Schema Compliance
- **Structured Communication Only**: Subagents must pass parameters using strictly-validated JSON or YAML. Natural language descriptions are auxiliary to the structured data outputs.
- **No Hallucinations**: Inputs must be verified against current specifications. Assumptions must be flagged with `[Assumed]` tags and returned for validation.

## Rule 4: Security boundaries
- **Zero Plaintext Credentials**: Under no circumstances may a subagent write, log, or store secrets in the repository.
- **Scope Compliance**: Subagents are forbidden from editing files inside the immutable zones (`00_CORE_BRAIN`, `01_GLOBAL_RULES`, `07_SECURITY`) unless executing a system update flow.
