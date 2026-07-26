const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Resolve execution_logger
const executionLoggerPath = path.join(__dirname, '..', '12_SYSTEM_LOGS', '02_EXECUTION_LOGS', 'execution_logger');
const executionLogger = require(executionLoggerPath);

const logFilePath = path.join(__dirname, '..', '12_SYSTEM_LOGS', '02_EXECUTION_LOGS', 'execution.jsonl');
const backupPath = logFilePath + '.bak';

test('execution_logger.queryExecutionLogs tests', async (t) => {
  // Setup backup
  let hadBackup = false;
  if (fs.existsSync(logFilePath)) {
    fs.renameSync(logFilePath, backupPath);
    hadBackup = true;
  }

  // Cleanup helper
  const restoreAndCleanup = () => {
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
    if (hadBackup) {
      fs.renameSync(backupPath, logFilePath);
    }
  };

  try {
    // 1. Log some test data
    executionLogger.logExecution('task-1', 'event-start', 'completed', { severity: 'INFO', timestamp: '2026-06-01T10:00:00.000Z' });
    executionLogger.logExecution('task-1', 'event-end', 'completed', { severity: 'INFO', timestamp: '2026-06-01T10:05:00.000Z' });
    executionLogger.logExecution('task-2', 'event-err', 'failed', { severity: 'ERROR', timestamp: '2026-06-01T10:10:00.000Z' });
    executionLogger.logExecution('task-3', 'event-warn', 'completed', { severity: 'WARNING', timestamp: '2026-06-01T10:15:00.000Z' });

    await t.test('should query all logs limit to 2 descending', async () => {
      // Note: we support both promise and synchronous returns for now to establish baseline
      let entries = executionLogger.queryExecutionLogs({ limit: 2 });
      if (entries instanceof Promise) {
        entries = await entries;
      }
      assert.strictEqual(entries.length, 2);
      // The reverse makes them descending (newest first)
      assert.strictEqual(entries[0].taskId, 'task-3');
      assert.strictEqual(entries[1].taskId, 'task-2');
    });

    await t.test('should filter by taskId', async () => {
      let entries = executionLogger.queryExecutionLogs({ taskId: 'task-1' });
      if (entries instanceof Promise) {
        entries = await entries;
      }
      assert.strictEqual(entries.length, 2);
      assert.strictEqual(entries[0].taskId, 'task-1');
      assert.strictEqual(entries[1].taskId, 'task-1');
    });

    await t.test('should filter by status', async () => {
      let entries = executionLogger.queryExecutionLogs({ status: 'failed' });
      if (entries instanceof Promise) {
        entries = await entries;
      }
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].taskId, 'task-2');
      assert.strictEqual(entries[0].status, 'failed');
    });

    await t.test('should filter by level/severity', async () => {
      let entries = executionLogger.queryExecutionLogs({ level: 'WARNING' });
      if (entries instanceof Promise) {
        entries = await entries;
      }
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].taskId, 'task-3');
      assert.strictEqual(entries[0].level, 'WARNING');
    });

    await t.test('should filter by startTime and endTime', async () => {
      let entries = executionLogger.queryExecutionLogs({
        startTime: '2026-06-01T10:02:00.000Z',
        endTime: '2026-06-01T10:12:00.000Z'
      });
      if (entries instanceof Promise) {
        entries = await entries;
      }
      // should contain task-2 and event-end (task-1)
      assert.strictEqual(entries.length, 2);
      assert.strictEqual(entries[0].taskId, 'task-2');
    });

  } finally {
    restoreAndCleanup();
  }
});
