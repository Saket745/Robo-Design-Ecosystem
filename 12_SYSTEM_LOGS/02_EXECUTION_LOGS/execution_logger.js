const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'execution.jsonl');

let cache = {
  mtimeMs: 0,
  size: 0,
  entries: null
};
let activeReadPromise = null;

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

async function queryExecutionLogs(filters = {}) {
  const { limit = 50, taskId, status, level, startTime, endTime } = filters;

  let stat;
  try {
    stat = await fs.promises.stat(logPath);
  } catch (_) {
    return [];
  }

  let entries;
  // If cache is valid, use it
  if (cache.entries && stat.mtimeMs === cache.mtimeMs && stat.size === cache.size) {
    entries = cache.entries;
  } else {
    // If there is an active read/parse promise, await it
    if (activeReadPromise) {
      entries = await activeReadPromise;
    } else {
      activeReadPromise = (async () => {
        try {
          const content = await fs.promises.readFile(logPath, 'utf8');
          const lines = content.split('\n').filter(Boolean);
          const parsed = lines.map(line => {
            try {
              return JSON.parse(line);
            } catch (_) {
              return null;
            }
          }).filter(Boolean);

          // Update cache
          cache = {
            mtimeMs: stat.mtimeMs,
            size: stat.size,
            entries: parsed
          };
          return parsed;
        } finally {
          activeReadPromise = null;
        }
      })();
      entries = await activeReadPromise;
    }
  }

  // Apply filters on the array (creating a new filtered array reference)
  let filtered = entries;

  if (taskId) {
    filtered = filtered.filter(e => e.taskId === taskId || e.event === taskId);
  }
  if (status) {
    filtered = filtered.filter(e => e.status === status);
  }
  if (level) {
    filtered = filtered.filter(e => e.level === level);
  }
  if (startTime) {
    filtered = filtered.filter(e => e.timestamp >= startTime);
  }
  if (endTime) {
    filtered = filtered.filter(e => e.timestamp <= endTime);
  }

  // Create a shallow copy before reversing to prevent mutating the cached array in place
  return filtered.slice().reverse().slice(0, limit);
}

module.exports = {
  logExecution,
  queryExecutionLogs
};
