const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 3000;
const CONCURRENT_REQUESTS = 200;
const TOTAL_REQUESTS = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.get(`http://localhost:${PORT}/api/skill-detail?id=bom_procurement`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          time: Date.now() - start
        });
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function runBenchmark() {
  console.log('Starting server...');
  const serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
    stdio: 'ignore',
    env: { ...process.env, ALLOWED_ORIGINS: '*' }
  });

  // Give the server time to start
  await sleep(1500);

  console.log(`Running benchmark with ${TOTAL_REQUESTS} total requests, ${CONCURRENT_REQUESTS} at a time...`);

  const startTotal = Date.now();
  const times = [];
  let completed = 0;

  async function worker() {
    while (completed < TOTAL_REQUESTS) {
      completed++;
      try {
        const result = await makeRequest();
        times.push(result.time);
      } catch (err) {
        console.error('Request failed:', err.message);
      }
    }
  }

  // Spawn initial concurrent workers
  const workers = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const totalDuration = Date.now() - startTotal;
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const rps = (times.length / (totalDuration / 1000)).toFixed(2);

  console.log('\n--- BENCHMARK RESULTS ---');
  console.log(`Total duration: ${totalDuration}ms`);
  console.log(`Average request latency: ${avgTime.toFixed(2)}ms`);
  console.log(`Throughput: ${rps} requests/sec`);
  console.log('-------------------------\n');

  console.log('Killing server...');
  serverProcess.kill();
  // Ensure the server process is killed
  await sleep(500);
}

runBenchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
