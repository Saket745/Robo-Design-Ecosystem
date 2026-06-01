# Inter-Agent Communication Protocol

**Structured Message Passing Standards for the Antigravity Multi-Agent System**

---

## 1. Message Payload Schema
Every message passed between coordination and worker subagents must comply with the following JSON schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "InterAgentMessage",
  "type": "OBJECT",
  "properties": {
    "trace_id": {
      "type": "STRING",
      "description": "Unique UUID v4 mapping to the execution chain"
    },
    "sender": {
      "type": "STRING",
      "description": "The calling subagent ID (e.g. master_orchestrator)"
    },
    "recipient": {
      "type": "STRING",
      "description": "The destination subagent ID (e.g. quadruped_agent)"
    },
    "intent": {
      "type": "STRING",
      "enum": ["REQUEST_CAPABILITY", "RESPONSE_SUCCESS", "RESPONSE_FAILURE", "LOG_EVENT", "ESCALATION"],
      "description": "Action intent mapping"
    },
    "payload": {
      "type": "OBJECT",
      "description": "Action-specific structured parameters"
    },
    "timestamp": {
      "type": "STRING",
      "format": "date-time"
    }
  },
  "required": ["trace_id", "sender", "recipient", "intent", "payload", "timestamp"]
}
```

## 2. Intent Handling Workflow
1. **REQUEST_CAPABILITY**: Sender requests a specific domain execution (e.g., routing kinematics calculations).
2. **RESPONSE_SUCCESS**: Worker agent outputs the completed results alongside confidence levels and output file paths.
3. **RESPONSE_FAILURE**: Worker returns details about errors, missing dependencies, or spec conflicts.
4. **ESCALATION**: Triggers parent coordination level or User intervention if a conflict cannot be self-healed.
