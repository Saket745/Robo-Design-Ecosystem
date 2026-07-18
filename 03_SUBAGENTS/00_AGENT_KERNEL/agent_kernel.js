const fs = require('fs');
const path = require('path');
const { parseYAML } = require('../../16_CONFIG/yaml_parser');

const root = path.resolve(__dirname, '../..');
const agentsBaseDir = path.join(root, '03_SUBAGENTS');
const schemaPath = path.join(agentsBaseDir, '00_AGENT_KERNEL', 'agent_contract_schema.json');

// In-memory registry
const registry = new Map();

function validatePath(targetPath) {
  const resolved = path.normalize(path.resolve(targetPath));
  const resolvedRoot = path.normalize(path.resolve(root));
  const safeRoot = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  if (!resolved.startsWith(safeRoot) && resolved !== resolvedRoot) {
    throw new Error(`Security Error: Path '${resolved}' is outside allowed root '${resolvedRoot}'.`);
  }
  return resolved;
}

function validateAgentContract(agentDef) {
  if (!agentDef || typeof agentDef !== 'object') {
    return { pass: false, errors: ['Agent contract must be an object'] };
  }

  const errors = [];
  
  if (!agentDef.name || typeof agentDef.name !== 'string') {
    errors.push("Property 'name' is required and must be a string");
  }
  if (!agentDef.domain || typeof agentDef.domain !== 'string') {
    errors.push("Property 'domain' is required and must be a string");
  }
  if (!agentDef.capabilities || !Array.isArray(agentDef.capabilities)) {
    errors.push("Property 'capabilities' is required and must be an array");
  } else {
    agentDef.capabilities.forEach((c, idx) => {
      if (typeof c !== 'string') {
        errors.push(`Capabilities item [${idx}] must be a string`);
      }
    });
  }
  if (!agentDef.constraints || typeof agentDef.constraints !== 'object') {
    errors.push("Property 'constraints' is required and must be an object");
  }
  if (!agentDef.communication_protocol || typeof agentDef.communication_protocol !== 'string') {
    errors.push("Property 'communication_protocol' is required and must be a string");
  }

  return {
    pass: errors.length === 0,
    errors
  };
}

function registerAgent(agentDef) {
  const validation = validateAgentContract(agentDef);
  if (!validation.pass) {
    throw new Error(`Agent contract validation failed: ${validation.errors.join(', ')}`);
  }

  registry.set(agentDef.name, agentDef);
  return true;
}

function getAgentRegistry() {
  return Array.from(registry.values());
}

function getAgentByDomain(domain) {
  const target = domain.toLowerCase();
  return getAgentRegistry().filter(a => (a.domain || '').toLowerCase() === target);
}

function scanAgents(basePath = agentsBaseDir) {
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (item === 'node_modules' || item === '.git') continue;
        walk(fullPath);
      } else if (item.endsWith('_agent.json') || item.endsWith('_agent.yaml') || item.endsWith('_agent.yml')) {
        try {
          const raw = fs.readFileSync(fullPath, 'utf8');
          const isYaml = item.endsWith('.yaml') || item.endsWith('.yml');
          const agentDef = isYaml ? parseYAML(raw) : JSON.parse(raw);
          registerAgent(agentDef);
        } catch (err) {
          console.error(`Failed to register agent definition at ${fullPath}: ${err.message}`);
        }
      }
    }
  }

  walk(basePath);
  return getAgentRegistry();
}

// Initial scan
scanAgents();

module.exports = {
  registerAgent,
  getAgentRegistry,
  getAgentByDomain,
  validateAgentContract,
  scanAgents
};
