const fs = require('fs');
const path = require('path');
const stateManager = require('../../../scripts/state_manager');
const semanticRouter = require('../../../02_SKILLS/02_AGENTIC_ROUTING/semantic_router');

const root = path.resolve(__dirname, '../../../..');
const activeProjectsDir = path.join(root, 'antigravity-platform', '10_PROJECT_INTELLIGENCE', '02_ACTIVE_PROJECTS');

function validatePath(targetPath, baseDir) {
  const resolved = path.normalize(path.resolve(targetPath));
  const resolvedBase = path.normalize(path.resolve(baseDir || root));
  const safeBase = resolvedBase.endsWith(path.sep) ? resolvedBase : resolvedBase + path.sep;
  if (!resolved.startsWith(safeBase) && resolved !== resolvedBase) {
    throw new Error(`Security Error: Path '${resolved}' is outside allowed base '${resolvedBase}'.`);
  }
  return resolved;
}

// Helper to extract text from simple file types (docx/pdf reading fallback to txt/md reading)
function parseTextFile(filePath) {
  try {
    const safePath = validatePath(filePath);
    return fs.readFileSync(safePath, 'utf8');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return '';
  }
}

// Simple rule-based document classification and parameter extraction
function analyzeDocument(fileName, content) {
  const lowercaseContent = content.toLowerCase();
  let type = "unknown";
  const params = {};

  // Classification
  if (lowercaseContent.includes("gait") || lowercaseContent.includes("kinematics") || lowercaseContent.includes("locomotion")) {
    type = "research_paper_locomotion";
  } else if (lowercaseContent.includes("pinout") || lowercaseContent.includes("schematic") || lowercaseContent.includes("voltage") || lowercaseContent.includes("pcb")) {
    type = "electronics_datasheet";
  } else if (lowercaseContent.includes("cad") || lowercaseContent.includes("chassis") || lowercaseContent.includes("geometry") || lowercaseContent.includes("dimensions")) {
    type = "mechanical_spec";
  } else if (lowercaseContent.includes("motor") || lowercaseContent.includes("torque") || lowercaseContent.includes("actuator")) {
    type = "actuator_spec";
  }

  // Key-value extraction using regex
  const voltageMatch = content.match(/(?:voltage|operating voltage|power|vcc)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*v/i);
  if (voltageMatch) params.voltage = parseFloat(voltageMatch[1]);

  const lengthMatch = content.match(/(?:leg length|height|width|dimension|chassis)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:cm|mm)/i);
  if (lengthMatch) params.dimension = lengthMatch[0];

  const motorTypeMatch = content.match(/(?:brushless|bldc|servo|stepper|motor type)\s*[:=]?\s*([a-zA-Z0-9\- ]+)/i);
  if (motorTypeMatch) params.motor_type = motorTypeMatch[1].trim();

  const batteryMatch = content.match(/(?:battery|li-ion|lipo|capacity)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mah|ah|v)/i);
  if (batteryMatch) params.power_source = batteryMatch[0].trim();

  return { fileName, type, params };
}

// Validation Conflict Checker
function runConflictCheck(aggregatedParams) {
  const conflicts = [];
  
  // Check if multiple sources specified different voltages
  const paramsList = aggregatedParams instanceof Map ? Array.from(aggregatedParams.values()) : Object.values(aggregatedParams);
  const voltages = paramsList.map(p => p.voltage).filter(Boolean);
  if (voltages.length > 1) {
    const uniqueVoltages = [...new Set(voltages)];
    if (uniqueVoltages.length > 1) {
      conflicts.push(`Voltage conflict detected across documents: [${uniqueVoltages.join('V, ')}V]`);
    }
  }

  // Check if battery voltage matches MCU voltage levels if any discrepancy
  return conflicts;
}

async function orchestrateDocs(filePaths) {
  console.log(`[Orchestrator] Starting processing of ${filePaths.length} documents...`);
  
  if (filePaths.length > 7) {
    console.warn(`[Orchestrator] Warning: Limit of 7 parallel documents exceeded. Truncating to first 7.`);
    filePaths = filePaths.slice(0, 7);
  }

  const analysisPromises = filePaths.map(async (filePath) => {
    const fileName = path.basename(filePath);
    const content = parseTextFile(filePath);
    return analyzeDocument(fileName, content);
  });

  const results = await Promise.all(analysisPromises);
  
  // Aggregate parameters
  const aggregatedParams = new Map();
  const processedDocs = [];
  const activatedSkills = new Set();

  results.forEach(res => {
    processedDocs.push(res.fileName);
    aggregatedParams.set(res.fileName, res.params);

    // Call semantic router to suggest skills for this document type
    const routeRes = semanticRouter.routeQuery(`Find skills for ${res.type}`);
    if (routeRes.success) {
      activatedSkills.add(routeRes.matched_skill.id);
      routeRes.dependencies_to_load.forEach(dep => activatedSkills.add(dep));
    }
  });

  // Run Conflict Check
  const conflicts = runConflictCheck(aggregatedParams);
  if (conflicts.length > 0) {
    console.error(`[Orchestrator] Conflicts found during validation!`);
    conflicts.forEach(c => console.error(` - ${c}`));
  }

  // Ensure active projects directory exists
  const safeActiveDir = validatePath(activeProjectsDir);
  if (!fs.existsSync(safeActiveDir)) {
    fs.mkdirSync(safeActiveDir, { recursive: true });
  }

  // Write consolidated config
  const configPath = validatePath(path.join(safeActiveDir, 'consolidated_config.json'));
  fs.writeFileSync(configPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    documents: processedDocs,
    parameters: Object.fromEntries(aggregatedParams),
    conflicts: conflicts
  }, null, 2), 'utf8');

  // Update central state
  const stateUpdates = {
    docs_processed: processedDocs,
    skills_activated: [...activatedSkills],
    completion_map: {
      scaffold: 1.0,
      core_brain: 1.0,
      global_rules: 1.0,
      skills: 0.5,
      subagents: 0.5,
      memory: 0.2
    }
  };
  stateManager.updateState(stateUpdates);

  console.log(`[Orchestrator] Consolidated config generated at ${path.relative(root, configPath)}`);
  return {
    success: true,
    conflicts,
    consolidatedConfig: configPath
  };
}

module.exports = {
  orchestrateDocs
};

// Direct Execution CLI
if (require.main === module) {
  const fileArgs = process.argv.slice(2);
  if (fileArgs.length === 0) {
    console.log('Usage: node orchestrator.js <doc1> <doc2> ... <doc7>');
  } else {
    orchestrateDocs(fileArgs).then(res => {
      console.log('Orchestration finished:', res);
    }).catch(err => {
      console.error('Orchestration failed:', err);
    });
  }
}
