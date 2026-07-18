const { createDAG, executeDAG } = require('./dag_engine');
const runtime = require('../01_RUNTIME/runtime');

// Mock the runtime module
jest.mock('../01_RUNTIME/runtime', () => ({
  executeTask: jest.fn()
}));

describe('DAGEngine - executeDAG', () => {
  let context;
  let executors;

  beforeEach(() => {
    jest.clearAllMocks();
    context = { session: 'test-session' };
    executors = {
      task1_exec: jest.fn().mockResolvedValue('res1'),
      task2_exec: jest.fn().mockResolvedValue('res2'),
      task3_exec: jest.fn().mockResolvedValue('res3')
    };
  });

  test('should successfully execute a sequential DAG in correct topological order', async () => {
    const tasks = [
      {
        id: 'task2',
        name: 'Task Two',
        executor: 'task2_exec',
        dependencies: ['task1']
      },
      {
        id: 'task1',
        name: 'Task One',
        executor: 'task1_exec',
        dependencies: []
      }
    ];

    const dag = createDAG(tasks);

    // Mock runtime.executeTask behavior
    runtime.executeTask.mockImplementation(async (taskDef, ctx, execFn) => {
      return execFn(taskDef.params, ctx);
    });

    const results = await executeDAG(dag, executors, context);

    // Verify order of calls
    expect(runtime.executeTask).toHaveBeenCalledTimes(2);

    const firstCall = runtime.executeTask.mock.calls[0];
    const secondCall = runtime.executeTask.mock.calls[1];

    expect(firstCall[0].id).toBe('task1');
    expect(secondCall[0].id).toBe('task2');

    // Verify results
    expect(results).toEqual({
      task1: 'res1',
      task2: 'res2'
    });

    expect(dag.status).toEqual({
      task1: 'completed',
      task2: 'completed'
    });

    expect(dag.results).toEqual({
      task1: 'res1',
      task2: 'res2'
    });
  });

  test('should throw an error and halt when an executor is missing', async () => {
    const tasks = [
      {
        id: 'task1',
        name: 'Task One',
        executor: 'missing_exec',
        dependencies: []
      },
      {
        id: 'task2',
        name: 'Task Two',
        executor: 'task2_exec',
        dependencies: ['task1']
      }
    ];

    const dag = createDAG(tasks);

    await expect(executeDAG(dag, executors, context)).rejects.toThrow(
      "Executor 'missing_exec' not found for task 'task1'"
    );

    expect(dag.status.task1).toBe('failed');
    expect(dag.errors.task1).toBe("Executor 'missing_exec' not found for task 'task1'");
    expect(dag.status.task2).toBe('pending'); // Never executed

    expect(runtime.executeTask).not.toHaveBeenCalled();
  });

  test('should throw an error and set status to failed when runtime task execution fails', async () => {
    const tasks = [
      {
        id: 'task1',
        name: 'Task One',
        executor: 'task1_exec',
        dependencies: []
      },
      {
        id: 'task2',
        name: 'Task Two',
        executor: 'task2_exec',
        dependencies: ['task1']
      }
    ];

    const dag = createDAG(tasks);

    const testError = new Error('Runtime execution failed');
    runtime.executeTask.mockRejectedValueOnce(testError);

    await expect(executeDAG(dag, executors, context)).rejects.toThrow(testError);

    expect(dag.status.task1).toBe('failed');
    expect(dag.errors.task1).toBe('Runtime execution failed');
    expect(dag.status.task2).toBe('pending'); // t2 is not run since t1 threw

    expect(runtime.executeTask).toHaveBeenCalledTimes(1);
  });

  test('should skip tasks in order that are not defined in dag.tasks', async () => {
    const tasks = [
      {
        id: 'task1',
        name: 'Task One',
        executor: 'task1_exec',
        dependencies: []
      }
    ];

    const dag = createDAG(tasks);

    // Let's manually inject a dependency/node in the DAG graph structure
    // so getExecutionOrder includes 'task2' but it is missing in dag.tasks
    dag.nodes.set('task2', new Set(['task1']));
    // Now getExecutionOrder should yield ['task1', 'task2'] since task2 depends on task1
    // But task2 has no definition in dag.tasks

    runtime.executeTask.mockImplementation(async (taskDef, ctx, execFn) => {
      return execFn(taskDef.params, ctx);
    });

    const results = await executeDAG(dag, executors, context);

    expect(runtime.executeTask).toHaveBeenCalledTimes(1);
    expect(runtime.executeTask.mock.calls[0][0].id).toBe('task1');
    expect(results).toEqual({
      task1: 'res1'
    });
  });

  test('should execute multiple independent tasks', async () => {
    const tasks = [
      {
        id: 'task1',
        name: 'Task One',
        executor: 'task1_exec',
        dependencies: []
      },
      {
        id: 'task3',
        name: 'Task Three',
        executor: 'task3_exec',
        dependencies: []
      }
    ];

    const dag = createDAG(tasks);

    runtime.executeTask.mockImplementation(async (taskDef, ctx, execFn) => {
      return execFn(taskDef.params, ctx);
    });

    const results = await executeDAG(dag, executors, context);

    expect(runtime.executeTask).toHaveBeenCalledTimes(2);
    expect(results).toEqual({
      task1: 'res1',
      task3: 'res3'
    });

    expect(dag.status.task1).toBe('completed');
    expect(dag.status.task3).toBe('completed');
  });
});
