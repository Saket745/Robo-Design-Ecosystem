const test = require('node:test');
const assert = require('node:assert');
const demo = require('./demo');

test('demo.sleep unit tests', async (t) => {
  await t.test('should export a sleep function', () => {
    assert.strictEqual(typeof demo.sleep, 'function');
  });

  await t.test('should resolve with undefined when called', async () => {
    const result = await demo.sleep(10);
    assert.strictEqual(result, undefined);
  });

  await t.test('should wait at least the requested amount of milliseconds', async () => {
    const start = Date.now();
    const duration = 50;
    await demo.sleep(duration);
    const elapsed = Date.now() - start;
    console.log(`Measured sleep(50): elapsed = ${elapsed}ms`);
    // Allow a small 5ms margin for scheduler/timer inaccuracy
    assert.ok(elapsed >= duration - 5, `Expected elapsed (${elapsed}ms) to be at least ${duration - 5}ms`);
  });

  await t.test('should handle extremely short duration (0ms) correctly', async () => {
    const start = Date.now();
    await demo.sleep(0);
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 0);
  });

  await t.test('should resolve asynchronously and not block the event loop', async () => {
    const order = [];
    const p = demo.sleep(10).then(() => {
      order.push('sleep resolved');
    });
    order.push('sleep called');
    await p;
    assert.deepStrictEqual(order, ['sleep called', 'sleep resolved']);
  });
});
