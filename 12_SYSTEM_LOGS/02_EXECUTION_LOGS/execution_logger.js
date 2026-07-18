const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'execution.jsonl');

function logExecution(taskId, event, status, payload = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: payload.severity || 'INFO',
    taskId: taskId,
    event: event,
    status: status,
    ...payload
  };
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf8');
}

function queryExecutionLogs(filters = {}) {
  const { limit = 50, taskId, status, level, startTime, endTime } = filters;
  if (!fs.existsSync(logPath)) return [];
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  let entries = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (_) {
      return null;
    }
  }).filter(Boolean);

  if (taskId) {
    entries = entries.filter(e => e.taskId === taskId || e.event === taskId);
  }
  if (status) {
    entries = entries.filter(e => e.status === status);
  }
  if (level) {
    entries = entries.filter(e => e.level === level);
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
  logExecution,
  queryExecutionLogs
};
