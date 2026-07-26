const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const http = require('http');

const PORT = 3005;

// Helper to kill any process running on PORT
function killPortProcess() {
  try {
    const { execSync } = require('child_process');
    if (process.platform === 'win32') {
      execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING && taskkill /F /IM node.exe`, { stdio: 'ignore' });
    } else {
      execSync(`kill $(lsof -t -i :${PORT}) 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch (e) {
    // Ignore error if port is already free
  }
}

// Function to make HTTP requests
function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'GET',
      headers: headers
    };
    const req = http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

test('Security Vulnerability Fix Integration Tests', async (t) => {
  console.log(`Clearing port ${PORT} at test start...`);
  killPortProcess();

  console.log('Spawning server process...');
  const serverProc = spawn('node', ['scripts/server.js'], {
    stdio: 'ignore',
    detached: false,
    env: { ...process.env, PORT: PORT }
  });

  // Give server 1.5 seconds to start up
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const validToken = 'antigravity_secret_token';
  const validHeaders = { 'Authorization': `Bearer ${validToken}` };

  try {
    await t.test('Test 1: Unauthenticated logs endpoint -> should fail with 401 Unauthorized', async () => {
      const res = await makeRequest('/api/logs');
      assert.strictEqual(res.statusCode, 401);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.success, false);
      assert.match(body.error, /401 Unauthorized/);
    });

    await t.test('Test 1b: Logs endpoint with invalid token -> should fail with 401 Unauthorized', async () => {
      const res = await makeRequest('/api/logs', { 'Authorization': 'Bearer wrong_token_123' });
      assert.strictEqual(res.statusCode, 401);
    });

    await t.test('Test 2: Valid logs with Bearer token -> should succeed (200)', async () => {
      const res = await makeRequest('/api/logs', validHeaders);
      assert.strictEqual(res.statusCode, 200);
    });

    await t.test('Test 2b: Valid logs with token query parameter -> should succeed (200)', async () => {
      const res = await makeRequest(`/api/logs?token=${validToken}`);
      assert.strictEqual(res.statusCode, 200);
    });

    await t.test('Test 3: Valid logs with session cookie -> should succeed (200)', async () => {
      const homeRes = await makeRequest('/');
      const setCookie = homeRes.headers['set-cookie'];
      assert.ok(setCookie);
      assert.ok(setCookie[0].includes('session_token='));

      const cookieVal = setCookie[0].split(';')[0];
      const res = await makeRequest('/api/logs', { 'Cookie': cookieVal });
      assert.strictEqual(res.statusCode, 200);
    });

    await t.test('Test 4: Invalid logs type with credentials -> should fail with 400 Bad Request', async () => {
      const res = await makeRequest('/api/logs?type=invalid_type', validHeaders);
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.success, false);
      assert.match(body.error, /Invalid log type/);
    });

    await t.test('Test 5: Malicious traversal parameter with credentials -> should fail with 400 Bad Request', async () => {
      const res = await makeRequest('/api/logs?type=../etc/passwd', validHeaders);
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.success, false);
      assert.match(body.error, /Invalid log type/);
    });

    await t.test('Test 6: Fetching valid project ID state -> should succeed (200)', async () => {
      const res = await makeRequest('/api/state/test_valid_proj_123');
      assert.strictEqual(res.statusCode, 200);
    });

    await t.test('Test 7: Malicious project ID with path traversal -> should fail with 400 Bad Request', async () => {
      const res = await makeRequest('/api/state?projectId=../../etc/passwd');
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.success, false);
      assert.match(body.error, /Invalid Project ID format/);
    });

    await t.test('Test 8: Malicious project ID with special characters -> should fail with 400 Bad Request', async () => {
      const res = await makeRequest('/api/state/project-illegal$');
      assert.strictEqual(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.success, false);
      assert.match(body.error, /Invalid Project ID format/);
    });

  } finally {
    console.log('Terminating server process...');
    serverProc.kill();
  }
});
