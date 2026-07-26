const test = require('node:test');
const assert = require('node:assert');
const EventEmitter = require('events');
const { parseJsonBody } = require('./server');

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
