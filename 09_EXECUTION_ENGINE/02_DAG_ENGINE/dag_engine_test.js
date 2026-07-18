const assert = require('assert').strict;
const DAGEngine = require('./dag_engine');

function runTests() {
  console.log('🧪 Starting DAGEngine.addNode Unit Tests...\n');

  // Helper to run a test block and log status
  const test = (description, fn) => {
    try {
      fn();
      console.log(`✅ PASS: ${description}`);
    } catch (err) {
      console.error(`❌ FAIL: ${description}`);
      console.error(err);
      process.exit(1);
    }
  };

  test('should initialize an empty graph', () => {
    const engine = new DAGEngine();
    assert.ok(engine.nodes instanceof Map);
    assert.equal(engine.nodes.size, 0);
  });

  test('should add a single node with no dependencies', () => {
    const engine = new DAGEngine();
    engine.addNode('task_a');

    assert.equal(engine.nodes.size, 1);
    assert.ok(engine.nodes.has('task_a'));
    assert.ok(engine.nodes.get('task_a') instanceof Set);
    assert.equal(engine.nodes.get('task_a').size, 0);
  });

  test('should use empty array as default dependencies if not provided', () => {
    const engine = new DAGEngine();
    // Test that leaving dependencies omitted defaults to an empty array
    engine.addNode('task_a');

    assert.ok(engine.nodes.has('task_a'));
    assert.equal(engine.nodes.get('task_a').size, 0);
  });

  test('should add a node with dependencies and implicitly create dependency nodes', () => {
    const engine = new DAGEngine();
    engine.addNode('task_b', ['task_a', 'task_c']);

    // Nodes set should now contain task_b, plus implicitly task_a and task_c
    assert.equal(engine.nodes.size, 3);
    assert.ok(engine.nodes.has('task_b'));
    assert.ok(engine.nodes.has('task_a'));
    assert.ok(engine.nodes.has('task_c'));

    // task_b should depend on task_a and task_c
    const bDeps = engine.nodes.get('task_b');
    assert.equal(bDeps.size, 2);
    assert.ok(bDeps.has('task_a'));
    assert.ok(bDeps.has('task_c'));

    // Implicitly created nodes should have empty dependencies
    assert.equal(engine.nodes.get('task_a').size, 0);
    assert.equal(engine.nodes.get('task_c').size, 0);
  });

  test('should preserve existing nodes and their dependencies when referenced as dependencies', () => {
    const engine = new DAGEngine();

    // First setup node A with dependencies
    engine.addNode('task_a', ['parent_dep']);
    assert.equal(engine.nodes.get('task_a').size, 1);
    assert.ok(engine.nodes.get('task_a').has('parent_dep'));

    // Now add node B which depends on A
    engine.addNode('task_b', ['task_a']);

    // Node A's existing dependencies must NOT be overwritten or wiped out
    assert.equal(engine.nodes.get('task_a').size, 1);
    assert.ok(engine.nodes.get('task_a').has('parent_dep'));
  });

  test('should append dependencies to an already existing node when addNode is called again', () => {
    const engine = new DAGEngine();

    // Call addNode once
    engine.addNode('task_a', ['dep_1']);
    assert.equal(engine.nodes.get('task_a').size, 1);
    assert.ok(engine.nodes.get('task_a').has('dep_1'));

    // Call addNode again for task_a with more/different dependencies
    engine.addNode('task_a', ['dep_2', 'dep_3']);

    // Node task_a should now accumulate dep_1, dep_2, and dep_3
    const aDeps = engine.nodes.get('task_a');
    assert.equal(aDeps.size, 3);
    assert.ok(aDeps.has('dep_1'));
    assert.ok(aDeps.has('dep_2'));
    assert.ok(aDeps.has('dep_3'));
  });

  test('should handle duplicate dependencies in input array gracefully without throwing', () => {
    const engine = new DAGEngine();
    engine.addNode('task_a', ['dep_1', 'dep_1', 'dep_2']);

    const aDeps = engine.nodes.get('task_a');
    assert.equal(aDeps.size, 2); // Set handles deduplication
    assert.ok(aDeps.has('dep_1'));
    assert.ok(aDeps.has('dep_2'));
  });

  test('should handle self-dependencies (cycles) during node insertion without crashing', () => {
    const engine = new DAGEngine();
    // addNode doesn't check for cycles, it just builds the map. Cycle detection is done by hasCycle / topologicalSort.
    // Assert that adding a cycle doesn't crash addNode.
    engine.addNode('task_a', ['task_a']);

    assert.ok(engine.nodes.has('task_a'));
    assert.ok(engine.nodes.get('task_a').has('task_a'));
  });

  console.log('\n🎉 All DAGEngine.addNode tests passed successfully!\n');
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
