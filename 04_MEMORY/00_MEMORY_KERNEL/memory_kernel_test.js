const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const memoryKernel = require('./memory_kernel');

const mockConfigContent = `
layers:
  global:
    path: "04_MEMORY/01_GLOBAL_MEMORY/global_store.json"
    max_entries: 1000
  project:
    path: "04_MEMORY/02_PROJECT_MEMORY/project_store.json"
    max_entries: 500
`;

test.describe('memory_kernel.query tests', () => {

  test('should return all entries in correct order when filter is empty', (t) => {
    const storeData = {
      keys: {
        'key1': { value: 'val1', metadata: { type: 'audit', level: 'info' } },
        'key2': { value: 'val2', metadata: { type: 'execution', level: 'error' } }
      },
      order: ['key1', 'key2']
    };

    t.mock.method(fs, 'existsSync', (filePath) => {
      return true;
    });

    t.mock.method(fs, 'readFileSync', (filePath, encoding) => {
      if (filePath.endsWith('memory_config.yaml')) {
        return mockConfigContent;
      }
      return JSON.stringify(storeData);
    });

    const results = memoryKernel.query('global', {});

    assert.strictEqual(results.length, 2);
    assert.deepStrictEqual(results[0], {
      key: 'key1',
      value: 'val1',
      metadata: { type: 'audit', level: 'info' }
    });
    assert.deepStrictEqual(results[1], {
      key: 'key2',
      value: 'val2',
      metadata: { type: 'execution', level: 'error' }
    });
  });

  test('should filter entries by a single metadata field', (t) => {
    const storeData = {
      keys: {
        'key1': { value: 'val1', metadata: { type: 'audit', level: 'info' } },
        'key2': { value: 'val2', metadata: { type: 'execution', level: 'error' } },
        'key3': { value: 'val3', metadata: { type: 'audit', level: 'warning' } }
      },
      order: ['key1', 'key2', 'key3']
    };

    t.mock.method(fs, 'existsSync', (filePath) => {
      return true;
    });

    t.mock.method(fs, 'readFileSync', (filePath, encoding) => {
      if (filePath.endsWith('memory_config.yaml')) {
        return mockConfigContent;
      }
      return JSON.stringify(storeData);
    });

    const results = memoryKernel.query('global', { type: 'audit' });

    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].key, 'key1');
    assert.strictEqual(results[1].key, 'key3');
  });

  test('should filter entries by multiple metadata fields (AND condition)', (t) => {
    const storeData = {
      keys: {
        'key1': { value: 'val1', metadata: { type: 'audit', level: 'info' } },
        'key2': { value: 'val2', metadata: { type: 'execution', level: 'error' } },
        'key3': { value: 'val3', metadata: { type: 'audit', level: 'error' } }
      },
      order: ['key1', 'key2', 'key3']
    };

    t.mock.method(fs, 'existsSync', (filePath) => {
      return true;
    });

    t.mock.method(fs, 'readFileSync', (filePath, encoding) => {
      if (filePath.endsWith('memory_config.yaml')) {
        return mockConfigContent;
      }
      return JSON.stringify(storeData);
    });

    const results = memoryKernel.query('global', { type: 'audit', level: 'error' });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].key, 'key3');
    assert.deepStrictEqual(results[0].metadata, { type: 'audit', level: 'error' });
  });

  test('should return empty array if no entries match the filter', (t) => {
    const storeData = {
      keys: {
        'key1': { value: 'val1', metadata: { type: 'audit', level: 'info' } }
      },
      order: ['key1']
    };

    t.mock.method(fs, 'existsSync', (filePath) => {
      return true;
    });

    t.mock.method(fs, 'readFileSync', (filePath, encoding) => {
      if (filePath.endsWith('memory_config.yaml')) {
        return mockConfigContent;
      }
      return JSON.stringify(storeData);
    });

    const results = memoryKernel.query('global', { level: 'error' });

    assert.strictEqual(results.length, 0);
  });

  test('should return empty array if memory store is empty or does not exist', (t) => {
    t.mock.method(fs, 'existsSync', (filePath) => {
      if (filePath.endsWith('memory_config.yaml')) {
        return true;
      }
      return false; // store file doesn't exist
    });

    t.mock.method(fs, 'readFileSync', (filePath, encoding) => {
      if (filePath.endsWith('memory_config.yaml')) {
        return mockConfigContent;
      }
      throw new Error('File does not exist');
    });

    const results = memoryKernel.query('global', {});

    assert.strictEqual(results.length, 0);
  });

  test('should throw error when querying an invalid memory layer', (t) => {
    t.mock.method(fs, 'existsSync', (filePath) => {
      return true;
    });

    t.mock.method(fs, 'readFileSync', (filePath, encoding) => {
      if (filePath.endsWith('memory_config.yaml')) {
        return mockConfigContent;
      }
      return '{}';
    });

    assert.throws(() => {
      memoryKernel.query('invalid_layer', {});
    }, /Invalid memory layer: invalid_layer/);
  });

});
