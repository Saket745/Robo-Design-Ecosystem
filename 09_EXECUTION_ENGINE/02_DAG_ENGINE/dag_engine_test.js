const assert = require('assert');
const { DAGEngine } = require('./dag_engine');

describe('DAGEngine.topologicalSort', () => {
  it('should correctly sort a simple linear DAG', () => {
    const engine = new DAGEngine();
    // A -> B -> C
    // B depends on A, C depends on B.
    // So nodes map:
    // B: Set { A }
    // C: Set { B }
    // A: Set {}
    engine.addNode('B', ['A']);
    engine.addNode('C', ['B']);

    const order = engine.topologicalSort();

    // In topologicalSort of this implementation:
    // the code visits nodes in keys order, and visits dependencies first.
    // The pushed order:
    // visit('B'):
    //   visit('A'): Set visited.add('A'), post-order push 'A'
    //   visited.has('A') is true, so no-op.
    //   post-order push 'B'
    // visit('C'):
    //   visit('B') -> already visited, return.
    //   post-order push 'C'
    // Result should be ['A', 'B', 'C'].
    // Let's verify that dependencies always appear before the nodes that depend on them.
    assert.deepStrictEqual(order, ['A', 'B', 'C']);
  });

  it('should correctly sort a branching DAG', () => {
    const engine = new DAGEngine();
    // A -> B
    // A -> C
    // B -> D
    // C -> D
    engine.addNode('B', ['A']);
    engine.addNode('C', ['A']);
    engine.addNode('D', ['B', 'C']);

    const order = engine.topologicalSort();

    // Verify dependencies appear before their dependents
    const indices = {};
    order.forEach((node, index) => {
      indices[node] = index;
    });

    assert.ok(indices['A'] < indices['B']);
    assert.ok(indices['A'] < indices['C']);
    assert.ok(indices['B'] < indices['D']);
    assert.ok(indices['C'] < indices['D']);

    // Check total count
    assert.strictEqual(order.length, 4);
    assert.ok(order.includes('A'));
    assert.ok(order.includes('B'));
    assert.ok(order.includes('C'));
    assert.ok(order.includes('D'));
  });

  it('should throw an error if a cycle is detected', () => {
    const engine = new DAGEngine();
    // A -> B -> C -> A
    engine.addNode('B', ['A']);
    engine.addNode('C', ['B']);
    engine.addNode('A', ['C']);

    assert.throws(() => {
      engine.topologicalSort();
    }, /Cycle detected in execution graph. Topological sort impossible./);
  });

  it('should throw an error for a self-loop cycle', () => {
    const engine = new DAGEngine();
    // A -> A
    engine.addNode('A', ['A']);

    assert.throws(() => {
      engine.topologicalSort();
    }, /Cycle detected in execution graph. Topological sort impossible./);
  });

  it('should correctly handle a disconnected graph', () => {
    const engine = new DAGEngine();
    // Graph 1: A -> B
    // Graph 2: X -> Y
    engine.addNode('B', ['A']);
    engine.addNode('Y', ['X']);

    const order = engine.topologicalSort();

    const indices = {};
    order.forEach((node, index) => {
      indices[node] = index;
    });

    assert.ok(indices['A'] < indices['B']);
    assert.ok(indices['X'] < indices['Y']);
    assert.strictEqual(order.length, 4);
  });

  it('should return an empty list for an empty graph', () => {
    const engine = new DAGEngine();
    const order = engine.topologicalSort();
    assert.deepStrictEqual(order, []);
  });

  it('should handle single-node graph', () => {
    const engine = new DAGEngine();
    engine.addNode('A');
    const order = engine.topologicalSort();
    assert.deepStrictEqual(order, ['A']);
  });
});
