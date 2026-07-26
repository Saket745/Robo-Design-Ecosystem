const fs = require('fs');
const path = require('path');
const Validator = require('../08_VALIDATION/00_VALIDATION_CORE/validator');

const root = path.resolve(__dirname, '..');
let exitCode = 0;

function logError(message) {
  console.error(`\x1b[31m[ERROR] ${message}\x1b[0m`);
  exitCode = 1;
}

function logSuccess(message) {
  console.log(`\x1b[32m[PASS] ${message}\x1b[0m`);
}

function getExitCode() {
  return exitCode;
}

function resetExitCode() {
  exitCode = 0;
}

// 1. Basic check for core files
function assertFileExists(filePath, description) {
  const resolved = path.resolve(root, filePath);
  if (!fs.existsSync(resolved)) {
    logError(`${description} missing: ${filePath}`);
    return false;
  }
  logSuccess(`${description} exists: ${filePath}`);
  return true;
}

function runEcosystemValidation() {
  console.log('--- Phase 1: Verification of Core Foundation ---');
  const hasDna = assertFileExists('00_CORE_BRAIN/SYSTEM_DNA.yaml', 'System DNA config');
  const hasManifest = assertFileExists('02_SKILLS/MANIFEST.yaml', 'Skills Manifest');
  const hasConfig = assertFileExists('16_CONFIG/workspace.config.yaml', 'Workspace Config');

  // 2. Instantiate Validator Core Engine
  console.log('\n--- Phase 2: Running Validator Core Engine ---');
  const validator = new Validator();

  // Run schema, naming, and dependency validations on skills and config
  console.log('Executing validation pipeline (schemas, naming, dependencies, boundaries)...');
  const pipelineResult = validator.runPipeline(root, ['schema', 'naming', 'dependencies']);

  if (pipelineResult.pass) {
    logSuccess('Validation pipeline checks passed successfully.');
  } else {
    pipelineResult.errors.forEach(err => {
      logError(err);
    });
  }

  // 3. Security Hygiene Check (Local-first sandbox rules)
  console.log('\n--- Phase 3: Running Security Hygiene Checks ---');
  const forbiddenPatterns = [
    /^\.env$/,
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

  // 4. Summarize results
  if (exitCode === 0) {
    console.log('\n\x1b[32mEcosystem validation succeeded! All components verified.\x1b[0m');
  } else {
    console.error('\n\x1b[31mEcosystem validation failed. Please fix errors listed above.\x1b[0m');
  }

  process.exit(exitCode);
}

if (require.main === module) {
  runEcosystemValidation();
}

module.exports = {
  logError,
  logSuccess,
  getExitCode,
  resetExitCode,
  assertFileExists
};
