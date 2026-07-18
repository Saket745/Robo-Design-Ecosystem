const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'audit.jsonl');

function logAudit(event, agent, project, payload = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: payload.severity || 'INFO',
    action: event,
    actor: agent,
    target: project,
    ...payload
  };
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf8');
}

function queryAuditLogs(filters = {}) {
  const { limit = 50, action, actor, startTime, endTime } = filters;
  if (!fs.existsSync(logPath)) return [];
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  let entries = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (_) {
      return null;
    }
  }).filter(Boolean);

  if (action) {
    entries = entries.filter(e => e.action === action);
  }
  if (actor) {
    entries = entries.filter(e => e.actor === actor);
  }
  if (startTime) {
    entries = entries.filter(e => e.timestamp >= startTime);
  }
  if (endTime) {
    entries = entries.filter(e => e.timestamp <= endTime);
  }

  return entries.reverse().slice(0, limit);
}

module.exports = {
  logAudit,
  queryAuditLogs
};
