const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { validatePath } = require('./generate_robotics_skills');

test('generate_robotics_skills.validatePath unit tests', async (t) => {
  const root = path.resolve(__dirname, '..');

  await t.test('should validate and return resolved path for valid relative path inside root', () => {
    const target = 'scripts';
    const expected = path.resolve(root, target);
    const result = validatePath(target);
    assert.strictEqual(result, expected);
  });

  await t.test('should validate and return resolved path for valid absolute path inside root', () => {
    const target = path.join(root, 'scripts', 'generate_robotics_skills.js');
    const expected = path.resolve(target);
    const result = validatePath(target);
    assert.strictEqual(result, expected);
  });

  await t.test('should validate and return resolved path for the exact root path', () => {
    const expected = path.resolve(root);
    assert.strictEqual(validatePath('.'), expected);
    assert.strictEqual(validatePath(root), expected);
  });

  await t.test('should throw security error for relative path traversal going outside root', () => {
    const target = '..';
    assert.throws(() => {
      validatePath(target);
    }, (err) => {
      return err instanceof Error && err.message.includes('Security Error');
    });
  });

  await t.test('should throw security error for absolute path outside of root', () => {
    // Construct a path that is guaranteed to be outside the root by going to root's parent directory
    const parentDir = path.dirname(root);
    if (parentDir !== root) {
      const outsidePath = path.join(parentDir, 'some_other_folder_outside_root');
      assert.throws(() => {
        validatePath(outsidePath);
      }, (err) => {
        return err instanceof Error && err.message.includes('Security Error');
      });
    }
  });

  await t.test('should throw security error for deep relative path traversal', () => {
    const target = '../../../../etc/passwd';
    assert.throws(() => {
      validatePath(target);
    }, (err) => {
      return err instanceof Error && err.message.includes('Security Error');
    });
  });
});
