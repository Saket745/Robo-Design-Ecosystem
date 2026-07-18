const test = require('node:test');
const assert = require('node:assert');
const Validator = require('./validator');

test('Validator.validateSchema unit tests', async (t) => {
  const validator = new Validator();

  await t.test('should validate data using schema file path', () => {
    const validData = {
      name: 'TestAgent',
      domain: 'robotics',
      capabilities: ['movement', 'vision'],
      constraints: {
        isolated_execution: true,
        domain_restriction: true,
        unrestricted_filesystem_access: false,
        unrestricted_network_access: false
      },
      communication_protocol: 'gRPC'
    };

    const res = validator.validateSchema(validData, 'agent_schema.json');
    assert.strictEqual(res.pass, true);
    assert.strictEqual(res.errors.length, 0);
  });

  await t.test('should return error when schema file is not found', () => {
    const res = validator.validateSchema({}, 'non_existent_schema.json');
    assert.strictEqual(res.pass, false);
    assert.ok(res.errors.length > 0);
    // Use resilient pattern matching matching both original and updated validator versions
    assert.match(res.errors[0], /Schema file .*not found.*/i);
  });

  await t.test('should validate required properties in object using a file schema', () => {
    // Missing both name and age
    const res1 = validator.validateSchema({}, 'test_simple_schema.json');
    assert.strictEqual(res1.pass, false);
    assert.deepStrictEqual(res1.errors, [
      "Property 'name' is required",
      "Property 'age' is required"
    ]);

    // Missing age only
    const res2 = validator.validateSchema({ name: 'Robo' }, 'test_simple_schema.json');
    assert.strictEqual(res2.pass, false);
    assert.deepStrictEqual(res2.errors, [
      "Property 'age' is required"
    ]);

    // Has both
    const res3 = validator.validateSchema({ name: 'Robo', age: 10 }, 'test_simple_schema.json');
    assert.strictEqual(res3.pass, true);
  });

  await t.test('should handle nested object validation and format path correctly', () => {
    const invalidData = {
      user: {
        id: 'not-an-integer', // invalid type
        profile: {} // missing email
      }
    };

    const res = validator.validateSchema(invalidData, 'test_nested_schema.json');
    assert.strictEqual(res.pass, false);
    assert.deepStrictEqual(res.errors, [
      "Property 'user.id' must be of type 'integer', got 'string'",
      "Property 'user.profile.email' is required"
    ]);
  });

  await t.test('should validate array type and array items', () => {
    // Valid array of strings
    const res1 = validator.validateSchema({ tags: ['a', 'b', 'c'] }, 'test_array_schema.json');
    assert.strictEqual(res1.pass, true);

    // Invalid: not an array
    const res2 = validator.validateSchema({ tags: 'not-an-array' }, 'test_array_schema.json');
    assert.strictEqual(res2.pass, false);
    assert.deepStrictEqual(res2.errors, [
      "Property 'tags' must be of type 'array', got 'string'"
    ]);

    // Invalid item type
    const res3 = validator.validateSchema({ tags: ['a', 123, 'c'] }, 'test_array_schema.json');
    assert.strictEqual(res3.pass, false);
    assert.deepStrictEqual(res3.errors, [
      "Property 'tags[1]' must be of type 'string', got 'number'"
    ]);
  });

  await t.test('should validate primitive type: integer', () => {
    assert.strictEqual(validator.validateSchema({ my_int: 42 }, 'test_primitives_schema.json').pass, true);
    assert.strictEqual(validator.validateSchema({ my_int: 0 }, 'test_primitives_schema.json').pass, true);
    assert.strictEqual(validator.validateSchema({ my_int: -5 }, 'test_primitives_schema.json').pass, true);

    // float is not integer
    const resFloat = validator.validateSchema({ my_int: 4.2 }, 'test_primitives_schema.json');
    assert.strictEqual(resFloat.pass, false);
    assert.deepStrictEqual(resFloat.errors, ["Property 'my_int' must be of type 'integer', got 'number'"]);

    // string is not integer
    const resString = validator.validateSchema({ my_int: '42' }, 'test_primitives_schema.json');
    assert.strictEqual(resString.pass, false);
    assert.deepStrictEqual(resString.errors, ["Property 'my_int' must be of type 'integer', got 'string'"]);
  });

  await t.test('should validate primitive type: number', () => {
    assert.strictEqual(validator.validateSchema({ my_num: 4.2 }, 'test_primitives_schema.json').pass, true);
    assert.strictEqual(validator.validateSchema({ my_num: 42 }, 'test_primitives_schema.json').pass, true);

    // NaN is not number
    const resNaN = validator.validateSchema({ my_num: NaN }, 'test_primitives_schema.json');
    assert.strictEqual(resNaN.pass, false);
    assert.deepStrictEqual(resNaN.errors, ["Property 'my_num' must be of type 'number', got 'number'"]);

    // string is not number
    const resString = validator.validateSchema({ my_num: '4.2' }, 'test_primitives_schema.json');
    assert.strictEqual(resString.pass, false);
    assert.deepStrictEqual(resString.errors, ["Property 'my_num' must be of type 'number', got 'string'"]);
  });

  await t.test('should validate primitive type: boolean', () => {
    assert.strictEqual(validator.validateSchema({ my_bool: true }, 'test_primitives_schema.json').pass, true);
    assert.strictEqual(validator.validateSchema({ my_bool: false }, 'test_primitives_schema.json').pass, true);

    // string is not boolean
    const resString = validator.validateSchema({ my_bool: 'true' }, 'test_primitives_schema.json');
    assert.strictEqual(resString.pass, false);
    assert.deepStrictEqual(resString.errors, ["Property 'my_bool' must be of type 'boolean', got 'string'"]);
  });

  await t.test('should validate string with pattern regex match', () => {
    // Valid format
    assert.strictEqual(validator.validateSchema('123-456-7890', 'test_pattern_schema.json').pass, true);

    // Invalid format
    const res1 = validator.validateSchema('123-45-67890', 'test_pattern_schema.json');
    assert.strictEqual(res1.pass, false);
    assert.deepStrictEqual(res1.errors, [
      "Property '' value '123-45-67890' does not match pattern '^\\d{3}-\\d{3}-\\d{4}$'"
    ]);

    // Non-string type
    const res2 = validator.validateSchema(1234567890, 'test_pattern_schema.json');
    assert.strictEqual(res2.pass, false);
    assert.deepStrictEqual(res2.errors, [
      "Property '' must be of type 'string', got 'number'"
    ]);
  });
});
