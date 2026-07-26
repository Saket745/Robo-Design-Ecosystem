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

// Function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
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
    stdio: 'inherit',
    detached: false
  });

  // Give server 1.5 seconds to start up
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let failed = false;

  try {
    // Test 1: Default logs endpoint (no type parameter) -> should default to 'execution' and succeed (200)
    console.log('\n[Test 1] Fetching default /api/logs...');
    const res1 = await makeRequest('/api/logs');
    if (res1.statusCode === 200) {
      console.log('✅ Test 1 Passed: Successfully fetched logs (200 OK)');
    } else {
      console.error(`❌ Test 1 Failed: Expected status 200, got ${res1.statusCode}`);
      failed = true;
    }

    // Test 2: Valid logs type 'execution' -> should succeed (200)
    console.log('\n[Test 2] Fetching /api/logs?type=execution...');
    const res2 = await makeRequest('/api/logs?type=execution');
    if (res2.statusCode === 200) {
      console.log('✅ Test 2 Passed: Successfully fetched execution logs (200 OK)');
    } else {
      console.error(`❌ Test 2 Failed: Expected status 200, got ${res2.statusCode}`);
      failed = true;
    }

    // Test 3: Valid logs type 'audit' -> should succeed (200)
    console.log('\n[Test 3] Fetching /api/logs?type=audit...');
    const res3 = await makeRequest('/api/logs?type=audit');
    if (res3.statusCode === 200) {
      console.log('✅ Test 3 Passed: Successfully fetched audit logs (200 OK)');
    } else {
      console.error(`❌ Test 3 Failed: Expected status 200, got ${res3.statusCode}`);
      failed = true;
    }

    // Test 4: Invalid logs type 'invalid_type' -> should fail with 400 Bad Request
    console.log('\n[Test 4] Fetching /api/logs?type=invalid_type...');
    const res4 = await makeRequest('/api/logs?type=invalid_type');
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

    // Test 5: Malicious traversal parameter '../etc/passwd' -> should fail with 400 Bad Request
    console.log('\n[Test 5] Fetching /api/logs?type=../etc/passwd...');
    const res5 = await makeRequest('/api/logs?type=../etc/passwd');
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
