const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'execution.jsonl');

function logExecution(taskId, step, status, { agent, project, message, ...payload } = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: status === 'failed' ? 'ERROR' : 'INFO',
    taskId,
    step,
    status,
    agent,
    project,
    message,
    payload
  };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
}

function queryExecutionLogs({ limit = 50, taskId, status, level, startTime, endTime } = {}) {
  if (!fs.existsSync(logFile)) return [];
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  const entries = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (taskId && entry.taskId !== taskId) continue;
      if (status && entry.status !== status) continue;
      if (level && entry.level !== level) continue;
      if (startTime && new Date(entry.timestamp) < new Date(startTime)) continue;
      if (endTime && new Date(entry.timestamp) > new Date(endTime)) continue;
      entries.push(entry);
    } catch (e) {}
  }

  return entries.reverse().slice(0, limit);
}

module.exports = {
  logExecution,
  queryExecutionLogs
};
