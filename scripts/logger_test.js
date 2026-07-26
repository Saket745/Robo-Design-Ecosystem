const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { sanitize, logEvent } = require('./logger');

test('logger.sanitize unit tests', async (t) => {
  await t.test('should return empty, null, or undefined as-is', () => {
    assert.strictEqual(sanitize(null), null);
    assert.strictEqual(sanitize(undefined), undefined);
    assert.strictEqual(sanitize(''), '');
  });

  await t.test('should leave normal non-sensitive objects unchanged', () => {
    const input = {
      username: 'john_doe',
      email: 'john@example.com',
      age: 30,
      isActive: true,
      tags: ['user', 'admin']
    };
    const expected = { ...input };
    assert.deepStrictEqual(sanitize(input), expected);
  });

  await t.test('should redact basic credential fields (exact match, case-insensitive)', () => {
    const cases = [
      { key: 'password', val: 'supersecret' },
      { key: 'token', val: 'token123' },
      { key: 'key', val: 'api-key-abc' },
      { key: 'secret', val: 'my-secret' },
      { key: 'auth', val: 'Bearer xyz' },
      { key: 'private', val: 'rsa-private-data' }
    ];

    for (const c of cases) {
      // Test exact key lowercase
      const objLower = { [c.key]: c.val };
      assert.deepStrictEqual(sanitize(objLower), { [c.key]: '[REDACTED]' });

      // Test exact key uppercase / mixed case
      const mixedKey = c.key.toUpperCase();
      const objUpper = { [mixedKey]: c.val };
      assert.deepStrictEqual(sanitize(objUpper), { [mixedKey]: '[REDACTED]' });
    }
  });

  await t.test('should redact credential fields with suffixes or prefixes', () => {
    const inputs = {
      apiKey: 'key_123',
      secret_key: 'key_456',
      auth_token: 'tok_789',
      privateKey: 'priv_abc',
      somepassword: 'pwd_xyz',
      custom_secret: 'sec_123'
    };
    const expected = {
      apiKey: '[REDACTED]',
      secret_key: '[REDACTED]',
      auth_token: '[REDACTED]',
      privateKey: '[REDACTED]',
      somepassword: '[REDACTED]',
      custom_secret: '[REDACTED]'
    };
    assert.deepStrictEqual(sanitize(inputs), expected);
  });

  await t.test('should handle nested structures containing sensitive fields', () => {
    const input = {
      service: 'payment-gateway',
      config: {
        host: 'api.payments.internal',
        private_key: 'super-private-key-data',
        retry: {
          attempts: 3,
          password: 'db-password'
        }
      }
    };
    const expected = {
      service: 'payment-gateway',
      config: {
        host: 'api.payments.internal',
        private_key: '[REDACTED]',
        retry: {
          attempts: 3,
          password: '[REDACTED]'
        }
      }
    };
    assert.deepStrictEqual(sanitize(input), expected);
  });

  await t.test('should handle arrays of objects with sensitive fields', () => {
    const input = [
      { name: 'service1', token: 'tok1' },
      { name: 'service2', normalField: 'ok' },
      { name: 'service3', secret: 'sec3' }
    ];
    const expected = [
      { name: 'service1', token: '[REDACTED]' },
      { name: 'service2', normalField: 'ok' },
      { name: 'service3', secret: '[REDACTED]' }
    ];
    assert.deepStrictEqual(sanitize(input), expected);
  });

  await t.test('should handle sensitive fields containing escaped characters or quotes', () => {
    const input = {
      password: 'hello\\"world',
      secret: 'my\'single\'quote\'secret',
      token: 'some\\\\escaped\\\\backslash'
    };
    const expected = {
      password: '[REDACTED]',
      secret: "[REDACTED]'single'quote'secret",
      token: '[REDACTED]'
    };
    assert.deepStrictEqual(sanitize(input), expected);
  });
});

test('logger.logEvent with payload sanitization', async (t) => {
  // Save original functions to restore later
  const originalAppendFileSync = fs.appendFileSync;
  const originalMkdirSync = fs.mkdirSync;
  const originalExistsSync = fs.existsSync;

  let appendCalls = [];

  t.beforeEach(() => {
    appendCalls = [];
    fs.appendFileSync = (filePath, content, encoding) => {
      appendCalls.push({ filePath, content, encoding });
    };
    fs.mkdirSync = () => {};
    fs.existsSync = () => true;
  });

  t.afterEach(() => {
    fs.appendFileSync = originalAppendFileSync;
    fs.mkdirSync = originalMkdirSync;
    fs.existsSync = originalExistsSync;
  });

  await t.test('should sanitize sensitive data within the logEvent payload', () => {
    const logResult = logEvent({
      event: 'user_login',
      trace_id: 'test-trace-123',
      severity: 'info',
      agent: 'test_agent',
      message: 'User logged in',
      payload: {
        username: 'alice',
        password: 'password123',
        nested: {
          token: 'token123'
        }
      }
    });

    // Check returned log object
    assert.strictEqual(logResult.payload.username, 'alice');
    assert.strictEqual(logResult.payload.password, '[REDACTED]');
    assert.strictEqual(logResult.payload.nested.token, '[REDACTED]');

    // Check that appended strings were sanitized as well
    assert.ok(appendCalls.length > 0);
    for (const call of appendCalls) {
      assert.ok(!call.content.includes('password123'));
      assert.ok(!call.content.includes('token123'));
      assert.ok(call.content.includes('[REDACTED]'));
    }
  });
});
