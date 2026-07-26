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
