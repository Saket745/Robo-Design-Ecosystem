const http = require('http');
const childProcess = require('child_process');
const path = require('path');

function makeRequests(url, count, concurrency) {
  return new Promise((resolve) => {
    let completed = 0;
    let running = 0;
    let index = 0;
    const latencies = [];

    function startNext() {
      if (index >= count) {
        if (running === 0) resolve(latencies);
        return;
      }

      const currentIdx = index++;
      running++;
      const startTime = process.hrtime.bigint();

      const parsedUrl = new URL(url);
      const req = http.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: 'POST'
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const endTime = process.hrtime.bigint();
          const latency = Number(endTime - startTime) / 1e6; // ms
          latencies.push(latency);
          running--;
          completed++;
          startNext();
        });
      });

      req.on('error', (err) => {
        running--;
        completed++;
        startNext();
      });

      req.end();
    }

    for (let i = 0; i < Math.min(concurrency, count); i++) {
      startNext();
    }
  });
}

async function run() {
  console.log('Running real HTTP request validation benchmark...');
  const serverProcess = childProcess.exec('node scripts/server.js');

  // Wait for server to start
  await new Promise(r => setTimeout(r, 1500));

  const url = 'http://localhost:3000/api/validate';
  console.log('Warming up server...');
  await makeRequests(url, 5, 2);

  console.log('Starting validation benchmark (50 requests, concurrency 5)...');
  const start = process.hrtime.bigint();
  const latencies = await makeRequests(url, 50, 5);
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;

  if (latencies.length === 0) {
    console.error('No latencies recorded. Requests might have failed.');
    serverProcess.kill('SIGTERM');
    process.exit(1);
    return;
  }

  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log(`\nHTTP Performance Results:`);
  console.log(`Total Duration: ${durationMs.toFixed(2)} ms`);
  console.log(`Requests/sec:   ${(latencies.length / (durationMs / 1000)).toFixed(2)}`);
  console.log(`Latency Avg:    ${avg.toFixed(2)} ms`);
  console.log(`Latency P50:    ${p50.toFixed(2)} ms`);
  console.log(`Latency P95:    ${p95.toFixed(2)} ms`);
  console.log(`Latency P99:    ${p99.toFixed(2)} ms`);

  // Kill server process
  serverProcess.kill('SIGTERM');

  // Try to clean up port 3000
  try {
    const { execSync } = require('child_process');
    if (process.platform !== 'win32') {
      execSync(`kill $(lsof -t -i :3000) 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch (e) {}

  process.exit(0);
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  makeRequests,
  run
};
