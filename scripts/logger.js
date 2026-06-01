const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const logsDir = path.join(root, '12_SYSTEM_LOGS');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Simple filter to block credentials, tokens, or API keys from being logged in plain text
function sanitize(obj) {
  if (!obj) return obj;
  const str = JSON.stringify(obj);
  // Redact matches for patterns like "key", "secret", "token", "password", "auth" followed by values
  const sanitizedStr = str.replace(/(["']?)(password|token|key|secret|auth|private)(["']?\s*:\s*["'])([^"'\\]|\\.)*(["'])/gi, '$1$2$3[REDACTED]$5');
  return JSON.parse(sanitizedStr);
}

function logEvent({ event, trace_id, severity = 'info', agent = 'system', project = 'AntigravityBot', message, payload = {} }) {
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    event,
    trace_id: trace_id || 'N/A',
    severity,
    agent,
    project,
    message,
    payload: sanitize(payload)
  };

  const formattedLine = JSON.stringify(logEntry) + '\n';

  // 1. Write to general execution logs
  const executionLogDir = path.join(logsDir, '01_EXECUTION_LOGS');
  ensureDir(executionLogDir);
  const generalLogPath = path.join(executionLogDir, 'execution_runs.jsonl');
  fs.appendFileSync(generalLogPath, formattedLine, 'utf8');

  // 2. Write to agent-specific logs if agent defined
  if (agent && agent !== 'system') {
    const agentLogDir = path.join(logsDir, '02_AGENT_LOGS', agent);
    ensureDir(agentLogDir);
    const agentLogPath = path.join(agentLogDir, 'activity.jsonl');
    fs.appendFileSync(agentLogPath, formattedLine, 'utf8');
  }

  // 3. Write to audit logs if severity is warning/critical or it's a state modification
  if (severity === 'critical' || severity === 'warning' || event.includes('state') || event.includes('modify')) {
    const auditLogDir = path.join(logsDir, '08_AUDIT_LOGS');
    ensureDir(auditLogDir);
    const auditLogPath = path.join(auditLogDir, 'audit.jsonl');
    fs.appendFileSync(auditLogPath, formattedLine, 'utf8');
  }

  console.log(`[LOG] [${severity.toUpperCase()}] [${agent}] ${message}`);
  return logEntry;
}

module.exports = {
  logEvent
};

// CLI testing
if (require.main === module) {
  logEvent({
    event: 'test_event',
    trace_id: '82c527e8-103b-472e-aa0d-1fad3d253506',
    severity: 'info',
    agent: 'planner_agent',
    message: 'Testing structured logging output.',
    payload: {
      input_file: 'Robot Model.txt',
      api_key_test: 'secret_oauth_token_12345'
    }
  });
  
  logEvent({
    event: 'state_modification',
    trace_id: '82c527e8-103b-472e-aa0d-1fad3d253506',
    severity: 'warning',
    agent: 'validation_agent',
    message: 'Validation warnings detected.',
    payload: {
      warnings: ['Voltage level low']
    }
  });
}
