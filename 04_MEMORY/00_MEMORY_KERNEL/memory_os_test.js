const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const memoryOS = require('./memory_os');

test.describe('memory_os Caching and Querying', () => {
  const root = path.resolve(__dirname, '../..');
  const indexFilePath = path.join(root, '04_MEMORY', '00_MEMORY_KERNEL', 'memory_index.json');
  let originalIndexContent = null;
  let mtimeCounter = 1;

  function writeIndexWithDistinctMtime(contentObj) {
    fs.writeFileSync(indexFilePath, JSON.stringify(contentObj, null, 2), 'utf8');
    // Set a distinct mtimeMs using fs.utimesSync to bypass filesystem sub-millisecond precision limitations
    const distinctTime = new Date(1000000000000 + (mtimeCounter++ * 10000));
    fs.utimesSync(indexFilePath, distinctTime, distinctTime);
  }

  test.before(() => {
    // Save original index so we can restore it
    if (fs.existsSync(indexFilePath)) {
      originalIndexContent = fs.readFileSync(indexFilePath, 'utf8');
    }
  });

  test.after(() => {
    // Restore original index
    if (originalIndexContent !== null) {
      fs.writeFileSync(indexFilePath, originalIndexContent, 'utf8');
    } else if (fs.existsSync(indexFilePath)) {
      fs.unlinkSync(indexFilePath);
    }
    memoryOS.clearCache();
  });

  test.beforeEach(() => {
    memoryOS.clearCache();
    if (fs.existsSync(indexFilePath)) {
      fs.unlinkSync(indexFilePath);
    }
  });

  test('should load default index when index file does not exist', () => {
    const index = memoryOS.loadIndex();
    assert.strictEqual(index.version, 1.0);
    assert.ok(Array.isArray(index.entries));
    assert.strictEqual(index.entries.length, 0);
  });

  test('should cache loaded index in-memory and clear on clearCache()', () => {
    const index1 = memoryOS.loadIndex();

    // Modify index1 to simulate cache check
    index1.version = 42.0;

    const index2 = memoryOS.loadIndex();
    assert.strictEqual(index2.version, 42.0, 'Subsequent load should return cached object');

    memoryOS.clearCache();
    const index3 = memoryOS.loadIndex();
    assert.strictEqual(index3.version, 1.0, 'Should load fresh default from file (or recreate) after clearCache');
  });

  test('should successfully register a new memory and update cache', () => {
    const tempFile = path.join(root, '04_MEMORY', 'temp_test_doc.txt');
    fs.writeFileSync(tempFile, 'The quick brown fox jumps over the lazy dog kinematics.', 'utf8');

    try {
      memoryOS.registerMemory(tempFile, 'global_memory', ['test_tag'], { author: 'jules' });

      // Load index and check entry
      const index = memoryOS.loadIndex();
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
      memoryOS.registerMemory(tempFile1, 'global_memory', ['gait', 'kinematics']);
      memoryOS.registerMemory(tempFile2, 'project_memory', ['hardware', 'bom']);

      // Query globally for controller
      const results1 = memoryOS.queryMemory('controller');
      assert.strictEqual(results1.length, 2);

      // Verify sorting order / scores (ID match has higher weight)
      const results2 = memoryOS.queryMemory('gait_control');
      assert.ok(results2.length > 0);
      assert.strictEqual(results2[0].entry.id, 'gait_control');

      // Query with segment filter
      const resultsFiltered = memoryOS.queryMemory('controller', { segment: 'project_memory' });
      assert.strictEqual(resultsFiltered.length, 1);
      assert.strictEqual(resultsFiltered[0].entry.id, 'hardware_bom');

    } finally {
      if (fs.existsSync(tempFile1)) fs.unlinkSync(tempFile1);
      if (fs.existsSync(tempFile2)) fs.unlinkSync(tempFile2);
    }
  });

  test('loadIndex should cache read operations', (t) => {
    // Load once to populate cache
    const firstLoad = memoryOS.loadIndex();
    assert.ok(firstLoad);
    assert.ok(Array.isArray(firstLoad.entries));

    // Measure time of a second load
    const start = process.hrtime.bigint();
    const secondLoad = memoryOS.loadIndex();
    const end = process.hrtime.bigint();

    assert.deepEqual(firstLoad, secondLoad);
    // Loading from cache should be extremely fast (typically < 1 ms)
    const elapsedMs = Number(end - start) / 1e6;
    assert.ok(elapsedMs < 10, `Caching should keep load under 10ms, took ${elapsedMs}ms`);
  });

  test('queryMemory should utilize the cached index and correctly score/sort results', (t) => {
    // Write a controlled temporary index file to disk
    const mockIndex = {
      version: 1.0,
      last_updated: new Date().toISOString(),
      entries: [
        {
          id: 'mock1',
          path: '04_MEMORY/00_MEMORY_KERNEL/mock1.js',
          segment: 'global_memory',
          tags: ['test', 'caching'],
          keywords: ['performance', 'optimization'],
          metadata: {},
          registered_at: new Date().toISOString()
        },
        {
          id: 'mock2',
          path: '04_MEMORY/00_MEMORY_KERNEL/mock2.js',
          segment: 'project_memory',
          tags: ['test'],
          keywords: ['speed'],
          metadata: {},
          registered_at: new Date().toISOString()
        }
      ]
    };

    // Save mock index directly to disk with distinct mtime
    writeIndexWithDistinctMtime(mockIndex);

    // Query for 'caching'
    const results = memoryOS.queryMemory('caching');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].entry.id, 'mock1');
    assert.ok(results[0].score >= 5); // tag match weight is 5

    // Query for 'test'
    const testResults = memoryOS.queryMemory('test');
    assert.strictEqual(testResults.length, 2);
  });

  test('loadIndex should self-heal and pick up manual/external edits on disk', (t) => {
    // 1. Save initial index with distinct mtime
    const initialIndex = {
      version: 1.0,
      last_updated: new Date().toISOString(),
      entries: [
        {
          id: 'initial',
          path: '04_MEMORY/00_MEMORY_KERNEL/initial.js',
          segment: 'global_memory',
          tags: ['initial'],
          keywords: [],
          metadata: {},
          registered_at: new Date().toISOString()
        }
      ]
    };
    writeIndexWithDistinctMtime(initialIndex);

    // Verify it is cached
    const loaded1 = memoryOS.loadIndex();
    assert.strictEqual(loaded1.entries[0].id, 'initial');

    // 2. Modify index file directly on disk with a different distinct mtime
    const modifiedIndex = {
      version: 1.0,
      last_updated: new Date().toISOString(),
      entries: [
        {
          id: 'external_edit',
          path: '04_MEMORY/00_MEMORY_KERNEL/external.js',
          segment: 'global_memory',
          tags: ['external'],
          keywords: [],
          metadata: {},
          registered_at: new Date().toISOString()
        }
      ]
    };

    // Write directly to disk with a distinct mtime
    writeIndexWithDistinctMtime(modifiedIndex);

    // 3. Load index again. It should detect that file has changed and reload!
    const loaded2 = memoryOS.loadIndex();
    assert.strictEqual(loaded2.entries[0].id, 'external_edit');
  });
});
