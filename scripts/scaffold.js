const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const structure = {
  '00_CORE_BRAIN': {
    files: {
      'README.md': '# 00_CORE_BRAIN\n\nCore governance and identity brain of the Antigravity Platform.'
    }
  },
  '01_GLOBAL_RULES': {
    dirs: [
      '00_SYSTEM_CONSTITUTION',
      '01_ARCHITECTURE_RULES',
      '02_ENGINEERING_STANDARDS',
      '03_AGENT_BEHAVIOR',
      '04_MEMORY_RULES',
      '05_SECURITY_POLICIES',
      '06_VALIDATION_PROTOCOLS',
      '07_EXECUTION_POLICIES',
      '08_AUTOMATION_GUARDRAILS',
      '09_NAMING_CONVENTIONS',
      '10_DOCUMENTATION_STANDARDS',
      '11_OBSIDIAN_RULES',
      '12_DEPENDENCY_POLICIES',
      '13_GIT_WORKFLOW_RULES',
      '14_BACKUP_AND_RECOVERY_RULES',
      '15_AI_RESPONSE_PROTOCOLS',
      '16_PROJECT_CLASSIFICATION',
      '17_CONTEXT_PERSISTENCE',
      '18_INTEROPERABILITY_RULES',
      '19_INFRASTRUCTURE_POLICIES'
    ],
    files: {
      'README.md': '# 01_GLOBAL_RULES\n\nEcosystem global rules and standards.'
    }
  },
  '02_SKILLS': {
    dirs: [
      '01_CAPABILITY_REGISTRY',
      '02_AGENTIC_ROUTING',
      '03_SYSTEM_SKILLS',
      '04_SKILL_DOMAINS'
    ],
    files: {
      'README.md': '# 02_SKILLS\n\nModular capabilities registry.'
    }
  },
  '03_SUBAGENTS': {
    dirs: [
      '00_AGENT_KERNEL',
      '01_COORDINATION_AGENTS',
      '02_INTELLIGENCE_AGENTS',
      '03_ENGINEERING_AGENTS',
      '04_ROBOTICS_AGENTS'
    ],
    files: {
      'README.md': '# 03_SUBAGENTS\n\nSpecialized agent framework.'
    }
  },
  '04_MEMORY': {
    dirs: [
      '00_MEMORY_KERNEL',
      '01_GLOBAL_MEMORY',
      '02_PROJECT_MEMORY',
      '03_REUSABLE_PATTERNS'
    ],
    files: {
      'README.md': '# 04_MEMORY\n\nCognitive memory store.'
    }
  },
  '05_MCP': {
    dirs: [
      '01_MCP_KERNEL',
      '02_STANDARD_MCPS',
      '03_CUSTOM_MCPS',
      '04_PROJECT_MCP_PROFILES'
    ],
    files: {
      'README.md': '# 05_MCP\n\nModel Context Protocol setup.'
    }
  },
  '06_AUTOMATION': {
    dirs: [
      '01_WORKFLOWS',
      '02_CRON_JOBS'
    ],
    files: {
      'README.md': '# 06_AUTOMATION\n\nBackground tasks and automation logic.'
    }
  },
  '07_SECURITY': {
    dirs: [
      '01_POLICIES',
      '02_SANDBOX_RULES'
    ],
    files: {
      'README.md': '# 07_SECURITY\n\nSecurity model and secrets control.'
    }
  },
  '08_VALIDATION': {
    dirs: [
      '00_VALIDATION_CORE',
      '10_ROBOTICS_VALIDATION'
    ],
    files: {
      'README.md': '# 08_VALIDATION\n\nMaster validation pipeline.'
    }
  },
  '09_EXECUTION_ENGINE': {
    dirs: [
      '01_RUNTIME',
      '02_DAG_ENGINE',
      '05_STATE_MANAGER'
    ],
    files: {
      'README.md': '# 09_EXECUTION_ENGINE\n\nTask planning and execution engine.'
    }
  },
  '10_PROJECT_INTELLIGENCE': {
    dirs: [
      '01_PROJECT_REGISTRY',
      '02_ACTIVE_PROJECTS',
      '03_PROJECT_DNA'
    ],
    files: {
      'README.md': '# 10_PROJECT_INTELLIGENCE\n\nProject metadata and Project DNA.'
    }
  },
  '11_KNOWLEDGE_GRAPH': {
    dirs: [
      '01_GRAPH_CORE'
    ],
    files: {
      'README.md': '# 11_KNOWLEDGE_GRAPH\n\nEcosystem knowledge graph.'
    }
  },
  '12_SYSTEM_LOGS': {
    dirs: [
      '01_AUDIT_LOGS',
      '02_EXECUTION_LOGS'
    ],
    files: {
      'README.md': '# 12_SYSTEM_LOGS\n\nAudit logging and runtime log storage.'
    }
  },
  '13_BACKUPS': {
    dirs: [
      '01_SNAPSHOTS'
    ],
    files: {
      'README.md': '# 13_BACKUPS\n\nEcosystem backup snapshots.'
    }
  },
  '14_SANDBOX': {
    files: {
      'README.md': '# 14_SANDBOX\n\nSafe execution zone.'
    }
  },
  '15_RECOVERY': {
    files: {
      'README.md': '# 15_RECOVERY\n\nRecovery workflows and controllers.'
    }
  },
  '16_CONFIG': {
    files: {
      'README.md': '# 16_CONFIG\n\nConfiguration management.'
    }
  },
  '17_SECRETS': {
    files: {
      'README.md': '# 17_SECRETS\n\nSecure secrets folder.'
    }
  },
  'dashboard': {
    files: {
      'README.md': '# dashboard\n\nWeb dashboard Command center.'
    }
  }
};

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
    console.log(`Created: ${path.relative(root, safePath)}`);
  }
}

// Ensure root scripts folder exists
ensureDir(path.resolve(root, 'scripts'));

// Process structure
for (const [folder, config] of Object.entries(structure)) {
  const folderPath = validatePath(path.resolve(root, folder));
  ensureDir(folderPath);

  if (config.dirs) {
    for (const subDir of config.dirs) {
      const subDirPath = validatePath(path.resolve(folderPath, subDir));
      ensureDir(subDirPath);
      // Write .gitkeep inside empty subdirectories
      const gitkeepPath = validatePath(path.resolve(subDirPath, '.gitkeep'));
      fs.writeFileSync(gitkeepPath, '');
    }
  }

  if (config.files) {
    for (const [fileName, fileContent] of Object.entries(config.files)) {
      const filePath = validatePath(path.resolve(folderPath, fileName));
      fs.writeFileSync(filePath, fileContent);
    }
  }
}


console.log('Ecosystem scaffold generation complete.');
