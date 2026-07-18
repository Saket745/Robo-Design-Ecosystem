const fs = require('fs');
const path = require('path');
const { parseYAML } = require('./yaml_parser');

const root = path.resolve(__dirname, '../..');

class Validator {
  constructor() {
    this.schemasDir = path.resolve(__dirname, 'schemas');
    this.rulesDir = path.resolve(__dirname, 'rules');
    
    // Load rules
    this.archRules = this.loadJSON(path.join(this.rulesDir, 'architecture_rules.json')) || {};
    this.namingRules = this.loadJSON(path.join(this.rulesDir, 'naming_rules.json')) || {};
  }

  // Helper to load and parse JSON safely
  loadJSON(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      return null;
    }
  }

  // Custom YAML parser (zero dependencies)
  parseYAML(content) {
    return parseYAML(content);
  }

  // Recursive JSON Schema validator
  validateSchema(data, schemaPathOrObject) {
    let schema = schemaPathOrObject;
    if (typeof schemaPathOrObject === 'string') {
      const fullPath = path.resolve(this.schemasDir, schemaPathOrObject);
      schema = this.loadJSON(fullPath);
      if (!schema) {
        return { pass: false, errors: [`Schema file not found or malformed: ${schemaPathOrObject}`] };
      }
    }

    const errors = [];
    const validate = (val, sch, currentPath = '') => {
      if (!sch) return;

      const expectedType = sch.type;
      if (expectedType) {
        if (expectedType === 'array') {
          if (!Array.isArray(val)) {
            errors.push(`Property '${currentPath}' must be of type 'array', got '${typeof val}'`);
            return;
          }
          if (sch.items) {
            val.forEach((item, index) => {
              validate(item, sch.items, `${currentPath}[${index}]`);
            });
          }
        } else if (expectedType === 'object') {
          if (typeof val !== 'object' || val === null || Array.isArray(val)) {
            errors.push(`Property '${currentPath}' must be of type 'object', got '${typeof val}'`);
            return;
          }
          if (sch.required && Array.isArray(sch.required)) {
            sch.required.forEach(reqKey => {
              if (val[reqKey] === undefined) {
                errors.push(`Property '${currentPath ? currentPath + '.' : ''}${reqKey}' is required`);
              }
            });
          }
          if (sch.properties) {
            for (const propKey in sch.properties) {
              if (val[propKey] !== undefined) {
                validate(val[propKey], sch.properties[propKey], `${currentPath ? currentPath + '.' : ''}${propKey}`);
              }
            }
          }
        } else if (expectedType === 'integer') {
          if (!Number.isInteger(val)) {
            errors.push(`Property '${currentPath}' must be of type 'integer', got '${typeof val}'`);
          }
        } else if (expectedType === 'number') {
          if (typeof val !== 'number' || isNaN(val)) {
            errors.push(`Property '${currentPath}' must be of type 'number', got '${typeof val}'`);
          }
        } else if (expectedType === 'boolean') {
          if (typeof val !== 'boolean') {
            errors.push(`Property '${currentPath}' must be of type 'boolean', got '${typeof val}'`);
          }
        } else if (expectedType === 'string') {
          if (typeof val !== 'string') {
            errors.push(`Property '${currentPath}' must be of type 'string', got '${typeof val}'`);
          } else if (sch.pattern) {
            const regex = new RegExp(sch.pattern);
            if (!regex.test(val)) {
              errors.push(`Property '${currentPath}' value '${val}' does not match pattern '${sch.pattern}'`);
            }
          }
        }
      }
    };

    validate(data, schema);
    return { pass: errors.length === 0, errors };
  }

  // Validate naming convention of a file or folder path
  validateNaming(filePath) {
    const relative = path.relative(root, filePath);
    const parts = relative.split(path.sep);
    const errors = [];

    // Verify directories in path
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1 && part.includes('.');
      
      if (!isFile) {
        // Directory check
        if (i === 0) {
          // Top level directory (e.g. 00_CORE_BRAIN)
          const regex = new RegExp(this.namingRules.directory_patterns.top_level);
          // Allow scripts, dashboard, node_modules, etc. at root level
          const allowedRootDirs = ['scripts', 'dashboard', 'node_modules', '.git', 'robot', 'engine'];
          if (!regex.test(part) && !allowedRootDirs.includes(part) && !part.startsWith('.')) {
            errors.push(`Root directory '${part}' must match pattern '${this.namingRules.directory_patterns.top_level}'`);
          }
        } else {
          // Submodule directory check
          const isSkillDomain = parts[0] === '02_SKILLS' && parts[1] === '04_SKILL_DOMAINS';
          if (isSkillDomain) {
            // Only check lowercase for the skill folder itself (index i === 3)
            if (i === 3) {
              const regex = new RegExp(this.namingRules.directory_patterns.domains);
              if (!regex.test(part)) {
                errors.push(`Skill domain subdirectory '${part}' must match pattern '${this.namingRules.directory_patterns.domains}'`);
              }
            }
          } else {
            const regex = new RegExp(this.namingRules.directory_patterns.submodules);
            if (!regex.test(part)) {
              errors.push(`Directory '${part}' must match pattern '${this.namingRules.directory_patterns.submodules}'`);
            }
          }
        }
      } else {
        // File checks
        const ext = path.extname(part).toLowerCase();
        let pattern = null;
        if (ext === '.js') pattern = this.namingRules.file_patterns.javascript;
        else if (ext === '.py') pattern = this.namingRules.file_patterns.python;
        else if (ext === '.json') pattern = this.namingRules.file_patterns.json;
        else if (ext === '.yaml' || ext === '.yml') pattern = this.namingRules.file_patterns.yaml;
        else if (ext === '.md') pattern = this.namingRules.file_patterns.markdown;

        if (pattern) {
          const regex = new RegExp(pattern);
          if (!regex.test(part)) {
            errors.push(`File name '${part}' does not conform to naming standards pattern '${pattern}'`);
          }
        }
      }
    }

    return { pass: errors.length === 0, errors };
  }

  // Validate dependencies (Cycle check + Architecture Boundary Check)
  validateDependencies(modulePath = '') {
    const errors = [];
    const warnings = [];

    // 1. Dependency Cycle check for skills
    const skillsBaseDir = path.resolve(root, '02_SKILLS/04_SKILL_DOMAINS/ROBOTICS_ENGINEERING');
    const skillsList = [];
    if (fs.existsSync(skillsBaseDir)) {
      fs.readdirSync(skillsBaseDir).forEach(dir => {
        if (fs.statSync(path.join(skillsBaseDir, dir)).isDirectory()) {
          skillsList.push(dir);
        }
      });
    }

    const adj = new Map();
    skillsList.forEach(skill => {
      const depYamlPath = path.join(skillsBaseDir, skill, 'dependencies.yaml');
      if (fs.existsSync(depYamlPath)) {
        try {
          const parsed = this.parseYAML(fs.readFileSync(depYamlPath, 'utf8'));
          const deps = Array.isArray(parsed ? parsed.dependencies : null) ? parsed.dependencies : [];
          adj.set(skill, new Set(deps));
        } catch (e) {
          errors.push(`Failed to parse dependencies for skill '${skill}': ${e.message}`);
        }
      } else {
        adj.set(skill, new Set());
      }
    });

    // Run DFS cycle detection
    const visited = new Map(); // 0: unvisited, 1: visiting, 2: visited
    skillsList.forEach(skill => visited.set(skill, 0));

    const detectCycle = (node) => {
      visited.set(node, 1);
      const deps = adj.get(node) || new Set();
      for (const dep of deps) {
        if (!visited.has(dep)) continue; // ignore non-existent dependencies (these are reported elsewhere)
        if (visited.get(dep) === 1) {
          return true;
        }
        if (visited.get(dep) === 0) {
          if (detectCycle(dep)) return true;
        }
      }
      visited.set(node, 2);
      return false;
    };

    for (const skill of skillsList) {
      if (visited.get(skill) === 0) {
        if (detectCycle(skill)) {
          errors.push(`Dependency Cycle detected in skills dependencies graph involving skill '${skill}'`);
          break;
        }
      }
    }

    // 2. Architecture Boundary check for static require imports
    const tierMap = this.archRules.tiers || {};
    const getFileTier = (filePath) => {
      const relative = path.relative(root, filePath);
      const parts = relative.split(path.sep);
      const firstPart = parts[0];
      return tierMap[firstPart] || null;
    };

    const walk = (dir) => {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules' || file === '.git' || file === '17_SECRETS' || file === '13_BACKUPS' || file === 'dist' || file.startsWith('.')) {
          return;
        }
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (file.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const sourceTier = getFileTier(fullPath);
          if (sourceTier === null) return; // Not part of a tier, skip

          // Regex to parse require calls
          const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
          let match;
          while ((match = requireRegex.exec(content)) !== null) {
            const reqPath = match[1];
            if (reqPath.startsWith('.')) {
              const targetFullPath = path.resolve(path.dirname(fullPath), reqPath);
              const targetTier = getFileTier(targetFullPath);
              
              if (targetTier !== null && sourceTier > targetTier) {
                // Higher tier index = lower layer. E.g. Tier 4 Support (sourceTier) importing Tier 3 (targetTier) is upward/forbidden.
                errors.push(`Architecture Boundary Violation in '${path.relative(root, fullPath)}': ` +
                  `Lower tier module (Tier ${sourceTier}) statically imports higher tier module (Tier ${targetTier}) via '${reqPath}'`);
              }
            }
          }
        }
      });
    };

    try {
      walk(root);
    } catch (e) {
      errors.push(`Failed to perform static architecture boundary check: ${e.message}`);
    }

    return { pass: errors.length === 0, errors, warnings };
  }

  // Execute full validation pipeline on a target
  runPipeline(target, rulesets = ['schema', 'naming', 'dependencies']) {
    const results = {
      pass: true,
      errors: [],
      warnings: []
    };

    const runChecks = (t) => {
      // 1. Naming convention check
      if (rulesets.includes('naming')) {
        const namingRes = this.validateNaming(t);
        if (!namingRes.pass) {
          results.pass = false;
          results.errors.push(...namingRes.errors);
        }
      }

      // 2. Schema verification (for yaml/json/configs)
      if (rulesets.includes('schema')) {
        const ext = path.extname(t).toLowerCase();
        if (ext === '.yaml' || ext === '.yml' || ext === '.json') {
          const basename = path.basename(t);
          let schemaFile = null;
          let parsedData = null;

          try {
            const raw = fs.readFileSync(t, 'utf8');
            parsedData = ext === '.json' ? JSON.parse(raw) : this.parseYAML(raw);
          } catch (e) {
            results.pass = false;
            results.errors.push(`Failed to parse config file '${path.relative(root, t)}': ${e.message}`);
          }

          if (parsedData) {
            if (basename === 'workspace.config.yaml') {
              schemaFile = 'config_schema.json';
            } else if (basename === 'dependencies.yaml') {
              schemaFile = 'skill_schema.json';
            } else if (basename.endsWith('_agent.json') || basename.endsWith('_agent.yaml')) {
              schemaFile = 'agent_schema.json';
            }

            if (schemaFile) {
              const schemaRes = this.validateSchema(parsedData, schemaFile);
              if (!schemaRes.pass) {
                results.pass = false;
                results.errors.push(...schemaRes.errors.map(err => `Schema Error in '${path.relative(root, t)}': ${err}`));
              }
            }
          }
        }
      }
    };

    if (fs.existsSync(target)) {
      const stat = fs.statSync(target);
      if (stat.isDirectory()) {
        const walkTarget = (dir) => {
          fs.readdirSync(dir).forEach(f => {
            const p = path.join(dir, f);
            if (f === 'node_modules' || f === '.git' || f === '17_SECRETS' || f === '13_BACKUPS' || f === 'dist' || f.startsWith('.')) return;
            const s = fs.statSync(p);
            if (s.isDirectory()) walkTarget(p);
            else runChecks(p);
          });
        };
        walkTarget(target);
      } else {
        runChecks(target);
      }
    } else {
      results.pass = false;
      results.errors.push(`Validation target does not exist: ${target}`);
    }

    // 3. Global dependencies and boundaries check (run once at the end)
    if (rulesets.includes('dependencies')) {
      const depRes = this.validateDependencies();
      if (!depRes.pass) {
        results.pass = false;
        results.errors.push(...depRes.errors);
      }
      results.warnings.push(...depRes.warnings);
    }

    return results;
  }
}

module.exports = Validator;
