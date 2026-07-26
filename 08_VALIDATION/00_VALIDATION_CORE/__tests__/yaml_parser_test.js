const test = require('node:test');
const assert = require('node:assert');
const { parseYAML } = require('../yaml_parser');

test('YAML Parser - empty or falsy content', () => {
  assert.deepStrictEqual(parseYAML(''), {});
  assert.deepStrictEqual(parseYAML(null), {});
  assert.deepStrictEqual(parseYAML(undefined), {});
});

test('YAML Parser - simple key-value pairs', () => {
  const yaml = `
name: Antigravity Robot
version: 1.0.0
enabled: true
retry: false
count: 42
pi: 3.14
  `;
  const result = parseYAML(yaml);
  assert.deepStrictEqual(result, {
    name: 'Antigravity Robot',
    version: '1.0.0',
    enabled: true,
    retry: false,
    count: 42,
    pi: 3.14
  });
});

test('YAML Parser - comments and empty lines', () => {
  const yaml = `
# This is a global comment
name: Robo # Inline comment
# Another comment
description: "Platform Ecosystem" # comment
  `;
  const result = parseYAML(yaml);
  assert.deepStrictEqual(result, {
    name: 'Robo',
    description: 'Platform Ecosystem'
  });
});

test('YAML Parser - inline arrays', () => {
  const yaml = `
tags: [robot, quadruped, "high-speed", 'bionic']
  `;
  const result = parseYAML(yaml);
  assert.deepStrictEqual(result, {
    tags: ['robot', 'quadruped', 'high-speed', 'bionic']
  });
});

test('YAML Parser - simple arrays', () => {
  const yaml = `
items:
  - first
  - "second"
  - 'third'
  `;
  const result = parseYAML(yaml);
  assert.deepStrictEqual(result, {
    items: ['first', 'second', 'third']
  });
});

test('YAML Parser - nested objects', () => {
  const yaml = `
metadata:
  name: quadruped
  spec:
    cores: 4
    type: bionic
  active: true
  `;
  const result = parseYAML(yaml);
  assert.deepStrictEqual(result, {
    metadata: {
      name: 'quadruped',
      spec: {
        cores: 4,
        type: 'bionic'
      },
      active: true
    }
  });
});

test('YAML Parser - list of objects with inline and sub-properties', () => {
  const yaml = `
skills:
  - id: sensor_fusion
    name: "Sensor Fusion"
    enabled: true
    type: bionic
  - id: motor_control
    name: Motor Control
    enabled: false
  `;
  const result = parseYAML(yaml);
  assert.deepStrictEqual(result, {
    skills: [
      {
        id: 'sensor_fusion',
        name: 'Sensor Fusion',
        enabled: true,
        type: 'bionic'
      },
      {
        id: 'motor_control',
        name: 'Motor Control',
        enabled: false
      }
    ]
  });
});

test('YAML Parser - list of objects with nested structure', () => {
  const yaml = `
agents:
  - name: planner
    capabilities: [plan, coordinate]
  - name: execution
    capabilities: [run, validation]
  `;
  const result = parseYAML(yaml);
  assert.deepStrictEqual(result, {
    agents: [
      {
        name: 'planner',
        capabilities: ['plan', 'coordinate']
      },
      {
        name: 'execution',
        capabilities: ['run', 'validation']
      }
    ]
  });
});
