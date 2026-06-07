const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const configPath = path.join(root, '04_MEMORY', '00_MEMORY_KERNEL', 'memory_config.yaml');

function validatePath(targetPath) {
  const resolved = path.normalize(path.resolve(targetPath));
  const resolvedRoot = path.normalize(path.resolve(root));
  const safeRoot = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  if (!resolved.startsWith(safeRoot) && resolved !== resolvedRoot) {
    throw new Error(`Security Error: Path '${resolved}' is outside allowed root '${resolvedRoot}'.`);
  }
  return resolved;
}

// Simple YAML parser for memory_config.yaml
function parseConfig() {
  if (!fs.existsSync(configPath)) {
    // Default fallback config
    return {
      layers: {
        global: { path: "04_MEMORY/01_GLOBAL_MEMORY/global_store.json", max_entries: 1000 },
        project: { path: "04_MEMORY/02_PROJECT_MEMORY/project_store.json", max_entries: 500 },
        patterns: { path: "04_MEMORY/03_REUSABLE_PATTERNS/patterns_store.json", max_entries: 200 },
        architecture: { path: "04_MEMORY/03_REUSABLE_PATTERNS/architecture_store.json", max_entries: 100 }
      }
    };
  }

  const content = fs.readFileSync(configPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const layers = {};
  let currentLayer = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.search(/\S/);
    if (indent === 0 && trimmed.startsWith('layers:')) {
      continue;
    }

    if (indent === 2 && trimmed.endsWith(':')) {
      currentLayer = trimmed.slice(0, -1).trim();
      layers[currentLayer] = {};
    } else if (indent > 2 && currentLayer && trimmed.includes(':')) {
      const parts = trimmed.split(':');
      const key = parts[0].trim();
      let val = parts.slice(1).join(':').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      } else if (!isNaN(val) && val !== '') {
        val = Number(val);
      }
      layers[currentLayer][key] = val;
    }
  }

  return { layers };
}

function getLayerConfig(layer) {
  const config = parseConfig();
  if (!config.layers[layer]) {
    throw new Error(`Invalid memory layer: ${layer}. Supported layers: ${Object.keys(config.layers).join(', ')}`);
  }
  return config.layers[layer];
}

function loadLayerStore(layer) {
  const layerConf = getLayerConfig(layer);
  const fullPath = validatePath(path.join(root, layerConf.path));
  
  if (!fs.existsSync(fullPath)) {
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return { keys: {}, order: [] };
  }

  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading store for layer ${layer}, returning empty: ${err.message}`);
    return { keys: {}, order: [] };
  }
}

function saveLayerStore(layer, store) {
  const layerConf = getLayerConfig(layer);
  const fullPath = validatePath(path.join(root, layerConf.path));
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, JSON.stringify(store, null, 2), 'utf8');
}

function write(layer, key, value, metadata = {}) {
  if (!key || typeof key !== 'string') {
    throw new Error('Key must be a non-empty string');
  }

  const layerConf = getLayerConfig(layer);
  const store = loadLayerStore(layer);

  // Update or insert entry
  const exists = !!store.keys[key];
  store.keys[key] = {
    value,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  };

  if (exists) {
    // Move to end of order array to represent recent use/write
    store.order = store.order.filter(k => k !== key);
    store.order.push(key);
  } else {
    store.order.push(key);
  }

  // FIFO eviction if max_entries is exceeded
  const max = layerConf.max_entries || 1000;
  while (store.order.length > max) {
    const oldestKey = store.order.shift();
    delete store.keys[oldestKey];
    console.log(`Evicted oldest memory key '${oldestKey}' from layer '${layer}' due to limit (${max})`);
  }

  saveLayerStore(layer, store);
  return true;
}

function read(layer, key) {
  if (!key || typeof key !== 'string') {
    throw new Error('Key must be a non-empty string');
  }

  const store = loadLayerStore(layer);
  if (!store.keys[key]) {
    return null;
  }
  return store.keys[key].value;
}

function query(layer, filter = {}) {
  const store = loadLayerStore(layer);
  const results = [];

  for (const key of store.order) {
    const entry = store.keys[key];
    let matches = true;

    for (const filterKey in filter) {
      if (entry.metadata[filterKey] !== filter[filterKey]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      results.push({
        key,
        value: entry.value,
        metadata: entry.metadata
      });
    }
  }

  return results;
}

function listKeys(layer) {
  const store = loadLayerStore(layer);
  return [...store.order];
}

function deleteKey(layer, key) {
  if (!key || typeof key !== 'string') {
    throw new Error('Key must be a non-empty string');
  }

  const store = loadLayerStore(layer);
  if (!store.keys[key]) {
    return false;
  }

  delete store.keys[key];
  store.order = store.order.filter(k => k !== key);
  saveLayerStore(layer, store);
  return true;
}

module.exports = {
  write,
  read,
  query,
  listKeys,
  deleteKey
};
