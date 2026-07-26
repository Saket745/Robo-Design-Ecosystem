const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const memoryDir = path.join(root, '04_MEMORY');
const indexFilePath = path.join(memoryDir, '00_MEMORY_KERNEL', 'memory_index.json');

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

// Memory segment schemas
const SEGMENTS = {
  GLOBAL: 'global_memory',
  PROJECT: 'project_memory',
  WORKING: 'working_memory',
  SEMANTIC: 'semantic_memory',
  EPISODIC: 'episodic_memory',
  PROCEDURAL: 'procedural_memory'
};

let cachedIndex = null;
let cachedMtime = 0;

function clearCache() {
  cachedIndex = null;
  cachedMtime = 0;
}

function loadIndex() {
  try {
    if (fs.existsSync(indexFilePath)) {
      const stat = fs.statSync(indexFilePath);
      if (cachedIndex && stat.mtimeMs === cachedMtime) {
        return cachedIndex;
      }
      const raw = fs.readFileSync(indexFilePath, 'utf8');
      cachedIndex = JSON.parse(raw);
      cachedMtime = stat.mtimeMs;
      return cachedIndex;
    }
  } catch (err) {
    console.error('Error reading memory index from cache check:', err);
  }

  const safeIndexDir = validatePath(path.dirname(indexFilePath));
  ensureDir(safeIndexDir);
  if (!fs.existsSync(indexFilePath)) {
    const defaultIndex = {
      version: 1.0,
      last_updated: new Date().toISOString(),
      entries: []
    };
    saveIndex(defaultIndex);
    cachedIndex = defaultIndex;
    return defaultIndex;
  }
  try {
    const stat = fs.statSync(indexFilePath);
    const raw = fs.readFileSync(indexFilePath, 'utf8');
    cachedIndex = JSON.parse(raw);
    cachedMtime = stat.mtimeMs;
    return cachedIndex;
  } catch (err) {
    console.error('Error reading memory index, returning default:', err);
    return { entries: [] };
  }
}

function saveIndex(index) {
  cachedIndex = index;
  const safeIndexDir = validatePath(path.dirname(indexFilePath));
  ensureDir(safeIndexDir);
  fs.writeFileSync(indexFilePath, JSON.stringify(index, null, 2), 'utf8');
  try {
    const stat = fs.statSync(indexFilePath);
    cachedMtime = stat.mtimeMs;
  } catch (err) {
    cachedMtime = 0;
  }
}

function registerMemory(filePath, segment, tags = [], metadata = {}) {
  const index = loadIndex();
  const relPath = path.relative(root, filePath).replace(/\\/g, '/');
  
  // Prevent duplicate registration
  const existingIdx = index.entries.findIndex(e => e.path === relPath);
  
  const safeFilePath = validatePath(filePath);
  const content = fs.existsSync(safeFilePath) ? fs.readFileSync(safeFilePath, 'utf8') : '';
  const keywords = [...new Set(
    content.toLowerCase()
      .split(/[\s,_.\-\/]+/)
      .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'were', 'your', 'about'].includes(w))
  )].slice(0, 50); // Cap keywords per file at 50

  const entry = {
    id: path.basename(filePath, path.extname(filePath)),
    path: relPath,
    segment,
    tags,
    keywords,
    metadata,
    registered_at: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    index.entries[existingIdx] = entry;
  } else {
    index.entries.push(entry);
  }

  index.last_updated = new Date().toISOString();
  saveIndex(index);
  console.log(`Registered memory file: ${relPath} in segment ${segment}`);
}

function queryMemory(queryString, filters = {}) {
  const index = loadIndex();
  const tokens = queryString.toLowerCase().split(/[\s,_.\-\/]+/);

  const results = index.entries.map(entry => {
    let score = 0;

    // Filter by segment if specified
    if (filters.segment && entry.segment !== filters.segment) {
      return null;
    }

    // Match tags (weight: 5)
    if (entry.tags) {
      entry.tags.forEach(tag => {
        if (tokens.includes(tag.toLowerCase())) score += 5;
      });
    }

    // Match keywords (weight: 2)
    if (entry.keywords) {
      entry.keywords.forEach(kw => {
        if (tokens.includes(kw)) score += 2;
      });
    }

    // Match ID (weight: 10)
    if (tokens.includes(entry.id.toLowerCase())) {
      score += 10;
    }

    return {
      entry,
      score
    };
  })
  .filter(Boolean)
  .filter(res => res.score > 0)
  .sort((a, b) => b.score - a.score);

  return results;
}

module.exports = {
  SEGMENTS,
  registerMemory,
  queryMemory,
  loadIndex,
  clearCache
};

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'query') {
    const query = args.slice(1).join(' ');
    console.log(JSON.stringify(queryMemory(query), null, 2));
  } else if (command === 'register') {
    const filePath = validatePath(path.resolve(args[1]));
    const segment = args[2] || SEGMENTS.GLOBAL;
    const tags = args[3] ? args[3].split(',') : [];
    if (fs.existsSync(filePath)) {
      registerMemory(filePath, segment, tags);
    } else {
      console.error(`File path not found: ${filePath}`);
    }
  } else {
    console.log('Memory OS CLI. Commands: query "<query>", register <file> [segment] [tag1,tag2]');
  }
}
