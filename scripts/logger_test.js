const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

test.describe('logger.logEvent unit tests', () => {

  test.beforeEach(() => {
    // Suppress console.log during tests
    test.mock.method(console, 'log', () => {});
  });

  test('should log a basic event with default options and return log entry', (t) => {
    const writtenFiles = {};
    const createdDirs = [];

    t.mock.method(fs, 'existsSync', () => false);
    t.mock.method(fs, 'mkdirSync', (dirPath) => {
      createdDirs.push(dirPath);
    });
    t.mock.method(fs, 'appendFileSync', (filePath, content) => {
      writtenFiles[filePath] = (writtenFiles[filePath] || '') + content;
    });

    const executionMock = t.mock.method(logger.executionLogger, 'logExecution', () => {});
    const auditMock = t.mock.method(logger.auditLogger, 'logAudit', () => {});

    const eventData = {
      event: 'test_basic_event',
      message: 'This is a test message'
    };

    const entry = logger.logEvent(eventData);

    // Verify output structure
    assert.ok(entry.timestamp);
    assert.strictEqual(entry.event, 'test_basic_event');
    assert.strictEqual(entry.trace_id, 'N/A');
    assert.strictEqual(entry.severity, 'info');
    assert.strictEqual(entry.agent, 'system');
    assert.strictEqual(entry.project, 'AntigravityBot');
    assert.strictEqual(entry.message, 'This is a test message');
    assert.deepStrictEqual(entry.payload, {});

    // Verify directories created
    assert.ok(createdDirs.some(dir => dir.includes('01_EXECUTION_LOGS')));

    // Verify legacy file was appended to
    const legacyPath = Object.keys(writtenFiles).find(p => p.includes('execution_runs.jsonl'));
    assert.ok(legacyPath);
    const writtenEntry = JSON.parse(writtenFiles[legacyPath].trim());
    assert.strictEqual(writtenEntry.event, 'test_basic_event');
    assert.strictEqual(writtenEntry.message, 'This is a test message');

    // Verify execution logger was called
    assert.strictEqual(executionMock.mock.callCount(), 1);
    const execCall = executionMock.mock.calls[0];
    assert.strictEqual(execCall.arguments[0], 'test_basic_event'); // trace_id default to event
    assert.strictEqual(execCall.arguments[1], 'test_basic_event');
    assert.strictEqual(execCall.arguments[2], 'completed');
    assert.deepStrictEqual(execCall.arguments[3], {
      agent: 'system',
      project: 'AntigravityBot',
      message: 'This is a test message'
    });

    // Verify audit logger was NOT called (not audit-worthy)
    assert.strictEqual(auditMock.mock.callCount(), 0);
  });

  test('should sanitize sensitive data in payloads', (t) => {
    t.mock.method(fs, 'existsSync', () => true);
    t.mock.method(fs, 'appendFileSync', () => {});
    t.mock.method(logger.executionLogger, 'logExecution', () => {});

    const sensitivePayload = {
      user: 'admin',
      password: 'supersecretpassword123',
      api_token: 'abc123token',
      apiKey: 'xyz-api-key',
      auth: 'Bearer mytoken',
      private_key: '-----BEGIN PRIVATE KEY-----',
      normal_field: 'safe_value'
    };

    const entry = logger.logEvent({
      event: 'auth_attempt',
      message: 'User trying to authenticate',
      payload: sensitivePayload
    });

    assert.strictEqual(entry.payload.user, 'admin');
    assert.strictEqual(entry.payload.normal_field, 'safe_value');
    assert.strictEqual(entry.payload.password, '[REDACTED]');
    assert.strictEqual(entry.payload.api_token, '[REDACTED]');
    assert.strictEqual(entry.payload.apiKey, '[REDACTED]');
    assert.strictEqual(entry.payload.auth, '[REDACTED]');
    assert.strictEqual(entry.payload.private_key, '[REDACTED]');
  });

  test('should set severity to error/critical status in execution log', (t) => {
    t.mock.method(fs, 'existsSync', () => true);
    t.mock.method(fs, 'appendFileSync', () => {});
    const executionMock = t.mock.method(logger.executionLogger, 'logExecution', () => {});

    logger.logEvent({
      event: 'system_crash',
      severity: 'error',
      message: 'An unexpected crash occurred'
    });

    assert.strictEqual(executionMock.mock.calls[0].arguments[2], 'failed');

    logger.logEvent({
      event: 'system_panic',
      severity: 'critical',
      message: 'Power source depleted'
    });

    assert.strictEqual(executionMock.mock.calls[1].arguments[2], 'failed');
  });

  test('should route audit-worthy events and severities to auditLogger', (t) => {
    t.mock.method(fs, 'existsSync', () => true);
    t.mock.method(fs, 'appendFileSync', () => {});
    t.mock.method(logger.executionLogger, 'logExecution', () => {});
    const auditMock = t.mock.method(logger.auditLogger, 'logAudit', () => {});

    // Case 1: severity warning is audit worthy
    logger.logEvent({
      event: 'temp_high',
      severity: 'warning',
      message: 'Temperature warning'
    });
    assert.strictEqual(auditMock.mock.callCount(), 1);

    // Case 2: severity critical is audit worthy
    logger.logEvent({
      event: 'battery_empty',
      severity: 'critical',
      message: 'Battery critical'
    });
    assert.strictEqual(auditMock.mock.callCount(), 2);

    // Case 3: event containing 'state' is audit worthy
    logger.logEvent({
      event: 'state_modification',
      message: 'Modified robot config'
    });
    assert.strictEqual(auditMock.mock.callCount(), 3);

    // Case 4: event containing 'modify' is audit worthy
    logger.logEvent({
      event: 'modify_user',
      message: 'Modified user rules'
    });
    assert.strictEqual(auditMock.mock.callCount(), 4);

    // Case 5: event containing 'access' is audit worthy
    logger.logEvent({
      event: 'unauthorized_access',
      message: 'Access denied'
    });
    assert.strictEqual(auditMock.mock.callCount(), 5);

    // Case 6: event containing 'auth' is audit worthy
    logger.logEvent({
      event: 'auth_success',
      message: 'User logged in'
    });
    assert.strictEqual(auditMock.mock.callCount(), 6);

    // Verify argument structure of the audit log call
    const auditCall = auditMock.mock.calls[0];
    assert.strictEqual(auditCall.arguments[0], 'temp_high');
    assert.strictEqual(auditCall.arguments[1], 'system');
    assert.strictEqual(auditCall.arguments[2], 'AntigravityBot');
    assert.deepStrictEqual(auditCall.arguments[3], {
      trace_id: undefined,
      message: 'Temperature warning',
      severity: 'warning'
    });
  });

  test('should write to agent-specific log if agent is defined and is not system', (t) => {
    const writtenFiles = {};
    const createdDirs = [];

    t.mock.method(fs, 'existsSync', () => false);
    t.mock.method(fs, 'mkdirSync', (dirPath) => {
      createdDirs.push(dirPath);
    });
    t.mock.method(fs, 'appendFileSync', (filePath, content) => {
      writtenFiles[filePath] = (writtenFiles[filePath] || '') + content;
    });
    t.mock.method(logger.executionLogger, 'logExecution', () => {});

    logger.logEvent({
      event: 'task_complete',
      agent: 'navigation_agent',
      message: 'Navigation complete'
    });

    // Check directory creation for agent logs
    assert.ok(createdDirs.some(dir => dir.includes('02_AGENT_LOGS') && dir.includes('navigation_agent')));

    // Check written files
    const agentFilePath = Object.keys(writtenFiles).find(p => p.includes('02_AGENT_LOGS') && p.includes('activity.jsonl'));
    assert.ok(agentFilePath);
    const agentEntry = JSON.parse(writtenFiles[agentFilePath].trim());
    assert.strictEqual(agentEntry.agent, 'navigation_agent');
    assert.strictEqual(agentEntry.message, 'Navigation complete');
  });

  test('should handle and ignore execution logger or audit logger errors without throwing', (t) => {
    t.mock.method(fs, 'existsSync', () => true);
    t.mock.method(fs, 'appendFileSync', () => {});

    // Force execution and audit loggers to throw
    t.mock.method(logger.executionLogger, 'logExecution', () => {
      throw new Error('Disk Full/Execution Logger Error');
    });
    t.mock.method(logger.auditLogger, 'logAudit', () => {
      throw new Error('Audit Logger Error');
    });

    // This should NOT throw, despite both sub-loggers throwing
    assert.doesNotThrow(() => {
      logger.logEvent({
        event: 'unauthorized_access', // triggers audit logging as well
        severity: 'critical',
        message: 'Panic test message'
      });
    });
  });

});
