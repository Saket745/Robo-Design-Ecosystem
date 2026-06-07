const runtime = require('../01_RUNTIME/runtime');

class DAGEngine {
  constructor() {
    this.nodes = new Map(); // Map of taskID -> Set of dependency taskIDs
  }

  addNode(id, dependencies = []) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, new Set());
    }
    for (const dep of dependencies) {
      this.nodes.get(id).add(dep);
      if (!this.nodes.has(dep)) {
        this.nodes.set(dep, new Set());
      }
    }
  }

  hasCycle() {
    const visited = new Map(); // 0 = unvisited, 1 = visiting, 2 = visited
    for (const node of this.nodes.keys()) {
      visited.set(node, 0);
    }

    const dfs = (node) => {
      visited.set(node, 1);
      const deps = this.nodes.get(node) || new Set();
      for (const dep of deps) {
        if (visited.get(dep) === 1) return true;
        if (visited.get(dep) === 0) {
          if (dfs(dep)) return true;
        }
      }
      visited.set(node, 2);
      return false;
    };

    for (const node of this.nodes.keys()) {
      if (visited.get(node) === 0) {
        if (dfs(node)) return true;
      }
    }
    return false;
  }

  topologicalSort() {
    if (this.hasCycle()) {
      throw new Error("Cycle detected in execution graph. Topological sort impossible.");
    }

    const visited = new Set();
    const order = [];

    const visit = (node) => {
      if (visited.has(node)) return;
      visited.add(node);

      const deps = this.nodes.get(node) || new Set();
      for (const dep of deps) {
        visit(dep);
      }
      order.push(node);
    };

    for (const node of this.nodes.keys()) {
      visit(node);
    }
    return order;
  }
}

// --- Functional APIs ---

function createDAG(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error('Tasks must be an array');
  }

  const dag = {
    tasks: [...tasks],
    nodes: new Map(),
    status: {},
    results: {},
    errors: {}
  };

  tasks.forEach(task => {
    if (!task.id || !task.name || !task.executor) {
      throw new Error(`Invalid task definition: missing id, name, or executor`);
    }
    dag.status[task.id] = 'pending';
    
    // Add to adjacency nodes
    const deps = task.dependencies || [];
    if (!dag.nodes.has(task.id)) {
      dag.nodes.set(task.id, new Set());
    }
    deps.forEach(dep => {
      dag.nodes.get(task.id).add(dep);
      if (!dag.nodes.has(dep)) {
        dag.nodes.set(dep, new Set());
      }
    });
  });

  return dag;
}

function validateDAG(dag) {
  const visited = new Map();
  for (const node of dag.nodes.keys()) {
    visited.set(node, 0);
  }

  const dfs = (node) => {
    visited.set(node, 1);
    const deps = dag.nodes.get(node) || new Set();
    for (const dep of deps) {
      if (visited.get(dep) === 1) return true; // cycle
      if (visited.get(dep) === 0) {
        if (dfs(dep)) return true;
      }
    }
    visited.set(node, 2);
    return false;
  };

  for (const node of dag.nodes.keys()) {
    if (visited.get(node) === 0) {
      if (dfs(node)) return false; // Contains cycle -> invalid
    }
  }
  return true; // No cycles -> valid
}

function getExecutionOrder(dag) {
  if (!validateDAG(dag)) {
    throw new Error("Cycle detected in execution graph. Topological sort impossible.");
  }

  const visited = new Set();
  const order = [];

  const visit = (node) => {
    if (visited.has(node)) return;
    visited.add(node);

    const deps = dag.nodes.get(node) || new Set();
    for (const dep of deps) {
      visit(dep);
    }
    // Only push if the task is defined in tasks (some dependencies might be external/not in tasks list)
    if (dag.tasks.some(t => t.id === node)) {
      order.push(node);
    }
  };

  for (const node of dag.nodes.keys()) {
    visit(node);
  }
  return order;
}

async function executeDAG(dag, executors = {}, context = {}) {
  const order = getExecutionOrder(dag);
  
  for (const taskId of order) {
    const taskDef = dag.tasks.find(t => t.id === taskId);
    if (!taskDef) continue;

    dag.status[taskId] = 'running';
    const executorFn = executors[taskDef.executor];
    
    if (!executorFn) {
      const err = new Error(`Executor '${taskDef.executor}' not found for task '${taskId}'`);
      dag.status[taskId] = 'failed';
      dag.errors[taskId] = err.message;
      throw err;
    }

    try {
      const result = await runtime.executeTask(taskDef, context, executorFn);
      dag.status[taskId] = 'completed';
      dag.results[taskId] = result;
    } catch (err) {
      dag.status[taskId] = 'failed';
      dag.errors[taskId] = err.message;
      throw err;
    }
  }

  return dag.results;
}

function getStatus(dag) {
  return { ...dag.status };
}

// Static attachments to DAGEngine for class-based access
DAGEngine.createDAG = createDAG;
DAGEngine.validateDAG = validateDAG;
DAGEngine.getExecutionOrder = getExecutionOrder;
DAGEngine.executeDAG = executeDAG;
DAGEngine.getStatus = getStatus;

module.exports = DAGEngine;
module.exports.DAGEngine = DAGEngine;
module.exports.createDAG = createDAG;
module.exports.validateDAG = validateDAG;
module.exports.getExecutionOrder = getExecutionOrder;
module.exports.executeDAG = executeDAG;
module.exports.getStatus = getStatus;
