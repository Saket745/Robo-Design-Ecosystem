const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const stateFilePath = path.resolve(root, '09_EXECUTION_ENGINE', '05_STATE_MANAGER', 'robot_project_state.json');
const backupDir = path.resolve(root, '13_BACKUPS', '01_SNAPSHOTS');

function validatePath(targetPath) {
  const resolved = path.normalize(path.resolve(targetPath));
  const resolvedRoot = path.normalize(path.resolve(root));
  const safeRoot = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  if (!resolved.startsWith(safeRoot) && resolved !== resolvedRoot) {
    throw new Error(`Security Error: Path '${resolved}' is outside allowed root '${resolvedRoot}'.`);
  }
  return resolved;
}

function ensureDir(dirPath) {
  const safePath = validatePath(dirPath);
  if (!fs.existsSync(safePath)) {
    fs.mkdirSync(safePath, { recursive: true });
  }
}

function safeResolveBackupPath(version) {
  const safeVersion = parseInt(version, 10);
  if (isNaN(safeVersion)) {
    throw new Error("Invalid version parameter.");
  }
  const resolved = validatePath(path.join(backupDir, `state_v${safeVersion}.json`));
  const resolvedBackupDir = path.normalize(path.resolve(backupDir));
  const safeBackupDir = resolvedBackupDir.endsWith(path.sep) ? resolvedBackupDir : resolvedBackupDir + path.sep;
  if (!resolved.startsWith(safeBackupDir)) {
    throw new Error("Security Alert: Path traversal attempt blocked.");
  }
  return resolved;
}


const defaultState = {
  robot_type: "quadruped",
  purpose: "indoor navigation + interactive mobile species",
  version: 0,
  timestamp: new Date().toISOString(),
  docs_processed: [],
  skills_activated: [],
  completion_map: {
    scaffold: 1.0,
    core_brain: 1.0,
    global_rules: 1.0,
    skills: 0.0,
    subagents: 0.0,
    memory: 0.0,
    validation: 0.0,
    execution: 0.0,
    dashboard: 0.0
  },
  history: []
};

function getState() {
  const safeStateDir = validatePath(path.dirname(stateFilePath));
  ensureDir(safeStateDir);
  const safeStatePath = validatePath(stateFilePath);
  if (!fs.existsSync(safeStatePath)) {
    saveState(defaultState);
    return defaultState;
  }
  try {
    const raw = fs.readFileSync(safeStatePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading state file, returning defaults:', err);
    return defaultState;
  }
}

function saveState(state) {
  const safeStateDir = validatePath(path.dirname(stateFilePath));
  ensureDir(safeStateDir);
  const safeStatePath = validatePath(stateFilePath);
  fs.writeFileSync(safeStatePath, JSON.stringify(state, null, 2), 'utf8');
}

function updateState(updates) {
  const currentState = getState();
  const nextVersion = (currentState.version || 0) + 1;

  // Merge updates
  const nextState = {
    ...currentState,
    ...updates,
    completion_map: {
      ...currentState.completion_map,
      ...(updates.completion_map || {})
    },
    version: nextVersion,
    timestamp: new Date().toISOString()
  };

  // Keep a small history in the state file
  if (!nextState.history) nextState.history = [];
  nextState.history.push({
    version: currentState.version,
    timestamp: currentState.timestamp,
    changes: Object.keys(updates)
  });
  // Cap history length at 50
  if (nextState.history.length > 50) {
    nextState.history.shift();
  }

  saveState(nextState);

  // Write backup snapshot
  ensureDir(backupDir);
  try {
    const backupPath = safeResolveBackupPath(nextVersion);
    fs.writeFileSync(backupPath, JSON.stringify(nextState, null, 2), 'utf8');
    console.log(`State updated to v${nextVersion}. Snapshot saved to ${path.relative(root, backupPath)}`);
  } catch (err) {
    console.error('Failed to write backup snapshot:', err.message);
  }
  
  return nextState;
}

function rollback(targetVersion) {
  try {
    const backupPath = safeResolveBackupPath(targetVersion);
    if (!fs.existsSync(backupPath)) {
      console.error(`Backup version ${targetVersion} not found at ${backupPath}`);
      return null;
    }
    const raw = fs.readFileSync(backupPath, 'utf8');
    const rolledBackState = JSON.parse(raw);
    saveState(rolledBackState);
    console.log(`State successfully rolled back to version ${targetVersion}`);
    return rolledBackState;
  } catch (err) {
    console.error(`Failed to rollback to version ${targetVersion}:`, err.message);
    return null;
  }
}


module.exports = {
  getState,
  updateState,
  rollback
};

// If run directly from terminal
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'get') {
    console.log(JSON.stringify(getState(), null, 2));
  } else if (command === 'update') {
    try {
      const payload = JSON.parse(args[1]);
      updateState(payload);
    } catch (err) {
      console.error('Invalid JSON payload for update. Usage: node state_manager.js update \'{"key": "value"}\'');
    }
  } else if (command === 'rollback') {
    const version = parseInt(args[1], 10);
    if (isNaN(version)) {
      console.error('Please specify a valid version number for rollback.');
    } else {
      rollback(version);
    }
  } else {
    console.log('State Manager CLI. Commands: get, update <json>, rollback <version>');
  }
}
