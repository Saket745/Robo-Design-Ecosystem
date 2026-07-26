const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { validatePath, ensureDir, root } = require('./scaffold');

test.describe('scaffold.js utilities', () => {

  test.describe('validatePath', () => {
    test('should allow a valid path inside the workspace root', () => {
      const validPath = path.resolve(root, 'scripts');
      const resolved = validatePath(validPath);
      assert.strictEqual(resolved, path.normalize(validPath));
    });

    test('should allow the workspace root itself', () => {
      const resolved = validatePath(root);
      assert.strictEqual(resolved, path.normalize(root));
    });

    test('should reject a path outside the workspace root', () => {
      const outsidePath = path.resolve(root, '..');
      assert.throws(() => {
        validatePath(outsidePath);
      }, (err) => {
        return err instanceof Error && err.message.includes('Security Error');
      });
    });

    test('should reject traversal attempts leading outside root', () => {
      const traversalPath = path.join(root, '../etc/passwd');
      assert.throws(() => {
        validatePath(traversalPath);
      }, /Security Error/);
    });
  });

  test.describe('ensureDir', () => {
    test('should not call mkdirSync if directory exists', (t) => {
      const existingDir = path.resolve(root, 'scripts');

      // Spy on fs.existsSync and fs.mkdirSync
      const existsMock = t.mock.method(fs, 'existsSync', (p) => {
        if (p === path.normalize(existingDir)) {
          return true;
        }
        return false;
      });

      const mkdirMock = t.mock.method(fs, 'mkdirSync', () => {});
      const logMock = t.mock.method(console, 'log', () => {});

      ensureDir(existingDir);

      assert.strictEqual(existsMock.mock.callCount(), 1);
      assert.strictEqual(mkdirMock.mock.callCount(), 0);
      assert.strictEqual(logMock.mock.callCount(), 0);
    });

    test('should call mkdirSync and log created message if directory does not exist', (t) => {
      const nonExistingDir = path.resolve(root, 'scripts/new_test_dir');

      const existsMock = t.mock.method(fs, 'existsSync', (p) => {
        return false;
      });

      const mkdirMock = t.mock.method(fs, 'mkdirSync', () => {});
      const logMock = t.mock.method(console, 'log', () => {});

      ensureDir(nonExistingDir);

      assert.strictEqual(existsMock.mock.callCount(), 1);
      assert.strictEqual(mkdirMock.mock.callCount(), 1);
      assert.deepStrictEqual(mkdirMock.mock.calls[0].arguments, [path.normalize(nonExistingDir), { recursive: true }]);

      assert.strictEqual(logMock.mock.callCount(), 1);
      const expectedLoggedMsg = `Created: ${path.relative(root, nonExistingDir)}`;
      assert.strictEqual(logMock.mock.calls[0].arguments[0], expectedLoggedMsg);
    });

    test('should throw Security Error if path is outside workspace root', (t) => {
      const outsidePath = path.resolve(root, '../outside_dir');

      const mkdirMock = t.mock.method(fs, 'mkdirSync', () => {});
      const logMock = t.mock.method(console, 'log', () => {});

      assert.throws(() => {
        ensureDir(outsidePath);
      }, /Security Error/);

      assert.strictEqual(mkdirMock.mock.callCount(), 0);
      assert.strictEqual(logMock.mock.callCount(), 0);
    });
  });
});
