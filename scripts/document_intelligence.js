const path = require('path');
const fs = require('fs');
const orchestrator = require('../03_SUBAGENTS/01_COORDINATION_AGENTS/master_orchestrator/orchestrator');

const root = path.resolve(__dirname, '..');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Antigravity Document Intelligence Engine');
    console.log('Usage: node document_intelligence.js <file1> <file2> ... <file7>');
    process.exit(1);
  }

  // Resolve absolute paths
  const resolvedPaths = args.map(arg => {
    const abs = path.resolve(arg);
    if (!fs.existsSync(abs)) {
      console.error(`Error: File not found: ${arg}`);
      process.exit(1);
    }
    return abs;
  });

  try {
    const result = await orchestrator.orchestrateDocs(resolvedPaths);
    console.log('\n==================================================');
    console.log('Document Intelligence Execution Succeeded!');
    console.log('Processed:', resolvedPaths.map(p => path.basename(p)));
    console.log('Conflicts:', result.conflicts.length ? result.conflicts : 'None');
    console.log('Consolidated State File:', result.consolidatedConfig);
    console.log('==================================================');
  } catch (err) {
    console.error('Document intelligence execution failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
