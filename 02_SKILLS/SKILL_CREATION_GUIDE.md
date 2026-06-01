# 🛠️ Skill Creation Guide

This guide describes how to construct, document, validate, and register a new **Skill** in the Antigravity platform.

---

## 🚀 Step-by-Step Creation Process

### Step 1: Identify Domain and Path
Determine which domain in `MANIFEST.yaml` your skill belongs to. For example, a new ROS2 command skill goes under the `robotics_engineering` domain.
Create a folder inside the appropriate domain:
`02_SKILLS/04_SKILL_DOMAINS/<domain_name>/<skill_name>/`

### Step 2: Create Mandatory Files
Every skill requires three files:
*   `skill.md` (Documentation and schemas)
*   `validation.md` (Checklist and tests)
*   `dependencies.yaml` (System and package dependencies)

### Step 3: Register the Skill
Add your new skill to `02_SKILLS/MANIFEST.yaml` under the corresponding domain:
```yaml
domains:
  robotics_engineering:
    skills:
      - cad_design
      - <your_new_skill_name>
```

### Step 4: Run Validation
Verify the skill by running the static validation parser:
```powershell
node scripts/validate_skills.js
```

---

## 📄 File Templates

### 1. `skill.md` Template
Create `skill.md` using the following format:
```markdown
# Skill: [Skill Name]

## Description
[Clear explanation of what the skill accomplishes]

## Input Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "param_one": {
      "type": "string",
      "description": "Description of parameter"
    }
  },
  "required": ["param_one"]
}
```

## Output Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "result": { "type": "string" }
  },
  "required": ["success", "result"]
}
```

## Examples
### Example 1: Basic Run
**Input:**
```json
{
  "param_one": "test_value"
}
```
**Output:**
```json
{
  "success": true,
  "result": "Operation completed successfully with test_value"
}
```
```

### 2. `validation.md` Template
Create `validation.md` to define verification criteria:
```markdown
# Validation: [Skill Name]

## Automated Checks
- [ ] Run syntax linter: `npm run lint` or `flake8`
- [ ] Run unit tests: `npm run test:unit`
- [ ] Conforms to JSON Schema constraints

## Verification Scenarios
### Scenario 1: Valid Execution
1. Pass correct parameters.
2. Confirm output status is `success: true`.

### Scenario 2: Error Handling
1. Pass empty or invalid parameters.
2. Confirm the skill returns a descriptive error state instead of throwing unhandled exceptions.
```

### 3. `dependencies.yaml` Template
Create `dependencies.yaml` to specify execution requirements:
```yaml
skill_id: "your_skill_name"
version: "1.0.0"
runtime: "node" # or python, binary, etc.
permissions:
  filesystem:
    read:
      - "sandbox/"
    write:
      - "sandbox/"
  network: false
packages:
  npm:
    - "lodash"
  python: []
```
