const { test, describe } = require('node:test');
const assert = require('node:assert');
const { parseYAML } = require('./yaml_parser');

describe('yaml_parser unit tests', () => {
  test('should parse empty or null input correctly', () => {
    assert.deepStrictEqual(parseYAML(''), {});
    assert.deepStrictEqual(parseYAML(null), {});
    assert.deepStrictEqual(parseYAML(undefined), {});
  });

  test('should strip out comments', () => {
    const yaml = `
# This is a comment
name: test # inline comment
age: 10
    `;
    assert.deepStrictEqual(parseYAML(yaml), { name: 'test', age: 10 });
  });

  test('should parse simple key-value pairs with type conversions', () => {
    const yaml = `
string: "hello"
single_quote: 'world'
boolean_true: true
boolean_false: false
number_int: 42
number_float: 3.14
    `;
    assert.deepStrictEqual(parseYAML(yaml), {
      string: 'hello',
      single_quote: 'world',
      boolean_true: true,
      boolean_false: false,
      number_int: 42,
      number_float: 3.14
    });
  });

  test('should parse inline arrays', () => {
    const yaml = `
list: [a, b, "c", 'd']
    `;
    assert.deepStrictEqual(parseYAML(yaml), {
      list: ['a', 'b', 'c', 'd']
    });
  });

  test('should parse block arrays', () => {
    const yaml = `
items:
  - first
  - second
    `;
    assert.deepStrictEqual(parseYAML(yaml), {
      items: ['first', 'second']
    });
  });

  test('should parse array of objects', () => {
    const yaml = `
tasks:
  - id: t1
    name: task 1
    retries: 3
    enabled: true
  - id: t2
    name: task 2
    tags: [foo, bar]
    `;
    assert.deepStrictEqual(parseYAML(yaml), {
      tasks: [
        { id: 't1', name: 'task 1', retries: 3, enabled: true },
        { id: 't2', name: 'task 2', tags: ['foo', 'bar'] }
      ]
    });
  });

  test('should parse nested objects', () => {
    const yaml = `
parent:
  child:
    grandchild: values
  sibling: true
    `;
    assert.deepStrictEqual(parseYAML(yaml), {
      parent: {
        child: {
          grandchild: 'values'
        },
        sibling: true
      }
    });
  });
});
