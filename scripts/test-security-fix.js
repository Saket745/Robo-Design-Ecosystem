const { spawn } = require('child_process');
const http = require('http');

console.log('--- Starting Integration Test for Security Vulnerability Fix ---');

// Port used by the server
const PORT = 3000;

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

const TEST_TOKEN = 'test_secret_token_12345';

// Function to make HTTP requests
function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:${PORT}${path}`;
    const options = {
      headers: headers
    };
    http.get(url, options, (res) => {
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

// Function to make HTTP POST requests
function makePostRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'POST'
    }, (res) => {
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
    req.end();
  });
}

async function runTests() {
  console.log('Clearing port 3000...');
  killPortProcess();

  console.log('Spawning server process...');
  const serverProc = spawn('node', ['scripts/server.js'], {
    env: { ...process.env, ADMIN_TOKEN: TEST_TOKEN },
    stdio: 'inherit',
    detached: false
  });

  // Give server 1.5 seconds to start up
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let failed = false;

  try {
    // Test 1: Default logs endpoint (no type parameter, unauthenticated) -> should fail (401)
    console.log('\n[Test 1] Fetching default /api/logs unauthenticated...');
    const res1 = await makeRequest('/api/logs');
    if (res1.statusCode === 401) {
      console.log('✅ Test 1 Passed: Unauthenticated request to /api/logs was blocked with 401 Unauthorized');
    } else {
      console.error(`❌ Test 1 Failed: Expected status 401, got ${res1.statusCode}`);
      failed = true;
    }

    // Test 1b: Default logs endpoint (authenticated with Bearer token) -> should succeed (200)
    console.log('\n[Test 1b] Fetching default /api/logs with Bearer token...');
    const res1b = await makeRequest('/api/logs', { 'Authorization': `Bearer ${TEST_TOKEN}` });
    if (res1b.statusCode === 200) {
      console.log('✅ Test 1b Passed: Authenticated Bearer request to /api/logs succeeded with 200 OK');
    } else {
      console.error(`❌ Test 1b Failed: Expected status 200, got ${res1b.statusCode}`);
      failed = true;
    }

    // Test 1c: Default logs endpoint (attempt with cookie) -> should fail (401) for defense-in-depth secure design
    console.log('\n[Test 1c] Fetching default /api/logs with Session Cookie...');
    const res1c = await makeRequest('/api/logs', { 'Cookie': `session_token=${TEST_TOKEN}` });
    if (res1c.statusCode === 401) {
      console.log('✅ Test 1c Passed: Cookie alone was correctly ignored, requiring stronger headers (401 Unauthorized)');
    } else {
      console.error(`❌ Test 1c Failed: Expected status 401, got ${res1c.statusCode}`);
      failed = true;
    }

    // Test 1d: Default logs endpoint (authenticated with X-API-Key) -> should succeed (200)
    console.log('\n[Test 1d] Fetching default /api/logs with X-API-Key...');
    const res1d = await makeRequest('/api/logs', { 'X-API-Key': TEST_TOKEN });
    if (res1d.statusCode === 200) {
      console.log('✅ Test 1d Passed: Authenticated X-API-Key request to /api/logs succeeded with 200 OK');
    } else {
      console.error(`❌ Test 1d Failed: Expected status 200, got ${res1d.statusCode}`);
      failed = true;
    }

    // Test 1e: Default logs endpoint (authenticated with query parameter) -> should succeed (200)
    console.log('\n[Test 1e] Fetching default /api/logs with query token...');
    const res1e = await makeRequest(`/api/logs?token=${TEST_TOKEN}`);
    if (res1e.statusCode === 200) {
      console.log('✅ Test 1e Passed: Authenticated query param token request to /api/logs succeeded with 200 OK');
    } else {
      console.error(`❌ Test 1e Failed: Expected status 200, got ${res1e.statusCode}`);
      failed = true;
    }

    // Test 2: Valid logs type 'execution' (unauthenticated) -> should fail (401)
    console.log('\n[Test 2] Fetching /api/logs?type=execution unauthenticated...');
    const res2 = await makeRequest('/api/logs?type=execution');
    if (res2.statusCode === 401) {
      console.log('✅ Test 2 Passed: Unauthenticated request to execution logs was blocked with 401 Unauthorized');
    } else {
      console.error(`❌ Test 2 Failed: Expected status 401, got ${res2.statusCode}`);
      failed = true;
    }

    // Test 2b: Valid logs type 'execution' (authenticated) -> should succeed (200)
    console.log('\n[Test 2b] Fetching /api/logs?type=execution authenticated...');
    const res2b = await makeRequest(`/api/logs?type=execution&token=${TEST_TOKEN}`);
    if (res2b.statusCode === 200) {
      console.log('✅ Test 2b Passed: Authenticated request to execution logs succeeded (200 OK)');
    } else {
      console.error(`❌ Test 2b Failed: Expected status 200, got ${res2b.statusCode}`);
      failed = true;
    }

    // Test 3: Valid logs type 'audit' (unauthenticated) -> should fail (401)
    console.log('\n[Test 3] Fetching /api/logs?type=audit unauthenticated...');
    const res3 = await makeRequest('/api/logs?type=audit');
    if (res3.statusCode === 401) {
      console.log('✅ Test 3 Passed: Unauthenticated request to audit logs was blocked with 401 Unauthorized');
    } else {
      console.error(`❌ Test 3 Failed: Expected status 401, got ${res3.statusCode}`);
      failed = true;
    }

    // Test 3b: Valid logs type 'audit' (authenticated) -> should succeed (200)
    console.log('\n[Test 3b] Fetching /api/logs?type=audit authenticated...');
    const res3b = await makeRequest(`/api/logs?type=audit&token=${TEST_TOKEN}`);
    if (res3b.statusCode === 200) {
      console.log('✅ Test 3b Passed: Authenticated request to audit logs succeeded (200 OK)');
    } else {
      console.error(`❌ Test 3b Failed: Expected status 200, got ${res3b.statusCode}`);
      failed = true;
    }

    // Test 4: Invalid logs type 'invalid_type' -> should fail with 400 Bad Request if authenticated
    console.log('\n[Test 4] Fetching /api/logs?type=invalid_type with valid auth...');
    const res4 = await makeRequest(`/api/logs?type=invalid_type&token=${TEST_TOKEN}`);
    if (res4.statusCode === 400) {
      const body = JSON.parse(res4.body);
      if (body.success === false && body.error.includes('Invalid log type')) {
        console.log('✅ Test 4 Passed: Properly blocked invalid type with 400 Bad Request and error message');
      } else {
        console.error('❌ Test 4 Failed: Expected specific error payload, got:', body);
        failed = true;
      }
    } else {
      console.error(`❌ Test 4 Failed: Expected status 400, got ${res4.statusCode}`);
      failed = true;
    }

    // Test 5: Malicious traversal parameter '../etc/passwd' -> should fail with 400 Bad Request if authenticated
    console.log('\n[Test 5] Fetching /api/logs?type=../etc/passwd with valid auth...');
    const res5 = await makeRequest(`/api/logs?type=../etc/passwd&token=${TEST_TOKEN}`);
    if (res5.statusCode === 400) {
      const body = JSON.parse(res5.body);
      if (body.success === false && body.error.includes('Invalid log type')) {
        console.log('✅ Test 5 Passed: Properly blocked path traversal input with 400 Bad Request');
      } else {
        console.error('❌ Test 5 Failed: Expected specific error payload, got:', body);
        failed = true;
      }
    } else {
      console.error(`❌ Test 5 Failed: Expected status 400, got ${res5.statusCode}`);
      failed = true;
    }

    // Test 6: Fetching valid project ID state -> should succeed (200)
    console.log('\n[Test 6] Fetching state with valid project ID /api/state/test_valid_proj_123...');
    const res6 = await makeRequest('/api/state/test_valid_proj_123');
    if (res6.statusCode === 200) {
      console.log('✅ Test 6 Passed: Successfully fetched state for valid project ID (200 OK)');
    } else {
      console.error(`❌ Test 6 Failed: Expected status 200, got ${res6.statusCode}`);
      failed = true;
    }

    // Test 7: Malicious project ID with path traversal -> should fail with 400 Bad Request
    console.log('\n[Test 7] Fetching state with malicious path-traversal project ID /api/state?projectId=../../etc/passwd...');
    const res7 = await makeRequest('/api/state?projectId=../../etc/passwd');
    if (res7.statusCode === 400) {
      const body = JSON.parse(res7.body);
      if (body.success === false && body.error.includes('Invalid Project ID format')) {
        console.log('✅ Test 7 Passed: Properly blocked path traversal project ID with 400 Bad Request');
      } else {
        console.error('❌ Test 7 Failed: Expected invalid project ID format error, got:', body);
        failed = true;
      }
    } else {
      console.error(`❌ Test 7 Failed: Expected status 400, got ${res7.statusCode}`);
      failed = true;
    }

    // Test 8: Malicious project ID with special characters -> should fail with 400 Bad Request
    console.log('\n[Test 8] Fetching state with invalid special characters project ID /api/state/project-illegal$...');
    const res8 = await makeRequest('/api/state/project-illegal$');
    if (res8.statusCode === 400) {
      const body = JSON.parse(res8.body);
      if (body.success === false && body.error.includes('Invalid Project ID format')) {
        console.log('✅ Test 8 Passed: Properly blocked illegal characters in project ID with 400 Bad Request');
      } else {
        console.error('❌ Test 8 Failed: Expected invalid project ID format error, got:', body);
        failed = true;
      }
    } else {
      console.error(`❌ Test 8 Failed: Expected status 400, got ${res8.statusCode}`);
      failed = true;
    }

    // Test 9: POST /api/validate -> should succeed with 200 and return validation results
    console.log('\n[Test 9] Triggering validation via POST /api/validate...');
    const res9 = await makePostRequest('/api/validate');
    if (res9.statusCode === 200) {
      const body = JSON.parse(res9.body);
      if (body.success === true && body.passed === true) {
        console.log('✅ Test 9 Passed: Successfully validated ecosystem via async walkDir (200 OK)');
      } else {
        console.error('❌ Test 9 Failed: Expected success and passed, got:', body);
        failed = true;
      }
    } else {
      console.error(`❌ Test 9 Failed: Expected status 200, got ${res9.statusCode}`);
      failed = true;
    }

  } catch (err) {
    console.error('An error occurred during test execution:', err);
    failed = true;
  } finally {
    console.log('\nTerminating server process...');
    serverProc.kill();
    killPortProcess();
  }

  if (failed) {
    console.error('\n❌ Security validation tests FAILED!');
    process.exit(1);
  } else {
    console.log('\n🏆 All security validation tests PASSED successfully!');
    process.exit(0);
  }
}

runTests();
