const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { validatePath, root } = require('./scaffold');

test.describe('scaffold.validatePath tests', () => {

  test('should allow paths directly inside the root directory', () => {
    const target = path.join(root, 'scripts', 'scaffold.js');
    const result = validatePath(target);
    assert.strictEqual(result, path.normalize(target));
  });

  test('should allow the root directory itself', () => {
    const result = validatePath(root);
    assert.strictEqual(result, path.normalize(root));
  });

  test('should allow paths with relative dot segments that resolve inside the root', () => {
    const target = path.join(root, 'scripts', '..', 'scripts', 'scaffold.js');
    const expected = path.join(root, 'scripts', 'scaffold.js');
    const result = validatePath(target);
    assert.strictEqual(result, path.normalize(expected));
  });

  test('should throw a security error for relative paths resolving outside the root', () => {
    const target = path.join(root, '..');
    assert.throws(() => {
      validatePath(target);
    }, (err) => {
      return err instanceof Error && err.message.includes('Security Error: Path') && err.message.includes('is outside allowed root');
    });
  });

  test('should throw a security error for external absolute paths outside the root', () => {
    const target = path.resolve(root, '..', 'some_external_dir');
    assert.throws(() => {
      validatePath(target);
    }, (err) => {
      return err instanceof Error && err.message.includes('Security Error: Path');
    });
  });

});
