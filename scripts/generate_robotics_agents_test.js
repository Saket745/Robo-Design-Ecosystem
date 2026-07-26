const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { ensureDir } = require('./generate_robotics_agents');

test.describe('generate_robotics_agents ensureDir tests', () => {
  const tempDir = path.join(__dirname, 'temp_test_ensure_dir');

  // Clean up before and after tests
  test.beforeEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test.afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should create a directory recursively if it does not exist', (t) => {
    const nestedDir = path.join(tempDir, 'nested', 'deeply', 'directory');
    assert.strictEqual(fs.existsSync(nestedDir), false);

    ensureDir(nestedDir);

    assert.strictEqual(fs.existsSync(nestedDir), true);
    assert.strictEqual(fs.statSync(nestedDir).isDirectory(), true);
  });

  test('should do nothing if the directory already exists', (t) => {
    const targetDir = path.join(tempDir, 'existing');
    fs.mkdirSync(targetDir, { recursive: true });
    assert.strictEqual(fs.existsSync(targetDir), true);

    // Call ensureDir on already existing directory
    ensureDir(targetDir);

    assert.strictEqual(fs.existsSync(targetDir), true);
    assert.strictEqual(fs.statSync(targetDir).isDirectory(), true);
  });

  test('should propagate error if parent path is a file', (t) => {
    // Creating a file where a directory should be
    const filePath = path.join(tempDir, 'file_exists');
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(filePath, 'some content', 'utf8');

    // Trying to create a nested directory inside that file path should throw ENOTDIR
    const nestedInFile = path.join(filePath, 'nested_subdir');
    assert.throws(() => {
      ensureDir(nestedInFile);
    }, (err) => {
      return err.code === 'ENOTDIR' || err.message.includes('ENOTDIR');
    });
  });
});
