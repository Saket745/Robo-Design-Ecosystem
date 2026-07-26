const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { validatePath } = require('./logger');

test('logger.validatePath unit tests', async (t) => {
  const root = path.resolve(__dirname, '..');

  await t.test('should allow the root path itself', () => {
    const result = validatePath(root);
    assert.strictEqual(result, path.normalize(root));
  });

  await t.test('should allow standard subdirectories and files inside root', () => {
    const scriptsDir = path.join(root, 'scripts');
    const resultScripts = validatePath(scriptsDir);
    assert.strictEqual(resultScripts, path.normalize(scriptsDir));

    const loggerFile = path.join(root, 'scripts', 'logger.js');
    const resultLogger = validatePath(loggerFile);
    assert.strictEqual(resultLogger, path.normalize(loggerFile));

    const logsDir = path.join(root, '12_SYSTEM_LOGS', '01_AUDIT_LOGS');
    const resultLogs = validatePath(logsDir);
    assert.strictEqual(resultLogs, path.normalize(logsDir));
  });

  await t.test('should block path traversal outside of root using relative dots', () => {
    const parentOfRoot = path.join(root, '..');
    assert.throws(() => {
      validatePath(parentOfRoot);
    }, /Security Error: Path/);

    const outsideFile = path.join(root, '..', 'some_external_file.txt');
    assert.throws(() => {
      validatePath(outsideFile);
    }, /Security Error: Path/);
  });

  await t.test('should block absolute paths outside of root', () => {
    // Determine an absolute path that is outside our root.
    // E.g., the root directory of the filesystem, or a sibling of root.
    const rootDir = path.parse(root).root;
    // Ensure we are actually outside root. If root is rootDir itself, we can skip or use a dummy folder.
    if (path.normalize(root) !== path.normalize(rootDir)) {
      assert.throws(() => {
        validatePath(rootDir);
      }, /Security Error: Path/);
    }
  });

  await t.test('should handle edge cases with path separators', () => {
    // If we append extra separators, normalize should clean them and still allow inside paths
    const nestedWithSlashes = path.join(root, 'scripts') + path.sep + path.sep + 'logger.js';
    const result = validatePath(nestedWithSlashes);
    assert.strictEqual(result, path.normalize(path.join(root, 'scripts', 'logger.js')));
  });
});
