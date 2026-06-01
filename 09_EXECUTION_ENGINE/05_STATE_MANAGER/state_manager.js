const stateManager = require('../../../scripts/state_manager');

module.exports = {
  getState: stateManager.getState,
  updateState: stateManager.updateState,
  rollback: stateManager.rollback
};
