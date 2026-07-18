/**
 * Platform Logger — Unified Entry Point
 * --------------------------------------
 * Backward-compatible wrapper that routes log events to the structured
 * audit and execution logger modules under 12_SYSTEM_LOGS/.
 *
 * Existing callers (server.js, demo.js) use logEvent() with a single
 * options object. This module preserves that API while also writing to
 * the new structured JSONL log files.
 *
 * Part of the Antigravity Platform.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const logsDir = path.join(root, '12_SYSTEM_LOGS');

// Import the new structured loggers
const auditLogger = require(path.join(logsDir, '01_AUDIT_LOGS', 'audit_logger'));
const executionLogger = require(path.join(logsDir, '02_EXECUTION_LOGS', 'execution_logger'));

function validatePath(targetPath) {
  const resolved = path.normalize(path.resolve(targetPath));
  const resolvedRoot = path.normalize(path.resolve(root));
  const safeRoot = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  if (!resolved.startsWith(safeRoot) && resolved !== resolvedRoot) {
    throw new Error(`Security Error: Path '${resolved}' is outside allowed root '${resolvedRoot}'.`);
  }
  return resolved;
}

function ensureDir(dirPath) {
  const safePath = validatePath(dirPath);
  if (!fs.existsSync(safePath)) {
    fs.mkdirSync(safePath, { recursive: true });
  }
}

// Simple filter to block credentials, tokens, or API keys from being logged
function sanitize(obj) {
  if (!obj) return obj;
  const str = JSON.stringify(obj);
  const sanitizedStr = str.replace(/(["']?)(password|token|key|secret|auth|private)(["']?\s*:\s*["'])([^"'\\]|\\.)*(["'])/gi, '$1$2$3[REDACTED]$5');
  return JSON.parse(sanitizedStr);
}

/**
 * Primary logging function — backward compatible with existing callers.
 *
 * Routes events to the appropriate structured logger:
 * - Audit events (severity warning/critical, or state/access actions) → audit_logger
 * - All events → execution_logger
 * - Legacy: also writes to 01_EXECUTION_LOGS/execution_runs.jsonl for existing dashboard
 *
 * @param {Object} options
 * @param {string} options.event     - Event name (e.g. 'state_modification', 'task_run_success')
 * @param {string} [options.trace_id] - Correlation / trace identifier
 * @param {string} [options.severity] - 'info' | 'warning' | 'critical' | 'error'
 * @param {string} [options.agent]    - Originating agent (e.g. 'planner_agent', 'system')
 * @param {string} [options.project]  - Project name
 * @param {string} options.message    - Human-readable description
 * @param {Object} [options.payload]  - Additional structured data
 * @returns {Object} The log entry that was written
 */
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

  // 1. Write to legacy execution log (01_EXECUTION_LOGS/execution_runs.jsonl)
  //    for backward compatibility with the dashboard API at /api/logs
  const legacyLogDir = validatePath(path.join(logsDir, '01_EXECUTION_LOGS'));
  ensureDir(legacyLogDir);
  const legacyLogPath = validatePath(path.join(legacyLogDir, 'execution_runs.jsonl'));
  fs.appendFileSync(legacyLogPath, formattedLine, 'utf8');

  // 2. Route to the new execution logger (02_EXECUTION_LOGS)
  try {
    executionLogger.logExecution(
      trace_id || event,
      event,
      severity === 'error' || severity === 'critical' ? 'failed' : 'completed',
      { agent, project, message, ...payload }
    );
  } catch (_) {
    // Silently handle — the legacy log was already written
  }

  // 3. Route to audit logger for security-relevant events
  const isAuditWorthy = (
    severity === 'critical' ||
    severity === 'warning' ||
    (event && (event.includes('state') || event.includes('modify') || event.includes('access') || event.includes('auth')))
  );

  if (isAuditWorthy) {
    try {
      auditLogger.logAudit(event, agent, project, { trace_id, message, severity, ...payload });
    } catch (_) {
      // Silently handle — primary logs were already written
    }
  }

  // 4. Write to agent-specific logs if agent defined
  if (agent && agent !== 'system') {
    const sanitizedAgent = path.basename(agent).replace(/[^a-zA-Z0-9_-]/g, '');
    const agentLogDir = validatePath(path.join(logsDir, '02_AGENT_LOGS', sanitizedAgent));
    ensureDir(agentLogDir);
    const agentLogPath = validatePath(path.join(agentLogDir, 'activity.jsonl'));
    fs.appendFileSync(agentLogPath, formattedLine, 'utf8');
  }

  console.log(`[LOG] [${severity.toUpperCase()}] [${agent}] ${message}`);
  return logEntry;
}

module.exports = {
  logEvent,
  // Re-export structured loggers for direct access
  auditLogger,
  executionLogger
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
      api_key_test: process.env.API_KEY_TEST || 'mock_api_key_placeholder'
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

  console.log('\n--- Logger integration test complete ---');
}
