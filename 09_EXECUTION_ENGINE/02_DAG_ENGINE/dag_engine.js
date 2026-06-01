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
      // Ensure dependency node is also represented in the graph
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
      visited.set(node, 1); // Mark as visiting

      const deps = this.nodes.get(node);
      for (const dep of deps) {
        if (visited.get(dep) === 1) {
          return true; // Cycle detected
        }
        if (visited.get(dep) === 0) {
          if (dfs(dep)) return true;
        }
      }

      visited.set(node, 2); // Mark as fully visited
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

      const deps = this.nodes.get(node);
      for (const dep of deps) {
        visit(dep);
      }

      order.push(node);
    };

    for (const node of this.nodes.keys()) {
      visit(node);
    }

    return order; // Returned array represents execution order (dependencies first)
  }
}

module.exports = DAGEngine;

// Test command line interface
if (require.main === module) {
  const dag = new DAGEngine();
  // Example pipeline:
  // Requirements -> Architecture -> CAD -> Simulation -> Validation
  dag.addNode('Requirements', []);
  dag.addNode('Architecture', ['Requirements']);
  dag.addNode('CAD', ['Architecture']);
  dag.addNode('PCB', ['Architecture']);
  dag.addNode('Firmware', ['Architecture']);
  dag.addNode('Simulation', ['CAD', 'Firmware']);
  dag.addNode('Validation', ['Simulation', 'PCB']);

  console.log('Validating DAG...');
  console.log('Has Cycle:', dag.hasCycle());
  console.log('Topological Execution Order:', dag.topologicalSort());

  // Introduce cycle to test
  console.log('\nIntroducing cycle (Validation -> Requirements)...');
  dag.addNode('Requirements', ['Validation']);
  console.log('Has Cycle:', dag.hasCycle());
  try {
    dag.topologicalSort();
  } catch (err) {
    console.log('Error caught:', err.message);
  }
}
