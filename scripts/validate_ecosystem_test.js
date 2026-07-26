const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const validateEcosystem = require('./validate-ecosystem');

test('validate-ecosystem script helper functions', async (t) => {

  await t.test('logSuccess should log message with green pass tag', (t) => {
    const originalLog = console.log;
    let loggedMessage = '';
    console.log = (msg) => {
      loggedMessage = msg;
    };

    try {
      validateEcosystem.logSuccess('System OK');
      assert.strictEqual(loggedMessage, '\x1b[32m[PASS] System OK\x1b[0m');
    } finally {
      console.log = originalLog;
    }
  });

  await t.test('logError should log message with red error tag and set exitCode to 1', (t) => {
    const originalError = console.error;
    let loggedMessage = '';
    console.error = (msg) => {
      loggedMessage = msg;
    };

    // Reset exitCode to 0 first
    validateEcosystem.setExitCode(0);
    assert.strictEqual(validateEcosystem.getExitCode(), 0);

    try {
      validateEcosystem.logError('System Failed');
      assert.strictEqual(loggedMessage, '\x1b[31m[ERROR] System Failed\x1b[0m');
      assert.strictEqual(validateEcosystem.getExitCode(), 1);
    } finally {
      console.error = originalError;
    }
  });

  await t.test('assertFileExists should return true and log success when file exists', (t) => {
    const originalLog = console.log;
    const originalExistsSync = fs.existsSync;
    let loggedMessage = '';

    console.log = (msg) => {
      loggedMessage = msg;
    };
    fs.existsSync = (p) => {
      return true;
    };

    try {
      const result = validateEcosystem.assertFileExists('some_dummy_file.yaml', 'Dummy Config');
      assert.strictEqual(result, true);
      assert.match(loggedMessage, /Dummy Config exists: some_dummy_file\.yaml/);
    } finally {
      console.log = originalLog;
      fs.existsSync = originalExistsSync;
    }
  });

  await t.test('assertFileExists should return false, log error and set exitCode to 1 when file does not exist', (t) => {
    const originalError = console.error;
    const originalExistsSync = fs.existsSync;
    let loggedMessage = '';

    console.error = (msg) => {
      loggedMessage = msg;
    };
    fs.existsSync = (p) => {
      return false;
    };

    validateEcosystem.setExitCode(0);

    try {
      const result = validateEcosystem.assertFileExists('some_missing_file.yaml', 'Missing Config');
      assert.strictEqual(result, false);
      assert.match(loggedMessage, /Missing Config missing: some_missing_file\.yaml/);
      assert.strictEqual(validateEcosystem.getExitCode(), 1);
    } finally {
      console.error = originalError;
      fs.existsSync = originalExistsSync;
    }
  });
});
