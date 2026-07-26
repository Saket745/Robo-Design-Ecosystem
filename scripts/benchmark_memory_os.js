const path = require('path');
const { performance } = require('perf_hooks');
const memoryOS = require('../04_MEMORY/00_MEMORY_KERNEL/memory_os');

function runBenchmark(iterations = 10000) {
  console.log(`Running benchmark with ${iterations} query iterations...`);

  // Warm up
  memoryOS.queryMemory('governance');

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    memoryOS.queryMemory('governance');
  }
  const end = performance.now();

  const duration = end - start;
  const opsPerSec = (iterations / (duration / 1000)).toFixed(2);
  const avgLatency = (duration / iterations).toFixed(4);

  console.log(`--- Results ---`);
  console.log(`Total duration: ${duration.toFixed(2)} ms`);
  console.log(`Queries / sec:  ${opsPerSec}`);
  console.log(`Avg latency:    ${avgLatency} ms`);
  console.log(`----------------`);
}

if (require.main === module) {
  runBenchmark();
}
