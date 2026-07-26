const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const childProcess = require('child_process');
const benchmark = require('./benchmark_skill_detail');

test('benchmark_skill_detail unit tests', async (t) => {
  let server;
  let serverPort;

  // Set up local http server for makeRequests testing
  t.before(() => {
    return new Promise((resolve) => {
      server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
      server.listen(0, '127.0.0.1', () => {
        serverPort = server.address().port;
        resolve();
      });
    });
  });

  t.after(() => {
    return new Promise((resolve) => {
      if (server) {
        server.close(resolve);
      } else {
        resolve();
      }
    });
  });

  await t.test('makeRequests successfully processes parallel HTTP requests', async () => {
    const url = `http://127.0.0.1:${serverPort}/api/test`;
    const count = 10;
    const concurrency = 3;

    const latencies = await benchmark.makeRequests(url, count, concurrency);

    assert.ok(Array.isArray(latencies), 'latencies should be an array');
    assert.strictEqual(latencies.length, count, 'should return exactly "count" latencies');
    latencies.forEach(lat => {
      assert.strictEqual(typeof lat, 'number', 'each latency should be a number');
      assert.ok(lat >= 0, 'latency should be non-negative');
    });
  });

  await t.test('makeRequests handles connection/request errors gracefully and continues execution', async () => {
    // Port 1 is reserved and definitely not running our server
    const url = `http://127.0.0.1:1/nonexistent`;
    const count = 5;
    const concurrency = 2;

    const latencies = await benchmark.makeRequests(url, count, concurrency);

    // Since all requests fail, latencies should be empty
    assert.ok(Array.isArray(latencies));
    assert.strictEqual(latencies.length, 0, 'failed requests should not record latencies');
  });

  await t.test('run function succeeds under happy path with valid latencies', async () => {
    const originalExec = childProcess.exec;
    const originalMakeRequests = benchmark.makeRequests;
    const originalProcessExit = process.exit;

    let execCalled = false;
    let killCalled = false;
    let exitCode = null;

    childProcess.exec = (cmd) => {
      execCalled = true;
      assert.strictEqual(cmd, 'node scripts/server.js');
      return {
        kill: (signal) => {
          killCalled = true;
          assert.strictEqual(signal, 'SIGTERM');
        }
      };
    };

    benchmark.makeRequests = async (url, count, concurrency) => {
      assert.ok(url.includes('http://localhost:3000/api/skill-detail'));
      if (count === 100) {
        // warmup path
        return [5.5, 6.2];
      } else if (count === 1000) {
        // benchmark path
        return [10.2, 12.5, 8.4, 15.1, 9.9];
      }
      return [];
    };

    process.exit = (code) => {
      exitCode = code;
    };

    try {
      await benchmark.run();

      assert.strictEqual(execCalled, true, 'exec should have been called');
      assert.strictEqual(killCalled, true, 'serverProcess.kill should have been called');
      assert.strictEqual(exitCode, 0, 'process.exit should have been called with 0');
    } finally {
      // Clean up/restore
      childProcess.exec = originalExec;
      benchmark.makeRequests = originalMakeRequests;
      process.exit = originalProcessExit;
    }
  });

  await t.test('run function terminates and exits with 1 if there are no latencies', async () => {
    const originalExec = childProcess.exec;
    const originalMakeRequests = benchmark.makeRequests;
    const originalProcessExit = process.exit;

    let execCalled = false;
    let killCalled = false;
    let exitCode = null;

    childProcess.exec = (cmd) => {
      execCalled = true;
      assert.strictEqual(cmd, 'node scripts/server.js');
      return {
        kill: (signal) => {
          killCalled = true;
          assert.strictEqual(signal, 'SIGTERM');
        }
      };
    };

    benchmark.makeRequests = async (url, count, concurrency) => {
      return []; // Return empty latencies to simulate failure
    };

    process.exit = (code) => {
      exitCode = code;
    };

    try {
      await benchmark.run();
    } catch (err) {
      // If it throws or catches an expected error
    } finally {
      assert.strictEqual(execCalled, true, 'exec should have been called');
      assert.strictEqual(killCalled, true, 'serverProcess.kill should have been called');
      assert.strictEqual(exitCode, 1, 'process.exit should have been called with 1');

      // Clean up/restore
      childProcess.exec = originalExec;
      benchmark.makeRequests = originalMakeRequests;
      process.exit = originalProcessExit;
    }
  });
});
