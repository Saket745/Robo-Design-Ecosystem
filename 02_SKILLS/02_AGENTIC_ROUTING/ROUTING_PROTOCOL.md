# 🧭 Routing Protocol

## 1. Routing Mechanism

The **Agentic Routing** submodule maps natural language requests or agent actions to specific stateless **Skills** registered in the system. When an agent or a user submits a task, the Router determines which skill matches the request, parses inputs to fit the skill's JSON schema, and sets up execution steps.

```
                  +--------------------------------+
                  |  Task Request (Natural Lang)   |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |    Semantic Router Engine      |
                  +--------------------------------+
                     /            |             \
                    v             v              v
            [Skill A: 0.92] [Skill B: 0.45] [Skill C: 0.12]
                    |
                    v
         (Threshold Pass >= 0.70)
                    |
                    v
         +---------------------------------+
         | Map Parameters to JSON Schema   |
         +---------------------------------+
                    |
                    v
         +---------------------------------+
         | Dispatch to Execution Engine    |
         +---------------------------------+
```

---

## 2. Resolver Logic & Scoring

The routing matching process combines keyword matching with high-dimensional vector embeddings:

1.  **Keyword Extraction**: Parse verbs, nouns, and domains from the query (e.g. "simulate", "gait", "inverse kinematics").
2.  **Vector Embedding Search**: Convert the query into a vector and perform a cosine-similarity search against the `skill.md` description documents stored in the Vector Memory.
3.  **Scoring & Thresholds**:
    *   **Score >= 0.70**: Match confirmed. Route the query to the highest scoring skill.
    *   **0.50 <= Score < 0.70**: Ambiguous match. List the top matching skills and request confirmation from the master orchestrator or user.
    *   **Score < 0.50**: No match found. Route to the **Fallback Strategy**.

---

## 3. Parameter Mapping

Once a skill is selected, the router:
1.  Extracts key parameters from the request using structured NLP parsers.
2.  Validates that parameters comply with the target skill's `Input Schema` (defined in `skill.md`).
3.  Injects default values for optional parameters.
4.  Generates a validated execution object:
    ```json
    {
      "skill_id": "robotics_kinematics",
      "parameters": {
        "dof": 12,
        "gait_type": "trot",
        "velocity": 0.5
      }
    }
    ```

---

## 4. Fallback Strategies

If no skill matches the request above the minimum threshold:
*   **Agent Escalation**: The router hands the task to the `planner_agent` or `architect_agent` to see if a combination of skills can accomplish the goal.
*   **Mock Generation (Simulation)**: If the system is in simulation mode, generate a mock execution step and request confirmation.
*   **User Escalation**: Pauses execution, reports the routing score, and requests the user to either manually specify a skill or develop a new skill using the [[SKILL_CREATION_GUIDE]].
