const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'audit.jsonl');

function logAudit(event, agent, project, { trace_id, message, severity = 'INFO', ...payload } = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: severity.toUpperCase(),
    action: event,
    actor: agent,
    target: project,
    trace_id,
    message,
    payload
  };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
}

function queryAuditLogs({ limit = 50, action, actor, startTime, endTime } = {}) {
  if (!fs.existsSync(logFile)) return [];
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  const entries = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (action && entry.action !== action) continue;
      if (actor && entry.actor !== actor) continue;
      if (startTime && new Date(entry.timestamp) < new Date(startTime)) continue;
      if (endTime && new Date(entry.timestamp) > new Date(endTime)) continue;
      entries.push(entry);
    } catch (e) {}
  }

  return entries.reverse().slice(0, limit);
}

module.exports = {
  logAudit,
  queryAuditLogs
};
