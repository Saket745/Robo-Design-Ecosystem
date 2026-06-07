const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const defaultSkillsDir = path.join(root, '02_SKILLS', '04_SKILL_DOMAINS');
const registryFile = path.join(root, '02_SKILLS', '01_CAPABILITY_REGISTRY', 'skill_index.json');
const masterRegistryYaml = path.join(root, '02_SKILLS', '01_CAPABILITY_REGISTRY', 'master_skill_registry.yaml');

// Helper to ensure value is an array
function ensureArray(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  if (typeof val === 'string') return [val];
  if (typeof val === 'object') return [];
  return [];
}

// Custom YAML parser (zero dependencies)
function parseYAML(content) {
  if (!content) return {};
  const lines = content.split(/\r?\n/).map(line => {
    const commentIdx = line.indexOf('#');
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx);
    }
    return line;
  }).filter(line => line.trim() !== '');

  const parseNode = (startIdx, parentIndent) => {
    const obj = {};
    const arr = [];
    let isArr = false;
    let idx = startIdx;

    while (idx < lines.length) {
      const line = lines[idx];
      const indent = line.search(/\S/);
      const trimmed = line.trim();

      if (indent <= parentIndent) {
        break; // Out of scope
      }

      if (trimmed.startsWith('-')) {
        isArr = true;
        const valStr = trimmed.substring(1).trim();
        
        if (valStr.includes(':')) {
          const firstColon = valStr.indexOf(':');
          const subKey = valStr.substring(0, firstColon).trim();
          const subRest = valStr.substring(firstColon + 1).trim();
          
          let parsedVal = subRest;
          if (parsedVal.startsWith('[') && parsedVal.endsWith(']')) {
            parsedVal = parsedVal.substring(1, parsedVal.length - 1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          } else if ((parsedVal.startsWith('"') && parsedVal.endsWith('"')) || (parsedVal.startsWith("'") && parsedVal.endsWith("'"))) {
            parsedVal = parsedVal.substring(1, parsedVal.length - 1);
          } else if (parsedVal === 'true') {
            parsedVal = true;
          } else if (parsedVal === 'false') {
            parsedVal = false;
          } else if (!isNaN(parsedVal) && parsedVal !== '') {
            parsedVal = Number(parsedVal);
          }
          
          const itemObj = { [subKey]: parsedVal };
          let subIdx = idx + 1;
          while (subIdx < lines.length) {
            const subLine = lines[subIdx];
            const subIndent = subLine.search(/\S/);
            const subTrimmed = subLine.trim();
            
            if (subIndent < indent || (subIndent === indent && subTrimmed.startsWith('-'))) {
              break;
            }
            
            const subColon = subTrimmed.indexOf(':');
            if (subColon !== -1) {
              const k = subTrimmed.substring(0, subColon).trim();
              let v = subTrimmed.substring(subColon + 1).trim();
              if (v.startsWith('[') && v.endsWith(']')) {
                v = v.substring(1, v.length - 1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
              } else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                v = v.substring(1, v.length - 1);
              } else if (v === 'true') {
                v = true;
              } else if (v === 'false') {
                v = false;
              } else if (!isNaN(v) && v !== '') {
                v = Number(v);
              }
              itemObj[k] = v;
            }
            subIdx++;
          }
          arr.push(itemObj);
          idx = subIdx;
        } else {
          let val = valStr;
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          arr.push(val);
          idx++;
        }
      } else {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) {
          idx++;
          continue;
        }
        const key = trimmed.substring(0, colonIdx).trim();
        const rest = trimmed.substring(colonIdx + 1).trim();

        if (rest === '') {
          const [subNode, nextIdx] = parseNode(idx + 1, indent);
          obj[key] = subNode;
          idx = nextIdx;
        } else {
          let val = rest;
          if (val.startsWith('[') && val.endsWith(']')) {
            val = val.substring(1, val.length - 1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          } else {
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.substring(1, val.length - 1);
            } else if (val === 'true') {
              val = true;
            } else if (val === 'false') {
              val = false;
            } else if (!isNaN(val) && val !== '') {
              val = Number(val);
            }
          }
          obj[key] = val;
          idx++;
        }
      }
    }

    return [isArr ? arr : obj, idx];
  };

  const [result] = parseNode(0, -1);
  return result;
}

// Parses master registry YAML as reference map
function loadMasterRegistryMap() {
  if (!fs.existsSync(masterRegistryYaml)) return new Map();
  try {
    const content = fs.readFileSync(masterRegistryYaml, 'utf8');
    const parsed = parseYAML(content);
    const map = new Map();
    if (parsed && Array.isArray(parsed.skills)) {
      parsed.skills.forEach(s => {
        if (s.id) map.set(s.id, s);
      });
    }
    return map;
  } catch (err) {
    console.error(`Failed to load master registry: ${err.message}`);
    return new Map();
  }
}

// Parse Markdown structure to extract title and section bullet lists
function parseMarkdownContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let yamlMetadata = {};
  let markdownBody = content;

  // Check for YAML Frontmatter (enclosed by ---)
  if (content.startsWith('---')) {
    const firstEnd = content.indexOf('---', 3);
    if (firstEnd !== -1) {
      const frontmatterText = content.substring(3, firstEnd).trim();
      yamlMetadata = parseYAML(frontmatterText);
      markdownBody = content.substring(firstEnd + 3);
    }
  }

  const lines = markdownBody.split(/\r?\n/);
  let name = yamlMetadata.name || yamlMetadata.title || '';
  let purpose = yamlMetadata.description || yamlMetadata.purpose || '';
  const inputs = yamlMetadata.inputs || [];
  const outputs = yamlMetadata.outputs || [];
  const dependencies = yamlMetadata.dependencies || [];

  let currentSection = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      if (!name) {
        name = trimmed.substring(2).replace(/^Skill:\s*/i, '').trim();
      }
    } else if (trimmed.startsWith('## ')) {
      currentSection = trimmed.substring(3).toLowerCase().trim();
    } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const item = trimmed.substring(1).trim();
      if (item) {
        if (currentSection === 'inputs' && !yamlMetadata.inputs) {
          inputs.push(item);
        } else if (currentSection === 'outputs' && !yamlMetadata.outputs) {
          outputs.push(item);
        } else if (currentSection === 'dependencies' && !yamlMetadata.dependencies) {
          dependencies.push(item);
        }
      }
    } else if (trimmed && !trimmed.startsWith('#') && currentSection === 'purpose') {
      if (!purpose) {
        purpose = trimmed;
      } else if (purpose.length < 200) {
        purpose += ' ' + trimmed;
      }
    }
  }

  return {
    name,
    purpose,
    inputs,
    outputs,
    dependencies: dependencies.filter(Boolean)
  };
}

function parseSkillManifest(skillPath) {
  const dir = path.dirname(skillPath);
  const relativeDir = path.relative(root, dir).replace(/\\/g, '/');
  const relativeFile = path.relative(root, skillPath).replace(/\\/g, '/');
  
  // Get domain from directory name lowercase
  const pathParts = relativeDir.split('/');
  const domainIndex = pathParts.indexOf('04_SKILL_DOMAINS');
  let domain = 'unknown';
  if (domainIndex !== -1 && pathParts[domainIndex + 1]) {
    domain = pathParts[domainIndex + 1].toLowerCase();
  }

  // Parse skill.md
  const mdInfo = parseMarkdownContent(skillPath);

  // Check for dependencies.yaml in the same folder
  const depYamlPath = path.join(dir, 'dependencies.yaml');
  let yamlInfo = {};
  if (fs.existsSync(depYamlPath)) {
    try {
      const depContent = fs.readFileSync(depYamlPath, 'utf8');
      yamlInfo = parseYAML(depContent) || {};
    } catch (e) {
      console.error(`Error parsing dependencies.yaml at ${depYamlPath}: ${e.message}`);
    }
  }

  const id = yamlInfo.skill_id || path.basename(dir);
  const version = yamlInfo.version || '1.0.0';

  // Find references in master_skill_registry.yaml
  const masterRegistryMap = loadMasterRegistryMap();
  const masterRef = masterRegistryMap.get(id) || {};

  // Resolve dependencies from all possible sources
  const finalDeps = Array.from(new Set([
    ...ensureArray(yamlInfo.dependencies),
    ...ensureArray(mdInfo.dependencies),
    ...ensureArray(masterRef.dependencies)
  ]));

  return {
    id,
    name: mdInfo.name || masterRef.name || id,
    domain: masterRef.domain || domain,
    type: masterRef.type || 'domain_skill',
    tags: ensureArray(masterRef.tags || [id, domain]),
    version,
    status: masterRef.status || 'active',
    entrypoint: relativeFile,
    dependencies: finalDeps,
    validation: masterRef.validation || `${relativeDir}/validation.md`,
    keywords: ensureArray(masterRef.keywords || [id, ...domain.split('_')]),
    inputs: mdInfo.inputs,
    outputs: mdInfo.outputs,
    purpose: mdInfo.purpose || masterRef.description || ''
  };
}

function scanSkills(basePath = defaultSkillsDir) {
  const skills = [];
  
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item === 'skill.md') {
        try {
          const skillObj = parseSkillManifest(fullPath);
          skills.push(skillObj);
        } catch (err) {
          console.error(`Failed to parse skill at ${fullPath}: ${err.message}`);
        }
      }
    }
  }

  walk(basePath);

  // Write index file
  const indexData = { skills };
  fs.writeFileSync(registryFile, JSON.stringify(indexData, null, 2), 'utf8');
  
  return indexData;
}

function getSkillIndex() {
  if (fs.existsSync(registryFile)) {
    try {
      return JSON.parse(fs.readFileSync(registryFile, 'utf8'));
    } catch (e) {
      return scanSkills();
    }
  }
  return scanSkills();
}

function getSkillByDomain(domain) {
  const index = getSkillIndex();
  const target = domain.toLowerCase();
  return (index.skills || []).filter(s => (s.domain || '').toLowerCase() === target);
}

module.exports = {
  scanSkills,
  parseSkillManifest,
  getSkillIndex,
  getSkillByDomain
};
