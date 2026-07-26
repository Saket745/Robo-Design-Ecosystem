const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', '12_SYSTEM_LOGS', '02_EXECUTION_LOGS', 'execution.jsonl');
const backupPath = logFilePath + '.bak';

const executionLogger = require(path.join(__dirname, '..', '12_SYSTEM_LOGS', '02_EXECUTION_LOGS', 'execution_logger'));

// Helper to track event loop lag / blockage
let maxEventLoopLag = 0;
let lagTimer;
function startTrackingLag() {
  let lastTime = Date.now();
  maxEventLoopLag = 0;
  lagTimer = setInterval(() => {
    const now = Date.now();
    const delay = now - lastTime - 10; // expected interval is 10ms
    if (delay > maxEventLoopLag) {
      maxEventLoopLag = delay;
    }
    lastTime = now;
  }, 10);
}

function stopTrackingLag() {
  clearInterval(lagTimer);
}

async function run() {
  console.log('Establishing performance benchmark for execution_logger...');

  // 1. Setup large file
  let hadBackup = false;
  if (fs.existsSync(logFilePath)) {
    fs.renameSync(logFilePath, backupPath);
    hadBackup = true;
  }

  // Populate 10,000 log lines (~2.5 MB)
  const lineData = [];
  for (let i = 0; i < 10000; i++) {
    lineData.push(JSON.stringify({
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      level: i % 20 === 0 ? 'ERROR' : 'INFO',
      taskId: `task-${i % 100}`,
      event: 'test-event',
      status: i % 10 === 0 ? 'failed' : 'completed',
      message: `Log line entry number ${i}`
    }));
  }
  fs.writeFileSync(logFilePath, lineData.join('\n') + '\n', 'utf8');
  console.log(`Created large log file with 10,000 entries (${(fs.statSync(logFilePath).size / 1024 / 1024).toFixed(2)} MB).`);

  try {
    // 2. Warm up
    const resWarm = executionLogger.queryExecutionLogs({ limit: 10 });
    if (resWarm instanceof Promise) await resWarm;

    // 3. Run queries and measure duration & event loop blockage
    startTrackingLag();
    const startTime = Date.now();

    const iterations = 200;
    console.log(`Running ${iterations} log query operations...`);

    const queryPromises = [];
    for (let i = 0; i < iterations; i++) {
      // Alternate filters
      const filter = i % 2 === 0 ? { taskId: 'task-5' } : { status: 'failed', limit: 10 };
      const res = executionLogger.queryExecutionLogs(filter);
      if (res instanceof Promise) {
        queryPromises.push(res);
      }
    }

    if (queryPromises.length > 0) {
      console.log('Detected Promise-based queries. Awaiting all in parallel...');
      await Promise.all(queryPromises);
    } else {
      console.log('Detected synchronous queries. Operations executed blocking-ly.');
    }

    const duration = Date.now() - startTime;
    stopTrackingLag();

    console.log('\n--- BENCHMARK RESULTS ---');
    console.log(`Total Duration:     ${duration} ms`);
    console.log(`Throughput:         ${(iterations / (duration / 1000)).toFixed(2)} queries/sec`);
    console.log(`Max Event Loop Lag: ${maxEventLoopLag.toFixed(2)} ms`);
    console.log('-------------------------\n');

  } finally {
    // Cleanup
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
    if (hadBackup) {
      fs.renameSync(backupPath, logFilePath);
    }
  }
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
