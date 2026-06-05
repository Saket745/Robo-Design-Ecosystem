const path = require('path');

// Safe imports that handle missing files during scaffolding phases
let DAGEngine = null;
try {
  DAGEngine = require('../09_EXECUTION_ENGINE/02_DAG_ENGINE/dag_engine');
} catch (e) {
  // Fallback
}

let stateManager = null;
try {
  stateManager = require('../09_EXECUTION_ENGINE/05_STATE_MANAGER/state_manager');
} catch (e) {
  // Fallback
}

let runtime = null;
try {
  runtime = require('../09_EXECUTION_ENGINE/01_RUNTIME/runtime');
} catch (e) {
  // Fallback
}

module.exports = {
  DAGEngine,
  stateManager,
  runtime
};
