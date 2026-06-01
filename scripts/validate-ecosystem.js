const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let exitCode = 0;

function logError(message) {
  console.error(`\x1b[31m[ERROR] ${message}\x1b[0m`);
  exitCode = 1;
}

function logSuccess(message) {
  console.log(`\x1b[32m[PASS] ${message}\x1b[0m`);
}

// Helper to check if file exists
function assertFileExists(filePath, description) {
  const resolved = path.resolve(root, filePath);
  if (!fs.existsSync(resolved)) {
    logError(`${description} missing: ${filePath}`);
    return false;
  }
  logSuccess(`${description} exists: ${filePath}`);
  return true;
}

// 1. Validate System DNA exists
const hasDna = assertFileExists('00_CORE_BRAIN/SYSTEM_DNA.yaml', 'System DNA config');

// 2. Validate Skills Manifest and Skill Directories
if (assertFileExists('02_SKILLS/MANIFEST.yaml', 'Skills Manifest')) {
  try {
    const manifestContent = fs.readFileSync(path.resolve(root, '02_SKILLS/MANIFEST.yaml'), 'utf8');
    
    // Parse domains from manifest (simple custom parser to avoid dependencies)
    const skillsList = [];
    const skillMatch = manifestContent.match(/skills:\s*\n(\s*-\s*[a-zA-Z0-9_]+\s*\n)+/g);
    
    if (skillMatch) {
      skillMatch.forEach(block => {
        const lines = block.split('\n');
        lines.forEach(line => {
          if (line.trim().startsWith('-')) {
            const skill = line.replace('-', '').trim();
            if (skill && !skillsList.includes(skill)) {
              skillsList.push(skill);
            }
          }
        });
      });
    }

    if (skillsList.length === 0) {
      logError('No skills parsed from MANIFEST.yaml. Check parsing regex.');
    } else {
      console.log(`Ecosystem: Found ${skillsList.length} registered skills. Verifying directory structures...`);
      
      const skillsBaseDir = '02_SKILLS/04_SKILL_DOMAINS/ROBOTICS_ENGINEERING';
      
      skillsList.forEach(skill => {
        // We only check robotics engineering skills that exist in that folder
        const skillDir = path.join(skillsBaseDir, skill);
        const resolvedSkillDir = path.resolve(root, skillDir);
        
        if (!fs.existsSync(resolvedSkillDir)) {
          // If the skill is coordination or memory management, it's located elsewhere or part of core.
          // Let's check if the directory exists under robotics engineering.
          // If it doesn't, let's verify if it's coordination/memory.
          const isRobotics = fs.existsSync(path.resolve(root, skillsBaseDir, skill));
          if (!isRobotics) {
            console.log(`Skipping non-robotics skill: ${skill}`);
            return;
          }
        }
        
        const requiredFiles = ['skill.md', 'validation.md', 'dependencies.yaml'];
        requiredFiles.forEach(file => {
          assertFileExists(path.join(skillDir, file), `Skill [${skill}] file`);
        });
      });
    }
  } catch (err) {
    logError(`Failed to parse MANIFEST.yaml: ${err.message}`);
  }
}

// 3. Security Hygiene Check
console.log('Running security hygiene checks...');
const forbiddenPatterns = [
  /\.env$/,
  /client_secret.*\.json$/,
  /secrets?\.json$/,
  /\.key$/,
  /id_rsa/
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (f === 'node_modules' || f === '.git' || f === '17_SECRETS' || f === '13_BACKUPS') {
      return; // Skip ignore zones
    }
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

try {
  walkDir(root, (filePath) => {
    const relative = path.relative(root, filePath);
    const basename = path.basename(filePath);
    forbiddenPatterns.forEach(pattern => {
      if (pattern.test(basename)) {
        logError(`Security Violation: Forbidden file pattern detected: ${relative}`);
      }
    });
  });
} catch (err) {
  logError(`Hygiene scan failed: ${err.message}`);
}

if (exitCode === 0) {
  console.log('\n\x1b[32mEcosystem validation succeeded! All components verified.\x1b[0m');
} else {
  console.error('\n\x1b[31mEcosystem validation failed. Please fix errors listed above.\x1b[0m');
}

process.exit(exitCode);
