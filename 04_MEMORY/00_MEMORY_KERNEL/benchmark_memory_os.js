const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const root = path.resolve(__dirname, '../..');
const indexFilePath = path.join(root, '04_MEMORY', '00_MEMORY_KERNEL', 'memory_index.json');
const backupFilePath = path.join(root, '04_MEMORY', '00_MEMORY_KERNEL', 'memory_index.json.bak');

// Backup the existing memory index
let backedUp = false;
if (fs.existsSync(indexFilePath)) {
  fs.copyFileSync(indexFilePath, backupFilePath);
  backedUp = true;
}

// Generate a larger mock index
const entries = [];
for (let i = 0; i < 200; i++) {
  entries.push({
    id: `mock_entry_${i}`,
    path: `04_MEMORY/mock_file_${i}.txt`,
    segment: i % 2 === 0 ? 'global_memory' : 'project_memory',
    tags: [`tag_${i}`, 'robot', 'kinematics'],
    keywords: ['antigravity', 'robot', 'sensor', 'kinematics', `key_${i}`],
    metadata: {},
    registered_at: new Date().toISOString()
  });
}
const mockIndex = {
  version: 1.0,
  last_updated: new Date().toISOString(),
  entries
};

fs.writeFileSync(indexFilePath, JSON.stringify(mockIndex, null, 2), 'utf8');

// Load memory OS
const memoryOs = require('./memory_os');

// Force cache clearing if optimization is already in place (for comparison)
if (typeof memoryOs.clearCache === 'function') {
  memoryOs.clearCache();
}

console.log('--- Starting Memory OS Benchmark ---');
console.log(`Database size: ${entries.length} entries`);

const ITERATIONS = 1000;

// Benchmark loadIndex
console.log(`\n1. Benchmarking loadIndex() over ${ITERATIONS} iterations...`);
const startLoad = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  memoryOs.loadIndex();
}
const endLoad = performance.now();
const loadDuration = endLoad - startLoad;
console.log(`   Total time: ${loadDuration.toFixed(2)} ms`);
console.log(`   Throughput: ${(ITERATIONS / (loadDuration / 1000)).toFixed(2)} ops/sec`);

// Benchmark queryMemory
console.log(`\n2. Benchmarking queryMemory() over ${ITERATIONS} iterations...`);
const startQuery = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  memoryOs.queryMemory('robot kinematics', { segment: 'project_memory' });
}
const endQuery = performance.now();
const queryDuration = endQuery - startQuery;
console.log(`   Total time: ${queryDuration.toFixed(2)} ms`);
console.log(`   Throughput: ${(ITERATIONS / (queryDuration / 1000)).toFixed(2)} ops/sec`);

// Restore backup
if (backedUp) {
  fs.copyFileSync(backupFilePath, indexFilePath);
  fs.unlinkSync(backupFilePath);
} else {
  if (fs.existsSync(indexFilePath)) {
    fs.unlinkSync(indexFilePath);
  }
}

console.log('\n--- Benchmark Completed and Cleaned Up ---');
