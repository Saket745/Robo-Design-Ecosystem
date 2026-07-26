const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const validateEcosystem = require('./validate-ecosystem');

test('validate-ecosystem.js log functions unit tests', async (t) => {

  t.beforeEach(() => {
    validateEcosystem.resetExitCode();
  });

  await t.test('logError should print error message with color and set exitCode to 1', (t) => {
    let loggedMsg = null;
    t.mock.method(console, 'error', (msg) => {
      loggedMsg = msg;
    });

    assert.strictEqual(validateEcosystem.getExitCode(), 0);

    validateEcosystem.logError('Test Error Message');

    assert.strictEqual(loggedMsg, '\x1b[31m[ERROR] Test Error Message\x1b[0m');
    assert.strictEqual(validateEcosystem.getExitCode(), 1);
  });

  await t.test('logSuccess should print success message with color and not change exitCode', (t) => {
    let loggedMsg = null;
    t.mock.method(console, 'log', (msg) => {
      loggedMsg = msg;
    });

    assert.strictEqual(validateEcosystem.getExitCode(), 0);

    validateEcosystem.logSuccess('Test Success Message');

    assert.strictEqual(loggedMsg, '\x1b[32m[PASS] Test Success Message\x1b[0m');
    assert.strictEqual(validateEcosystem.getExitCode(), 0);
  });

  await t.test('resetExitCode should reset exitCode back to 0', (t) => {
    t.mock.method(console, 'error', () => {});

    validateEcosystem.logError('Another Error');
    assert.strictEqual(validateEcosystem.getExitCode(), 1);

    validateEcosystem.resetExitCode();
    assert.strictEqual(validateEcosystem.getExitCode(), 0);
  });

  await t.test('assertFileExists returns true and logs success if file exists', (t) => {
    let loggedMsg = null;
    t.mock.method(console, 'log', (msg) => {
      loggedMsg = msg;
    });

    t.mock.method(fs, 'existsSync', (p) => {
      return true;
    });

    const result = validateEcosystem.assertFileExists('some-file.yaml', 'Test file');
    assert.strictEqual(result, true);
    assert.match(loggedMsg, /\[PASS\] Test file exists:/);
    assert.strictEqual(validateEcosystem.getExitCode(), 0);
  });

  await t.test('assertFileExists returns false and logs error if file does not exist', (t) => {
    let loggedMsg = null;
    t.mock.method(console, 'error', (msg) => {
      loggedMsg = msg;
    });

    t.mock.method(fs, 'existsSync', (p) => {
      return false;
    });

    const result = validateEcosystem.assertFileExists('missing-file.yaml', 'Test file');
    assert.strictEqual(result, false);
    assert.match(loggedMsg, /\[ERROR\] Test file missing:/);
    assert.strictEqual(validateEcosystem.getExitCode(), 1);
  });

});
