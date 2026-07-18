const assert = require('assert');
const DAGEngine = require('./dag_engine');

console.log('🧪 Starting DAG Engine Unit Tests...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
  }
}

async function testAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
  }
}

// ============================================================================
// OOP CLASS API TESTS
// ============================================================================

test('OOP DAGEngine - should initialize with empty nodes', () => {
  const engine = new DAGEngine();
  assert.strictEqual(engine.nodes.size, 0);
});

test('OOP DAGEngine - should add nodes and dependencies correctly', () => {
  const engine = new DAGEngine();
  engine.addNode('A', ['B', 'C']);

  assert.strictEqual(engine.nodes.size, 3);
  assert.ok(engine.nodes.has('A'));
  assert.ok(engine.nodes.has('B'));
  assert.ok(engine.nodes.has('C'));

  const aDeps = engine.nodes.get('A');
  assert.strictEqual(aDeps.size, 2);
  assert.ok(aDeps.has('B'));
  assert.ok(aDeps.has('C'));
});

test('OOP DAGEngine - should detect cycle in a self-loop', () => {
  const engine = new DAGEngine();
  engine.addNode('A', ['A']);
  assert.strictEqual(engine.hasCycle(), true);
});

test('OOP DAGEngine - should detect cycle in a simple loop (A -> B -> A)', () => {
  const engine = new DAGEngine();
  engine.addNode('A', ['B']);
  engine.addNode('B', ['A']);
  assert.strictEqual(engine.hasCycle(), true);
});

test('OOP DAGEngine - should detect cycle in a deeper loop (A -> B -> C -> A)', () => {
  const engine = new DAGEngine();
  engine.addNode('A', ['B']);
  engine.addNode('B', ['C']);
  engine.addNode('C', ['A']);
  assert.strictEqual(engine.hasCycle(), true);
});

test('OOP DAGEngine - should not detect cycle in a valid DAG (diamond structure)', () => {
  const engine = new DAGEngine();
  engine.addNode('A', ['B', 'C']);
  engine.addNode('B', ['D']);
  engine.addNode('C', ['D']);
  engine.addNode('D', []);
  assert.strictEqual(engine.hasCycle(), false);
});

test('OOP DAGEngine - should topologically sort a valid DAG', () => {
  const engine = new DAGEngine();
  engine.addNode('A', ['B']);
  engine.addNode('B', ['C']);
  engine.addNode('C', []);

  const order = engine.topologicalSort();
  // Dependencies must execute before dependents.
  // In our nodes map: key -> set of dependency taskIDs
  // Thus A depends on B, B depends on C.
  // Execution order: C -> B -> A
  assert.deepStrictEqual(order, ['C', 'B', 'A']);
});

test('OOP DAGEngine - topologicalSort should throw if cycle is detected', () => {
  const engine = new DAGEngine();
  engine.addNode('A', ['B']);
  engine.addNode('B', ['A']);

  assert.throws(() => {
    engine.topologicalSort();
  }, /Cycle detected/);
});

// ============================================================================
// FUNCTIONAL API TESTS - createDAG & validateDAG
// ============================================================================

test('Functional - createDAG should throw if input is not an array', () => {
  assert.throws(() => {
    DAGEngine.createDAG({});
  }, /Tasks must be an array/);
});

test('Functional - createDAG should throw if task definition is missing required fields', () => {
  assert.throws(() => {
    DAGEngine.createDAG([{ id: '1', executor: 'exec1' }]); // missing 'name'
  }, /Invalid task definition: missing id, name, or executor/);

  assert.throws(() => {
    DAGEngine.createDAG([{ name: 'Task 1', executor: 'exec1' }]); // missing 'id'
  }, /Invalid task definition: missing id, name, or executor/);

  assert.throws(() => {
    DAGEngine.createDAG([{ id: '1', name: 'Task 1' }]); // missing 'executor'
  }, /Invalid task definition: missing id, name, or executor/);
});

test('Functional - createDAG should correctly initialize a valid task list', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: [] },
    { id: 't2', name: 'Task 2', executor: 'exec2', dependencies: ['t1'] }
  ];

  const dag = DAGEngine.createDAG(tasks);

  assert.deepStrictEqual(dag.tasks, tasks);
  assert.strictEqual(dag.nodes.size, 2);
  assert.ok(dag.nodes.has('t1'));
  assert.ok(dag.nodes.has('t2'));
  assert.deepStrictEqual([...dag.nodes.get('t2')], ['t1']);
  assert.deepStrictEqual(dag.status, { t1: 'pending', t2: 'pending' });
  assert.deepStrictEqual(dag.results, {});
  assert.deepStrictEqual(dag.errors, {});
});

test('Functional - validateDAG should validate a correct linear DAG', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: [] },
    { id: 't2', name: 'Task 2', executor: 'exec2', dependencies: ['t1'] },
    { id: 't3', name: 'Task 3', executor: 'exec3', dependencies: ['t2'] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  assert.strictEqual(DAGEngine.validateDAG(dag), true);
});

test('Functional - validateDAG should validate a correct branching / diamond DAG', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: ['t2', 't3'] },
    { id: 't2', name: 'Task 2', executor: 'exec2', dependencies: ['t4'] },
    { id: 't3', name: 'Task 3', executor: 'exec3', dependencies: ['t4'] },
    { id: 't4', name: 'Task 4', executor: 'exec4', dependencies: [] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  assert.strictEqual(DAGEngine.validateDAG(dag), true);
});

test('Functional - validateDAG should invalidate self-loop', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: ['t1'] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  assert.strictEqual(DAGEngine.validateDAG(dag), false);
});

test('Functional - validateDAG should invalidate direct loop (A <-> B)', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: ['t2'] },
    { id: 't2', name: 'Task 2', executor: 'exec2', dependencies: ['t1'] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  assert.strictEqual(DAGEngine.validateDAG(dag), false);
});

test('Functional - validateDAG should invalidate deeper loop (A -> B -> C -> A)', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: ['t2'] },
    { id: 't2', name: 'Task 2', executor: 'exec2', dependencies: ['t3'] },
    { id: 't3', name: 'Task 3', executor: 'exec3', dependencies: ['t1'] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  assert.strictEqual(DAGEngine.validateDAG(dag), false);
});

test('Functional - validateDAG should handle missing dependency referenced as a valid DAG structure', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: ['t_missing'] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  // t_missing is implicitly added to nodes map with an empty dependency Set
  assert.strictEqual(DAGEngine.validateDAG(dag), true);
});

test('Functional - validateDAG should detect cycles when missing dependencies are involved in cycles', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: ['t_missing'] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  // Introduce cycle manually into the nodes map
  dag.nodes.get('t_missing').add('t1');
  assert.strictEqual(DAGEngine.validateDAG(dag), false);
});

// ============================================================================
// FUNCTIONAL API TESTS - getExecutionOrder & getStatus
// ============================================================================

test('Functional - getExecutionOrder should return the correct sequence', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: ['t2'] },
    { id: 't2', name: 'Task 2', executor: 'exec2', dependencies: [] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  // execution order executes dependencies first: t2 -> t1
  assert.deepStrictEqual(DAGEngine.getExecutionOrder(dag), ['t2', 't1']);
});

test('Functional - getExecutionOrder should exclude missing/external tasks from the final order list', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: ['t_missing'] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  // t_missing is not in dag.tasks, so it should not be returned in the execution order
  assert.deepStrictEqual(DAGEngine.getExecutionOrder(dag), ['t1']);
});

test('Functional - getExecutionOrder should throw on cyclic DAG', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: ['t2'] },
    { id: 't2', name: 'Task 2', executor: 'exec2', dependencies: ['t1'] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  assert.throws(() => {
    DAGEngine.getExecutionOrder(dag);
  }, /Cycle detected/);
});

test('Functional - getStatus should return a copy of the status map', () => {
  const tasks = [
    { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: [] }
  ];
  const dag = DAGEngine.createDAG(tasks);
  const status = DAGEngine.getStatus(dag);
  assert.deepStrictEqual(status, { t1: 'pending' });

  // Verify it returns a shallow copy
  status.t1 = 'running';
  assert.strictEqual(dag.status.t1, 'pending');
});

// ============================================================================
// FUNCTIONAL API TESTS - executeDAG Async
// ============================================================================

async function runAsyncTests() {
  await testAsync('Functional - executeDAG should successfully execute a DAG', async () => {
    const tasks = [
      { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: [] },
      { id: 't2', name: 'Task 2', executor: 'exec2', dependencies: ['t1'] }
    ];
    const dag = DAGEngine.createDAG(tasks);

    const executors = {
      exec1: async (task, context) => {
        context.t1Ran = true;
        return 'res1';
      },
      exec2: async (task, context) => {
        assert.ok(context.t1Ran);
        return 'res2';
      }
    };

    const context = {};
    const results = await DAGEngine.executeDAG(dag, executors, context);

    assert.deepStrictEqual(results, { t1: 'res1', t2: 'res2' });
    assert.deepStrictEqual(dag.results, { t1: 'res1', t2: 'res2' });
    assert.deepStrictEqual(dag.status, { t1: 'completed', t2: 'completed' });
    assert.deepStrictEqual(dag.errors, {});
  });

  await testAsync('Functional - executeDAG should fail and throw when an executor is missing', async () => {
    const tasks = [
      { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: [] },
      { id: 't2', name: 'Task 2', executor: 'exec2', dependencies: ['t1'] }
    ];
    const dag = DAGEngine.createDAG(tasks);

    const executors = {
      exec1: async (task, context) => 'res1'
      // missing exec2
    };

    await assert.rejects(async () => {
      await DAGEngine.executeDAG(dag, executors);
    }, /Executor 'exec2' not found for task 't2'/);

    assert.strictEqual(dag.status.t1, 'completed');
    assert.strictEqual(dag.status.t2, 'failed');
    assert.strictEqual(dag.errors.t2, "Executor 'exec2' not found for task 't2'");
  });

  await testAsync('Functional - executeDAG should fail and throw when a task execution throws', async () => {
    const tasks = [
      { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: [] }
    ];
    const dag = DAGEngine.createDAG(tasks);

    const executors = {
      exec1: async (task, context) => {
        throw new Error('exec1 crashed');
      }
    };

    await assert.rejects(async () => {
      await DAGEngine.executeDAG(dag, executors);
    }, /exec1 crashed/);

    assert.strictEqual(dag.status.t1, 'failed');
    assert.strictEqual(dag.errors.t1, 'exec1 crashed');
  });

  await testAsync('Functional - executeDAG should retry when retries property is set', async () => {
    const tasks = [
      { id: 't1', name: 'Task 1', executor: 'exec1', dependencies: [], retries: 2 }
    ];
    const dag = DAGEngine.createDAG(tasks);

    let calls = 0;
    const executors = {
      exec1: async (task, context) => {
        calls++;
        if (calls < 3) {
          throw new Error('transient issue');
        }
        return 'success';
      }
    };

    const results = await DAGEngine.executeDAG(dag, executors);
    assert.strictEqual(calls, 3);
    assert.strictEqual(results.t1, 'success');
    assert.strictEqual(dag.status.t1, 'completed');
    assert.deepStrictEqual(dag.errors, {});
  });

  // Print results summary
  console.log('\n======================================================================');
  console.log(`📊 TEST SUMMARY: ${passedTests}/${totalTests} Tests Passed`);
  console.log('======================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAsyncTests().catch(err => {
  console.error('Fatal error during async tests:', err);
  process.exit(1);
});
