# 🚦 Validation Protocols

## 1. The 6-Layer Validation Chain

Every proposal, task, and execution step must progress through the validation chain in order. Failure at any level immediately halts progress.

```
[Layer 1: Structural] ---> [Layer 2: Dependency] ---> [Layer 3: Architecture]
                                                            |
[Layer 6: Recovery]   <--- [Layer 5: Execution]    <--- [Layer 4: Security]
```

### Layer 1: Structural Validation
*   **Actions**: Code syntax verification, formatting checks, and schema validation of project state configurations.
*   **Failure Trigger**: Syntax errors, unclosed JSON objects, or missing required keys in schemas.

### Layer 2: Dependency Validation
*   **Actions**: Verification of imports and package requirements. Ensure all external dependencies are declared in `package.json` or equivalent.
*   **Failure Trigger**: Missing libraries, out-of-date packages, or circular dependencies.

### Layer 3: Architecture Validation
*   **Actions**: Asserts compliance with the layering model and Directed Acyclic Graph boundaries.
*   **Failure Trigger**: Lower-level layer attempting to import or modify higher-level components.

### Layer 4: Security Validation
*   **Actions**: Scanning files for plaintext credentials, checking sandbox path boundaries, and executing static analysis security checks.
*   **Failure Trigger**: Detected API keys, path escape attempts, or unauthorized access calls.

### Layer 5: Execution Validation
*   **Actions**: Executing build compilations, running unit tests, and verifying run output results.
*   **Failure Trigger**: Compilation errors, failing tests, or invalid output formats.

### Layer 6: Recovery Validation
*   **Actions**: Simulating failures to verify rollback plans. Ensure backups of state can be restored successfully.
*   **Failure Trigger**: Inability to roll back state to a clean point, or corrupt state recovery file.

---

## 2. Schema Compliance Policies

*   **Strict JSON Schema Matching**: Every interaction between subagents must match schemas in `08_VALIDATION/schemas/`.
*   **No Schema-less Calls**: APIs, state modifications, and messaging packages without a registered schema are blocked.
*   **Schema Update Protocol**: To modify a schema, agents must submit a migration plan detailing backwards compatibility.

---

## 3. Success Criteria & Quality Gates

An execution DAG step is marked `Passed` only if:
1.  All linter rules pass with zero errors.
2.  Tests have finished with 100% success.
3.  The security scanner returns no issues.
4.  No warnings were escalated to Level 3 (Intervention).
