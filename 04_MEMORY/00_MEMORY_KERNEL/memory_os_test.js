const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const memoryOs = require('./memory_os');

const root = path.resolve(__dirname, '../..');
const indexFilePath = path.join(root, '04_MEMORY', '00_MEMORY_KERNEL', 'memory_index.json');
const testBackupPath = path.join(root, '04_MEMORY', '00_MEMORY_KERNEL', 'memory_index_test.json.bak');

test.describe('memory_os tests', () => {
  let backedUp = false;

  test.before(() => {
    // Backup existing index
    if (fs.existsSync(indexFilePath)) {
      fs.copyFileSync(indexFilePath, testBackupPath);
      backedUp = true;
    }
  });

  test.after(() => {
    // Restore backup
    if (backedUp) {
      fs.copyFileSync(testBackupPath, indexFilePath);
      if (fs.existsSync(testBackupPath)) {
        fs.unlinkSync(testBackupPath);
      }
    } else {
      if (fs.existsSync(indexFilePath)) {
        fs.unlinkSync(indexFilePath);
      }
    }
    memoryOs.clearCache();
  });

  test.beforeEach(() => {
    memoryOs.clearCache();
    if (fs.existsSync(indexFilePath)) {
      fs.unlinkSync(indexFilePath);
    }
  });

  test('should load default index when index file does not exist', () => {
    const index = memoryOs.loadIndex();
    assert.strictEqual(index.version, 1.0);
    assert.ok(Array.isArray(index.entries));
    assert.strictEqual(index.entries.length, 0);
  });

  test('should cache loaded index in-memory and clear on clearCache()', () => {
    const index1 = memoryOs.loadIndex();

    // Modify index1 to simulate cache check
    index1.version = 42.0;

    const index2 = memoryOs.loadIndex();
    assert.strictEqual(index2.version, 42.0, 'Subsequent load should return cached object');

    memoryOs.clearCache();
    const index3 = memoryOs.loadIndex();
    assert.strictEqual(index3.version, 1.0, 'Should load fresh default from file (or recreate) after clearCache');
  });

  test('should successfully register a new memory and update cache', () => {
    const tempFile = path.join(root, '04_MEMORY', 'temp_test_doc.txt');
    fs.writeFileSync(tempFile, 'The quick brown fox jumps over the lazy dog kinematics.', 'utf8');

    try {
      memoryOs.registerMemory(tempFile, 'global_memory', ['test_tag'], { author: 'jules' });

      // Load index and check entry
      const index = memoryOs.loadIndex();
      assert.strictEqual(index.entries.length, 1);

      const entry = index.entries[0];
      assert.strictEqual(entry.id, 'temp_test_doc');
      assert.strictEqual(entry.segment, 'global_memory');
      assert.deepStrictEqual(entry.tags, ['test_tag']);
      assert.strictEqual(entry.metadata.author, 'jules');
      assert.ok(entry.keywords.includes('quick') || entry.keywords.includes('kinematics'));
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test('should query memory correctly matching tags, keywords, and ID with segments filtering', () => {
    const tempFile1 = path.join(root, '04_MEMORY', 'gait_control.txt');
    const tempFile2 = path.join(root, '04_MEMORY', 'hardware_bom.txt');

    fs.writeFileSync(tempFile1, 'gait kinematics controller stability', 'utf8');
    fs.writeFileSync(tempFile2, 'bom list parts cost controller', 'utf8');

    try {
      memoryOs.registerMemory(tempFile1, 'global_memory', ['gait', 'kinematics']);
      memoryOs.registerMemory(tempFile2, 'project_memory', ['hardware', 'bom']);

      // Query globally for controller
      const results1 = memoryOs.queryMemory('controller');
      assert.strictEqual(results1.length, 2);

      // Verify sorting order / scores (ID match has higher weight)
      const results2 = memoryOs.queryMemory('gait_control');
      assert.ok(results2.length > 0);
      assert.strictEqual(results2[0].entry.id, 'gait_control');

      // Query with segment filter
      const resultsFiltered = memoryOs.queryMemory('controller', { segment: 'project_memory' });
      assert.strictEqual(resultsFiltered.length, 1);
      assert.strictEqual(resultsFiltered[0].entry.id, 'hardware_bom');

    } finally {
      if (fs.existsSync(tempFile1)) fs.unlinkSync(tempFile1);
      if (fs.existsSync(tempFile2)) fs.unlinkSync(tempFile2);
    }
  });
});
