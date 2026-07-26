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

async function queryAuditLogs(filters = {}) {
  const { limit = 50, action, actor, startTime, endTime } = filters;

  let fileContent;
  try {
    fileContent = await fs.promises.readFile(logPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }

  const lines = fileContent.split('\n');
  const entries = [];

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch (_) {
      continue;
    }

    if (action && entry.action !== action) {
      continue;
    }
    if (actor && entry.actor !== actor) {
      continue;
    }
    if (startTime && entry.timestamp < startTime) {
      // Chronological order means all older entries are also before startTime.
      break;
    }
    if (endTime && entry.timestamp > endTime) {
      continue;
    }

    entries.push(entry);

    if (entries.length >= limit) {
      break;
    }
  }

  return entries;
}

module.exports = {
  logAudit,
  queryAuditLogs
};
