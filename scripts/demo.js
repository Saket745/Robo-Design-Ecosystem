const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const stateManager = require('./state_manager');
const semanticRouter = require('../02_SKILLS/02_AGENTIC_ROUTING/semantic_router');
const orchestrator = require('../03_SUBAGENTS/01_COORDINATION_AGENTS/master_orchestrator/orchestrator');
const DAGEngine = require('../09_EXECUTION_ENGINE/02_DAG_ENGINE/dag_engine');
const validationPipeline = require('../08_VALIDATION/00_VALIDATION_CORE/validation_pipeline');
const logger = require('./logger');

const traceId = '82c527e8-103b-472e-aa0d-1fad3d253506';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  console.clear();
  console.log('\x1b[36m======================================================================\x1b[0m');
  console.log('\x1b[36m             ANTIGRAVITY AUTONOMOUS ECOSYSTEM DEMO RUN                \x1b[0m');
  console.log('\x1b[36m======================================================================\x1b[0m\n');

  // STEP 1: State Initialization
  logger.logEvent({
    event: 'demo_start',
    trace_id: traceId,
    severity: 'info',
    message: 'Initializing Antigravity platform demo execution.'
  });
  await sleep(1000);

  // STEP 2: Document Intake and Parameter Extraction
  console.log('\n\x1b[33m--- STEP 2: Document Intelligence Intake ---\x1b[0m');
  const sampleDocs = [
    path.join(root, '..', '_extracted_text', 'Robot Model.txt'),
    path.join(root, '..', '_extracted_text', 'Research1.txt'),
    path.join(root, '..', '_extracted_text', 'Research4.txt')
  ];
  
  logger.logEvent({
    event: 'document_intake',
    trace_id: traceId,
    message: `Orchestrating parallel parsing of ${sampleDocs.length} spec documents.`
  });

  const orchestrateResult = await orchestrator.orchestrateDocs(sampleDocs);
  console.log(`\x1b[32m✔ Consolidated configurations written to active projects state.\x1b[0m`);
  await sleep(1500);

  // STEP 3: Semantic Capability Router
  console.log('\n\x1b[33m--- STEP 3: Agentic Routing & Search ---\x1b[0m');
  const searchQuery = 'Compute inverse kinematics trajectories for quadruped limbs';
  console.log(`Query: "${searchQuery}"`);
  
  const routeResult = semanticRouter.routeQuery(searchQuery);
  logger.logEvent({
    event: 'intent_routing',
    trace_id: traceId,
    message: `Routing semantic intent. Best Match: ${routeResult.matched_skill.name} (Confidence: ${routeResult.confidence_score * 100}%)`
  });
  console.log(`Matched Skill Entrypoint: \x1b[34m${routeResult.matched_skill.entrypoint}\x1b[0m`);
  await sleep(1500);

  // STEP 4: DAG Generation and Topological Sort
  console.log('\n\x1b[33m--- STEP 4: Execution Planning (DAG Engine) ---\x1b[0m');
  const dag = new DAGEngine();
  dag.addNode('Requirements', []);
  dag.addNode('Architecture', ['Requirements']);
  dag.addNode('CAD', ['Architecture']);
  dag.addNode('PCB', ['Architecture']);
  dag.addNode('Firmware', ['Architecture']);
  dag.addNode('Simulation', ['CAD', 'Firmware']);
  dag.addNode('Validation', ['Simulation', 'PCB']);

  const order = dag.topologicalSort();
  logger.logEvent({
    event: 'dag_sort',
    trace_id: traceId,
    message: 'Topological sort completed. Parallel-safe sequence determined.'
  });
  console.log('Execution Order of Engineering Phases:');
  console.log(`\x1b[32m${order.join(' ➔ ')}\x1b[0m`);
  await sleep(1500);

  // STEP 5: Physical Safety Validation
  console.log('\n\x1b[33m--- STEP 5: Robotics Safety Validation Pipeline ---\x1b[0m');
  const targetConstraints = {
    trace_id: traceId,
    motor_runaway_protection: true,
    max_cell_voltage: 4.2,
    min_cell_voltage: 3.1,
    max_temperature_c: 62,
    emergency_stop_implemented: true
  };

  logger.logEvent({
    event: 'safety_check',
    trace_id: traceId,
    message: 'Verifying quadruped battery limits, temperature coefficients, and E-Stop loops.'
  });
  const validationResult = validationPipeline.runValidation('robotics_safety', targetConstraints);
  
  if (validationResult.passed) {
    console.log('\x1b[32m✔ PASS: All safety constraints and watchdog protections verified.\x1b[0m');
  } else {
    console.log('\x1b[31m❌ FAIL: Safety constraints violated.\x1b[0m');
  }
  await sleep(1500);

  // STEP 6: Final State Audit
  console.log('\n\x1b[33m--- STEP 6: Persistent State Audit ---\x1b[0m');
  const finalState = stateManager.getState();
  console.log('Current Project State:');
  console.log(JSON.stringify(finalState, null, 2));

  console.log('\n\x1b[36m======================================================================\x1b[0m');
  console.log('\x1b[36m                    DEMO COMPLETED SUCCESSFULLY                       \x1b[0m');
  console.log('\x1b[36m======================================================================\x1b[0m');
}

runDemo().catch(err => {
  console.error('Demo run failed:', err);
});
