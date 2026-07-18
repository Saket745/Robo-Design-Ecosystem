const { spawn } = require('child_process');
const http = require('http');

function checkHeader(origin, allowedOriginsEnv) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    if (allowedOriginsEnv) {
      env.ALLOWED_ORIGINS = allowedOriginsEnv;
    } else {
      delete env.ALLOWED_ORIGINS;
    }

    const serverProcess = spawn('node', ['scripts/server.js'], { env });

    let resolved = false;

    // Wait 1.5 seconds for the server to spin up
    setTimeout(() => {
      if (resolved) return;
      resolved = true;

      const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/status',
        method: 'GET',
        headers: origin ? { 'Origin': origin } : {}
      };

      const req = http.request(options, (res) => {
        const corsHeader = res.headers['access-control-allow-origin'];
        serverProcess.kill('SIGTERM');
        resolve(corsHeader);
      });

      req.on('error', (err) => {
        serverProcess.kill('SIGTERM');
        reject(err);
      });

      req.end();
    }, 1500);

    serverProcess.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });
  });
}

async function runTests() {
  console.log('--- Starting CORS Security Tests ---');
  let exitCode = 0;

  try {
    // Kill any existing processes on 3000 just in case
    try {
      const execSync = require('child_process').execSync;
      execSync('kill $(lsof -t -i :3000) 2>/dev/null || true');
    } catch (_) {}

    // Test 1: Default Allowed Origin http://localhost:3000
    console.log('Test 1: Request with http://localhost:3000 Origin');
    const res1 = await checkHeader('http://localhost:3000');
    console.log(`Received: ${res1}`);
    if (res1 === 'http://localhost:3000') {
      console.log('✅ PASS');
    } else {
      console.error('❌ FAIL');
      exitCode = 1;
    }

    // Test 2: Default Allowed Origin http://127.0.0.1:3000
    console.log('\nTest 2: Request with http://127.0.0.1:3000 Origin');
    const res2 = await checkHeader('http://127.0.0.1:3000');
    console.log(`Received: ${res2}`);
    if (res2 === 'http://127.0.0.1:3000') {
      console.log('✅ PASS');
    } else {
      console.error('❌ FAIL');
      exitCode = 1;
    }

    // Test 3: Untrusted / Malicious Origin
    console.log('\nTest 3: Request with http://evil.com Origin (should fallback to default secure origin)');
    const res3 = await checkHeader('http://evil.com');
    console.log(`Received: ${res3}`);
    if (res3 === 'http://localhost:3000') {
      console.log('✅ PASS');
    } else {
      console.error('❌ FAIL');
      exitCode = 1;
    }

    // Test 4: No Origin header
    console.log('\nTest 4: Request with NO Origin header (should fallback to default secure origin)');
    const res4 = await checkHeader(null);
    console.log(`Received: ${res4}`);
    if (res4 === 'http://localhost:3000') {
      console.log('✅ PASS');
    } else {
      console.error('❌ FAIL');
      exitCode = 1;
    }

    // Test 5: Configured ALLOWED_ORIGINS via env
    console.log('\nTest 5: Request with ALLOWED_ORIGINS=https://my-secure-dashboard.com');
    const res5 = await checkHeader('https://my-secure-dashboard.com', 'https://my-secure-dashboard.com');
    console.log(`Received: ${res5}`);
    if (res5 === 'https://my-secure-dashboard.com') {
      console.log('✅ PASS');
    } else {
      console.error('❌ FAIL');
      exitCode = 1;
    }

    // Test 6: Comma-separated ALLOWED_ORIGINS via env
    console.log('\nTest 6: Request with ALLOWED_ORIGINS=https://my-secure-dashboard.com,https://another-secure-app.com');
    const res6 = await checkHeader('https://another-secure-app.com', 'https://my-secure-dashboard.com,https://another-secure-app.com');
    console.log(`Received: ${res6}`);
    if (res6 === 'https://another-secure-app.com') {
      console.log('✅ PASS');
    } else {
      console.error('❌ FAIL');
      exitCode = 1;
    }

  } catch (err) {
    console.error('Error running CORS tests:', err);
    exitCode = 1;
  }

  console.log('\n--- CORS Security Tests Finished ---');
  process.exit(exitCode);
}

runTests();
