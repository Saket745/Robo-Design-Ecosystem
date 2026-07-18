const fs = require('fs');
const path = require('path');
const { parseYAML } = require('../../16_CONFIG/yaml_parser');

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
