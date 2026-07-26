const test = require('node:test');
const assert = require('node:assert');
const EventEmitter = require('events');
const { parseJsonBody, getTestDataForPhase, parseCookies, isAuthenticated, SYSTEM_TOKEN } = require("./server");

class MockRequest extends EventEmitter {}

test('parseJsonBody unit tests', async (t) => {

  await t.test('should resolve with parsed JSON object on valid JSON', async () => {
    const req = new MockRequest();
    const promise = parseJsonBody(req);

    req.emit('data', Buffer.from('{"name"'));
    req.emit('data', Buffer.from(':"Robo","age":5}'));
    req.emit('end');

    const result = await promise;
    assert.deepStrictEqual(result, { name: 'Robo', age: 5 });
  });

  await t.test('should resolve with empty object when body is empty', async () => {
    const req = new MockRequest();
    const promise = parseJsonBody(req);

    req.emit('end');

    const result = await promise;
    assert.deepStrictEqual(result, {});
  });

  await t.test('should resolve with empty object when body consists of empty chunks', async () => {
    const req = new MockRequest();
    const promise = parseJsonBody(req);

    req.emit('data', '');
    req.emit('end');

    const result = await promise;
    assert.deepStrictEqual(result, {});
  });

  await t.test('should reject with SyntaxError on invalid JSON', async () => {
    const req = new MockRequest();
    const promise = parseJsonBody(req);

    req.emit('data', '{"invalid_json":');
    req.emit('end');

    await assert.rejects(promise, SyntaxError);
  });

  await t.test('should reject with "Payload too large" and 413 error code if payload exceeds 1MB limit', async () => {
    const req = new MockRequest();
    const promise = parseJsonBody(req);

    // Create a chunk larger than 1MB
    const bigChunk = Buffer.alloc(1024 * 1024 + 1);
    req.emit('data', bigChunk);

    await assert.rejects(promise, (err) => {
      assert.strictEqual(err.message, 'Payload too large');
      assert.strictEqual(err.statusCode, 413);
      return true;
    });
  });

  await t.test('should handle chunk accumulation exceeding 1MB limit across multiple packets', async () => {
    const req = new MockRequest();
    const promise = parseJsonBody(req);

    // Emit two half-megabyte chunks, then another chunk
    const halfMB = Buffer.alloc(512 * 1024);
    req.emit('data', halfMB);
    req.emit('data', halfMB);
    req.emit('data', Buffer.from('a')); // Exceeds 1MB

    await assert.rejects(promise, (err) => {
      assert.strictEqual(err.message, 'Payload too large');
      assert.strictEqual(err.statusCode, 413);
      return true;
    });
  });
});

test('getTestDataForPhase unit tests', async (t) => {
  await t.test('should return baseline trace_id for any phase', () => {
    const result = getTestDataForPhase('Requirements');
    assert.deepStrictEqual(result, { trace_id: 'pipeline_run' });
  });

  await t.test('should return CAD specific test data with defaults', () => {
    const result = getTestDataForPhase('CAD', {});
    assert.strictEqual(result.dimensions, 'Legged');
    assert.strictEqual(result.weight_kg, 5.2);
    assert.strictEqual(result.trace_id, 'pipeline_run');
  });

  await t.test('should return CAD specific test data customized from state', () => {
    const result = getTestDataForPhase('CAD', { mobility: 'Wheeled' });
    assert.strictEqual(result.dimensions, 'Wheeled');
    assert.strictEqual(result.weight_kg, 5.2);
  });

  await t.test('should return PCB specific test data with defaults', () => {
    const result = getTestDataForPhase('PCB', {});
    assert.strictEqual(result.voltage, 12);
    assert.strictEqual(result.mcu, 'ESP32');
    assert.strictEqual(result.trace_id, 'pipeline_run');
  });

  await t.test('should return PCB specific test data customized from state', () => {
    const result = getTestDataForPhase('PCB', { compute_system: 'RaspberryPi' });
    assert.strictEqual(result.voltage, 12);
    assert.strictEqual(result.mcu, 'RaspberryPi');
  });

  await t.test('should return Validation specific test data', () => {
    const result = getTestDataForPhase('Validation');
    assert.deepStrictEqual(result, {
      trace_id: 'pipeline_run',
      motor_runaway_protection: true,
      max_cell_voltage: 4.2,
      min_cell_voltage: 3.1,
      max_temperature_c: 65,
      emergency_stop_implemented: true
    });
  });
});

test('Cookie parsing and authentication unit tests', async (t) => {
  await t.test('parseCookies should correctly parse cookies', () => {
    const header = 'session_token=abc123xyz; other_cookie=val';
    const result = parseCookies(header);
    assert.deepStrictEqual(result, {
      session_token: 'abc123xyz',
      other_cookie: 'val'
    });
  });

  await t.test('parseCookies should handle empty or missing cookie header', () => {
    assert.deepStrictEqual(parseCookies(null), {});
    assert.deepStrictEqual(parseCookies(''), {});
  });

  await t.test('isAuthenticated should validate valid Bearer token', () => {
    const req = {
      headers: {
        authorization: `Bearer ${SYSTEM_TOKEN}`
      }
    };
    const parsedUrl = { query: {} };
    assert.strictEqual(isAuthenticated(req, parsedUrl), true);
  });

  await t.test('isAuthenticated should reject valid session cookie without headers/query', () => {
    const req = {
      headers: {
        cookie: `session_token=${SYSTEM_TOKEN}`
      }
    };
    const parsedUrl = { query: {} };
    assert.strictEqual(isAuthenticated(req, parsedUrl), false);
  });

  await t.test('isAuthenticated should validate valid X-API-Key header', () => {
    const req = {
      headers: {
        'x-api-key': SYSTEM_TOKEN
      }
    };
    const parsedUrl = { query: {} };
    assert.strictEqual(isAuthenticated(req, parsedUrl), true);
  });

  await t.test('isAuthenticated should validate valid query token', () => {
    const req = { headers: {} };
    const parsedUrl = {
      query: { token: SYSTEM_TOKEN }
    };
    assert.strictEqual(isAuthenticated(req, parsedUrl), true);
  });

  await t.test('isAuthenticated should return false for invalid token', () => {
    const req = {
      headers: {
        authorization: 'Bearer wrong_token'
      }
    };
    const parsedUrl = { query: {} };
    assert.strictEqual(isAuthenticated(req, parsedUrl), false);
  });

  await t.test('isAuthenticated should return false for missing credentials', () => {
    const req = { headers: {} };
    const parsedUrl = { query: {} };
    assert.strictEqual(isAuthenticated(req, parsedUrl), false);
  });
});
