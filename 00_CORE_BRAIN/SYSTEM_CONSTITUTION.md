# SYSTEM CONSTITUTION

**Supreme Governance Layer of the Antigravity Autonomous Engineering Ecosystem**

---

## 1. Core Philosophy
The Antigravity Ecosystem is a local-first, modular, deterministic engineering environment built to orchestrate specialized AI agents and workflows for high-reliability software and physical systems (specifically robotics engineering). All participants—human and synthetic—are bound by this Constitution.

---

## 2. Immutable Architectural Laws
1. **Modularity First**: All capabilities must be segmented into isolated, reusable, and explicit skills. Monolithic services or libraries are strictly forbidden.
2. **Layered Boundaries**: Clear isolation must be maintained between the core architectural layers:
   - **00_CORE_BRAIN & 01_GLOBAL_RULES**: Constitutional and governance layer.
   - **02_SKILLS**: Operational capability registry.
   - **03_SUBAGENTS**: Autonomous execution layer.
   - **04_MEMORY**: Segmented knowledge storage.
   - **08_VALIDATION**: Absolute filter before execution.
3. **No Circular Dependencies**: Code, module, and skill imports must form a Directed Acyclic Graph (DAG). Circular dependency links are prohibited.
4. **Schema-First Contracts**: Any communication, interaction, or data transfer between modules, MCP servers, or subagents must comply with predefined and strictly-validated JSON/YAML schemas.

---

## 3. Mandatory Validation Policies
1. **Zero Unvalidated Execution**: No code, script, or configuration may be executed in production or outer scopes without passing the master validation pipeline.
2. **The Validation Chain**:
   ```
   Generate -> Analyze -> Validate -> Simulate -> Refine -> Integrate
   ```
3. **Security Isolation**: Code execution must occur in sandboxed environments (`14_SANDBOX`) where possible. Unrestricted access to the network or base OS requires explicit user consent.
4. **Least-Privilege Routing**: Subagents operate under restricted scopes. No agent may modify its own core parameters or base models.

---

## 4. Operational Ethics & AI Contracts
1. **Deterministic Workflow Enforcement**: All automation pipelines must have predictable paths, structured logs, and rollback options.
2. **Context Preservation**: Agents must not dump raw conversation histories or poll lists into the memory store. Context must be structured and indexed semantically.
3. **Zero Plaintext Secrets**: No passwords, OAuth tokens, API secrets, or credentials may be written to any code, logs, or plain files. Injection must occur via environmental variables or secure encrypted vaults.
4. **Audit Trail**: Every execution must leave a trace-indexed, append-only log under `12_SYSTEM_LOGS`.

---

## 5. Enforcement
Any attempt by a subagent to bypass these guardrails, execute unsanctioned code, or store secrets in plain sight will trigger an immediate execution pause, state rollback, and escalation to the User.
