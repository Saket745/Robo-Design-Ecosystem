const test = require('node:test');
const assert = require('node:assert');
const EventEmitter = require('events');
const { parseJsonBody, parseCookies, isAuthenticated, SYSTEM_TOKEN } = require('./server');

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
