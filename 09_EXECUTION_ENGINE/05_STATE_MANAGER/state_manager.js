const fs = require('fs');
const path = require('path');

let activeProjectId = null;

function getStoreDir() {
  return path.resolve(__dirname, 'store');
}

function validatePath(targetPath) {
  const resolved = path.normalize(path.resolve(targetPath));
  const storeDir = path.normalize(getStoreDir());
  const safeStore = storeDir.endsWith(path.sep) ? storeDir : storeDir + path.sep;
  
  const rootDir = path.normalize(path.resolve(__dirname, '../../..'));
  const safeRoot = rootDir.endsWith(path.sep) ? rootDir : rootDir + path.sep;

  if (!resolved.startsWith(safeStore) && !resolved.startsWith(safeRoot) && resolved !== storeDir && resolved !== rootDir) {
    throw new Error(`Security Error: Path '${resolved}' is outside allowed directories.`);
  }
  return resolved;
}

function getDefaultState(projectId) {
  return {
    projectId: projectId,
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
    history: [],
    checkpoints: []
  };
}

function initState(projectId) {
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('Project ID must be a non-empty string');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    throw new Error('Security Error: Invalid Project ID format.');
  }
  activeProjectId = projectId;
  
  const storeDir = getStoreDir();
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }

  const stateFilePath = path.join(storeDir, `${projectId}_state.json`);
  if (!fs.existsSync(stateFilePath)) {
    const oldStatePath = path.resolve(__dirname, 'robot_project_state.json');
    if (projectId === 'robot_project' && fs.existsSync(oldStatePath)) {
      try {
        const raw = fs.readFileSync(oldStatePath, 'utf8');
        const oldState = JSON.parse(raw);
        if (!oldState.checkpoints) oldState.checkpoints = [];
        oldState.projectId = projectId;
        fs.writeFileSync(stateFilePath, JSON.stringify(oldState, null, 2), 'utf8');
      } catch (err) {
        fs.writeFileSync(stateFilePath, JSON.stringify(getDefaultState(projectId), null, 2), 'utf8');
      }
    } else {
      fs.writeFileSync(stateFilePath, JSON.stringify(getDefaultState(projectId), null, 2), 'utf8');
    }
  }
  return getState();
}

function ensureActiveProject() {
  if (!activeProjectId) {
    initState('robot_project');
  }
}

function getState(key) {
  ensureActiveProject();
  const stateFilePath = path.join(getStoreDir(), `${activeProjectId}_state.json`);
  try {
    const raw = fs.readFileSync(stateFilePath, 'utf8');
    const state = JSON.parse(raw);
    if (key) {
      return state[key];
    }
    return state;
  } catch (err) {
    return getDefaultState(activeProjectId);
  }
}

function setState(key, value) {
  ensureActiveProject();
  const stateFilePath = path.join(getStoreDir(), `${activeProjectId}_state.json`);
  let state = getState();
  
  state[key] = value;
  state.version = (state.version || 0) + 1;
  state.timestamp = new Date().toISOString();
  
  if (!state.history) state.history = [];
  state.history.push({
    version: state.version,
    timestamp: state.timestamp,
    changes: [key]
  });
  
  if (state.history.length > 50) {
    state.history.shift();
  }
  
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');
  return state;
}

function updateState(updates) {
  ensureActiveProject();
  const stateFilePath = path.join(getStoreDir(), `${activeProjectId}_state.json`);
  let state = getState();
  
  const nextVersion = (state.version || 0) + 1;
  state = {
    ...state,
    ...updates,
    completion_map: {
      ...state.completion_map,
      ...(updates.completion_map || {})
    },
    version: nextVersion,
    timestamp: new Date().toISOString()
  };
  
  if (!state.history) state.history = [];
  state.history.push({
    version: state.version,
    timestamp: state.timestamp,
    changes: Object.keys(updates)
  });
  
  if (state.history.length > 50) {
    state.history.shift();
  }
  
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');
  return state;
}

function createCheckpoint(label) {
  ensureActiveProject();
  const state = getState();
  const version = state.version || 0;
  const timestamp = Date.now();
  const checkpointId = `chk_${version}_${timestamp}`;
  
  const storeDir = getStoreDir();
  const checkpointPath = path.join(storeDir, `${activeProjectId}_checkpoint_${checkpointId}.json`);
  
  fs.writeFileSync(checkpointPath, JSON.stringify(state, null, 2), 'utf8');
  
  if (!state.checkpoints) state.checkpoints = [];
  state.checkpoints.push({
    id: checkpointId,
    label: label || `Checkpoint v${version}`,
    version: version,
    timestamp: new Date().toISOString(),
    file: `${activeProjectId}_checkpoint_${checkpointId}.json`
  });
  
  const stateFilePath = path.join(storeDir, `${activeProjectId}_state.json`);
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');
  
  return checkpointId;
}

function rollback(checkpointId) {
  ensureActiveProject();
  if (checkpointId && !/^[a-zA-Z0-9_-]+$/.test(String(checkpointId))) {
    throw new Error('Security Error: Invalid checkpoint ID format.');
  }
  const storeDir = getStoreDir();
  let checkpointFile = null;
  const state = getState();
  
  if (state.checkpoints) {
    const cp = state.checkpoints.find(c => c.id === checkpointId || String(c.version) === String(checkpointId));
    if (cp) {
      checkpointFile = cp.file;
    }
  }
  
  if (!checkpointFile) {
    const directPath = path.join(storeDir, `${activeProjectId}_checkpoint_${checkpointId}.json`);
    if (fs.existsSync(directPath)) {
      checkpointFile = `${activeProjectId}_checkpoint_${checkpointId}.json`;
    }
  }
  
  let backupPath = null;
  if (!checkpointFile) {
    const versionNum = parseInt(checkpointId, 10);
    if (!isNaN(versionNum)) {
      const oldBackupPath = path.resolve(__dirname, '../../..', '13_BACKUPS', '01_SNAPSHOTS', `state_v${versionNum}.json`);
      if (fs.existsSync(oldBackupPath)) {
        backupPath = oldBackupPath;
      }
    }
  }
  
  let resolvedPath = null;
  if (checkpointFile) {
    resolvedPath = path.join(storeDir, checkpointFile);
  } else if (backupPath) {
    resolvedPath = backupPath;
  }
  
  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    throw new Error(`Checkpoint/Backup not found: ${checkpointId}`);
  }
  
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const rolledBackState = JSON.parse(raw);
  
  const nextVersion = (state.version || 0) + 1;
  rolledBackState.version = nextVersion;
  rolledBackState.timestamp = new Date().toISOString();
  
  if (!rolledBackState.history) rolledBackState.history = [];
  rolledBackState.history.push({
    version: nextVersion,
    timestamp: rolledBackState.timestamp,
    changes: ['rollback_to_' + checkpointId]
  });
  
  if (rolledBackState.history.length > 50) {
    rolledBackState.history.shift();
  }
  
  const stateFilePath = path.join(storeDir, `${activeProjectId}_state.json`);
  fs.writeFileSync(stateFilePath, JSON.stringify(rolledBackState, null, 2), 'utf8');
  
  return rolledBackState;
}

function getHistory() {
  ensureActiveProject();
  const state = getState();
  return state.history || [];
}

module.exports = {
  initState,
  getState,
  setState,
  updateState,
  createCheckpoint,
  rollback,
  getHistory
};
