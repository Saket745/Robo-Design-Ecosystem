const test = require('node:test');
const assert = require('node:assert');

// Require dependencies before demo so we can override/mock them
const stateManager = require('./state_manager');
const semanticRouter = require('../02_SKILLS/02_AGENTIC_ROUTING/semantic_router');
const orchestrator = require('../03_SUBAGENTS/01_COORDINATION_AGENTS/master_orchestrator/orchestrator');
const validationPipeline = require('../08_VALIDATION/00_VALIDATION_CORE/validation_pipeline');
const logger = require('./logger');

// Require the actual module to test
const demo = require('./demo');

test('scripts/demo.js runDemo unit tests', async (t) => {
  // Keep original references
  const originalLogEvent = logger.logEvent;
  const originalOrchestrateDocs = orchestrator.orchestrateDocs;
  const originalRouteQuery = semanticRouter.routeQuery;
  const originalRunValidation = validationPipeline.runValidation;
  const originalGetState = stateManager.getState;
  const originalConsoleLog = console.log;
  const originalConsoleClear = console.clear;
  const originalSetTimeout = global.setTimeout;

  // Set up test spies and stubs
  let loggedEvents = [];
  let consoleOutputs = [];
  let validationPasses = true;

  logger.logEvent = (event) => {
    loggedEvents.push(event);
  };

  orchestrator.orchestrateDocs = async (docs) => {
    return { success: true, conflicts: [], consolidatedConfig: 'mock_path' };
  };

  semanticRouter.routeQuery = (query) => {
    return {
      success: true,
      confidence_score: 0.95,
      matched_skill: {
        name: 'Inverse Kinematics',
        entrypoint: 'kinematics_controller.py'
      }
    };
  };

  validationPipeline.runValidation = (type, constraints) => {
    return {
      passed: validationPasses,
      errors: validationPasses ? [] : ['Mock safety constraint violated']
    };
  };

  stateManager.getState = () => {
    return { test: 'mock_state' };
  };

  console.log = (...args) => {
    consoleOutputs.push(args.join(' '));
  };

  console.clear = () => {
    consoleOutputs.push('[clear]');
  };

  // Mock setTimeout to run instantaneously
  global.setTimeout = (fn, ms) => originalSetTimeout(fn, 0);

  // Helper to reset recording arrays
  function resetTestState() {
    loggedEvents = [];
    consoleOutputs = [];
  }

  // Restore original behavior after all tests
  t.after(() => {
    logger.logEvent = originalLogEvent;
    orchestrator.orchestrateDocs = originalOrchestrateDocs;
    semanticRouter.routeQuery = originalRouteQuery;
    validationPipeline.runValidation = originalRunValidation;
    stateManager.getState = originalGetState;
    console.log = originalConsoleLog;
    console.clear = originalConsoleClear;
    global.setTimeout = originalSetTimeout;
  });

  await t.test('should run the entire demo successfully on happy path', async () => {
    resetTestState();
    validationPasses = true;

    await demo.runDemo();

    // Check console clear and headers
    assert.ok(consoleOutputs.some(line => line.includes('[clear]')));
    assert.ok(consoleOutputs.some(line => line.includes('ANTIGRAVITY AUTONOMOUS ECOSYSTEM DEMO RUN')));

    // Check STEP 2
    assert.ok(consoleOutputs.some(line => line.includes('STEP 2: Document Intelligence Intake')));
    assert.ok(consoleOutputs.some(line => line.includes('Consolidated configurations written to active projects state.')));

    // Check STEP 3
    assert.ok(consoleOutputs.some(line => line.includes('STEP 3: Agentic Routing & Search')));
    assert.ok(consoleOutputs.some(line => line.includes('Matched Skill Entrypoint:')));

    // Check STEP 4
    assert.ok(consoleOutputs.some(line => line.includes('STEP 4: Execution Planning (DAG Engine)')));
    assert.ok(consoleOutputs.some(line => line.includes('Execution Order of Engineering Phases:')));
    assert.ok(consoleOutputs.some(line => line.includes('Requirements ➔ Architecture ➔ CAD ➔ PCB ➔ Firmware ➔ Simulation ➔ Validation')));

    // Check STEP 5
    assert.ok(consoleOutputs.some(line => line.includes('STEP 5: Robotics Safety Validation Pipeline')));
    assert.ok(consoleOutputs.some(line => line.includes('PASS: All safety constraints and watchdog protections verified.')));

    // Check STEP 6 and finish
    assert.ok(consoleOutputs.some(line => line.includes('STEP 6: Persistent State Audit')));
    assert.ok(consoleOutputs.some(line => line.includes('Current Project State:')));
    assert.ok(consoleOutputs.some(line => line.includes('DEMO COMPLETED SUCCESSFULLY')));

    // Assert correct logger events were triggered
    const eventTypes = loggedEvents.map(e => e.event);
    assert.deepStrictEqual(eventTypes, [
      'demo_start',
      'document_intake',
      'intent_routing',
      'dag_sort',
      'safety_check'
    ]);

    // Check trace_id propagation
    loggedEvents.forEach(e => {
      assert.strictEqual(e.trace_id, '82c527e8-103b-472e-aa0d-1fad3d253506');
    });
  });

  await t.test('should handle safety validation failure correctly', async () => {
    resetTestState();
    validationPasses = false;

    await demo.runDemo();

    // Assert that we printed the safety validation failure output
    assert.ok(consoleOutputs.some(line => line.includes('FAIL: Safety constraints violated.')));
    // Assert other steps still ran successfully up to completion
    assert.ok(consoleOutputs.some(line => line.includes('DEMO COMPLETED SUCCESSFULLY')));
  });
});
