const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { assertFileExists, getExitCode, resetExitCode } = require('./validate-ecosystem');

test('validate-ecosystem assertFileExists unit tests', async (t) => {
  // Save original console functions
  const originalLog = console.log;
  const originalError = console.error;

  let loggedLogs = [];
  let loggedErrors = [];

  t.beforeEach(() => {
    loggedLogs = [];
    loggedErrors = [];
    console.log = (msg) => { loggedLogs.push(msg); };
    console.error = (msg) => { loggedErrors.push(msg); };
    resetExitCode();
  });

  t.afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  await t.test('should return true and log success when file exists', () => {
    // We can use a file we know exists relative to the root, e.g. package.json
    const exists = assertFileExists('package.json', 'Package configuration');
    assert.strictEqual(exists, true);
    assert.strictEqual(getExitCode(), 0);
    assert.strictEqual(loggedLogs.length, 1);
    assert.match(loggedLogs[0], /\[PASS\] Package configuration exists: package.json/);
    assert.strictEqual(loggedErrors.length, 0);
  });

  await t.test('should return false, log error, and set exitCode when file does not exist', () => {
    const exists = assertFileExists('non_existent_file_xyz_123.txt', 'Fake description');
    assert.strictEqual(exists, false);
    assert.strictEqual(getExitCode(), 1);
    assert.strictEqual(loggedErrors.length, 1);
    assert.match(loggedErrors[0], /\[ERROR\] Fake description missing: non_existent_file_xyz_123.txt/);
    assert.strictEqual(loggedLogs.length, 0);
  });
});
