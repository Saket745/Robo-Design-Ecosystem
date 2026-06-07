const stateManager = require('../09_EXECUTION_ENGINE/05_STATE_MANAGER/state_manager');

module.exports = {
  getState: stateManager.getState,
  updateState: stateManager.updateState,
  rollback: stateManager.rollback
};

// If run directly from terminal
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'get') {
    console.log(JSON.stringify(stateManager.getState(), null, 2));
  } else if (command === 'update') {
    try {
      const payload = JSON.parse(args[1]);
      stateManager.updateState(payload);
    } catch (err) {
      console.error('Invalid JSON payload for update. Usage: node state_manager.js update \'{"key": "value"}\'');
    }
  } else if (command === 'rollback') {
    const version = parseInt(args[1], 10);
    if (isNaN(version)) {
      console.error('Please specify a valid version number for rollback.');
    } else {
      try {
        stateManager.rollback(version);
      } catch (err) {
        console.error('Rollback failed:', err.message);
      }
    }
  } else {
    console.log('State Manager CLI. Commands: get, update <json>, rollback <version>');
  }
}
