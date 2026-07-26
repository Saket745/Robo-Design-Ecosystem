const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');

const PORT = 3000;
const TEST_JWT_SECRET = 'test_jwt_secret_123';

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };

  const base64UrlEncode = (obj) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const headerB64 = base64UrlEncode(header);
  const payloadB64 = base64UrlEncode(payload);

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${headerB64}.${payloadB64}`);
  const signatureB64 = hmac.digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

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

// Function to make HTTP requests with optional headers
function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'GET',
      headers: headers
    };
    http.get(options, (res) => {
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
    }).on('error', (err) => {
      reject(err);
    });
  });
}

test('scripts/test-security-fix.js integration tests', async (t) => {
  console.log('Clearing port 3000...');
  killPortProcess();

  console.log('Spawning server process with custom JWT_SECRET...');
  const serverProc = spawn('node', ['scripts/server.js'], {
    stdio: 'ignore', // Ignore stdio to avoid signal/pipe interference with the parent
    detached: false,
    env: {
      ...process.env,
      JWT_SECRET: TEST_JWT_SECRET
    }
  });

  // Give server 1.5 seconds to start up
  await new Promise((resolve) => setTimeout(resolve, 1500));

  t.after(() => {
    console.log('\nTerminating server process...');
    serverProc.kill('SIGKILL');
  });

  const validToken = signJwt({ role: 'admin', user: 'test_user' }, TEST_JWT_SECRET);
  const invalidSignatureToken = signJwt({ role: 'admin', user: 'test_user' }, 'wrong_secret_key');
  const invalidRoleToken = signJwt({ role: 'user', user: 'test_user' }, TEST_JWT_SECRET);

  await t.test('Test 1a: Fetching default /api/logs WITHOUT a token -> should fail with 401 Unauthorized', async () => {
    const res = await makeRequest('/api/logs');
    assert.strictEqual(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('401 Unauthorized'));
  });

  await t.test('Test 1b: Fetching default /api/logs WITH invalid signature JWT -> should fail with 401 Unauthorized', async () => {
    const res = await makeRequest('/api/logs', { 'Authorization': `Bearer ${invalidSignatureToken}` });
    assert.strictEqual(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('401 Unauthorized'));
  });

  await t.test('Test 1c: Fetching default /api/logs WITH invalid role JWT -> should fail with 401 Unauthorized', async () => {
    const res = await makeRequest('/api/logs', { 'Authorization': `Bearer ${invalidRoleToken}` });
    assert.strictEqual(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('401 Unauthorized'));
  });

  await t.test('Test 1d: Fetching default /api/logs WITH valid Bearer JWT -> should succeed (200 OK)', async () => {
    const res = await makeRequest('/api/logs', { 'Authorization': `Bearer ${validToken}` });
    assert.strictEqual(res.statusCode, 200);
  });

  await t.test('Test 1e: Fetching default /api/logs WITH valid JWT cookie -> should succeed (200 OK)', async () => {
    const res = await makeRequest('/api/logs', { 'Cookie': `logs_token=${validToken}` });
    assert.strictEqual(res.statusCode, 200);
  });

  await t.test('Test 1f: Fetching default /api/logs WITH valid JWT query parameter -> should succeed (200 OK)', async () => {
    const res = await makeRequest(`/api/logs?token=${validToken}`);
    assert.strictEqual(res.statusCode, 200);
  });

  await t.test('Test 1g: Fetching root index / sets cookie with valid signed JWT -> should succeed (200 OK)', async () => {
    const res = await makeRequest('/');
    assert.strictEqual(res.statusCode, 200);
    const setCookie = res.headers['set-cookie'];
    assert.ok(setCookie);
    const cookieStr = setCookie[0];
    assert.ok(cookieStr.includes('logs_token='));
    assert.ok(cookieStr.includes('HttpOnly'));
    assert.ok(cookieStr.includes('SameSite=Strict'));

    // Extract token from cookie string and verify it
    const tokenPart = cookieStr.split(';')[0].split('=')[1];
    assert.notStrictEqual(tokenPart, TEST_JWT_SECRET); // It should NOT leak the raw secret!

    // Test logging with the browser's set cookie
    const logsRes = await makeRequest('/api/logs', { 'Cookie': `logs_token=${tokenPart}` });
    assert.strictEqual(logsRes.statusCode, 200);
  });

  await t.test('Test 2: Valid logs type "execution" (with valid token) -> should succeed (200 OK)', async () => {
    const res = await makeRequest(`/api/logs?type=execution&token=${validToken}`);
    assert.strictEqual(res.statusCode, 200);
  });

  await t.test('Test 3: Valid logs type "audit" (with valid token) -> should succeed (200 OK)', async () => {
    const res = await makeRequest(`/api/logs?type=audit&token=${validToken}`);
    assert.strictEqual(res.statusCode, 200);
  });

  await t.test('Test 4: Invalid logs type "invalid_type" (with valid token) -> should fail with 400 Bad Request', async () => {
    const res = await makeRequest(`/api/logs?type=invalid_type&token=${validToken}`);
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('Invalid log type'));
  });

  await t.test('Test 5: Malicious traversal parameter "../etc/passwd" (with valid token) -> should fail with 400 Bad Request', async () => {
    const res = await makeRequest(`/api/logs?type=../etc/passwd&token=${validToken}`);
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('Invalid log type'));
  });

  await t.test('Test 6: Fetching valid project ID state -> should succeed (200 OK)', async () => {
    const res = await makeRequest('/api/state/test_valid_proj_123');
    assert.strictEqual(res.statusCode, 200);
  });

  await t.test('Test 7: Malicious project ID with path traversal -> should fail with 400 Bad Request', async () => {
    const res = await makeRequest('/api/state?projectId=../../etc/passwd');
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('Invalid Project ID format'));
  });

  await t.test('Test 8: Malicious project ID with special characters -> should fail with 400 Bad Request', async () => {
    const res = await makeRequest('/api/state/project-illegal$');
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('Invalid Project ID format'));
  });
});
