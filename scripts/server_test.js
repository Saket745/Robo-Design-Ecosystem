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
});
