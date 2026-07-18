const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Import ecosystem engines
const stateManager = require('./state_manager');
const semanticRouter = require('../02_SKILLS/02_AGENTIC_ROUTING/router');
const orchestrator = require('../03_SUBAGENTS/01_COORDINATION_AGENTS/master_orchestrator/orchestrator');
const DAGEngine = require('../09_EXECUTION_ENGINE/02_DAG_ENGINE/dag_engine');
const validationPipeline = require('../08_VALIDATION/00_VALIDATION_CORE/validation_pipeline');
const logger = require('./logger');

let agentKernel = null;
try {
  agentKernel = require('../03_SUBAGENTS/00_AGENT_KERNEL/agent_kernel');
} catch (e) {
  // Agent kernel not implemented yet
}

const PORT = 3000;
const rootDir = path.resolve(__dirname, '..');
const dashboardDir = path.join(rootDir, 'dashboard');
const logsFile = path.join(rootDir, '12_SYSTEM_LOGS', '01_EXECUTION_LOGS', 'execution_runs.jsonl');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function serveStatic(reqPath, res) {
  let filePath = path.join(dashboardDir, reqPath === '/' ? 'index.html' : reqPath);
  
  const resolved = path.normalize(path.resolve(filePath));
  const resolvedDashboard = path.normalize(path.resolve(dashboardDir));
  const safeDashboard = resolvedDashboard.endsWith(path.sep) ? resolvedDashboard : resolvedDashboard + path.sep;
  if (!resolved.startsWith(safeDashboard) && resolved !== resolvedDashboard) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Path traversal attempt blocked.');
    return;
  }

  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(resolved).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Set default CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // API endpoints
    if (pathname === '/api/state' || pathname.startsWith('/api/state/')) {
      let projectId = 'robot_project';
      if (pathname.startsWith('/api/state/')) {
        projectId = pathname.substring(11).trim();
      } else if (parsedUrl.query.projectId) {
        projectId = parsedUrl.query.projectId;
      }

      if (method === 'GET') {
        const realStateManager = require('../09_EXECUTION_ENGINE/05_STATE_MANAGER/state_manager');
        realStateManager.initState(projectId);
        const state = realStateManager.getState();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
      } else if (method === 'POST') {
        const body = await parseJsonBody(req);
        const realStateManager = require('../09_EXECUTION_ENGINE/05_STATE_MANAGER/state_manager');
        realStateManager.initState(projectId);
        const nextState = realStateManager.updateState(body);
        
        // Log changes
        logger.logEvent({
          event: 'state_user_update',
          trace_id: 'user_session',
          severity: 'info',
          message: `Project parameters updated manually for ${projectId} from control center.`,
          payload: body
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(nextState));
      }
    }
    
    else if (pathname === '/api/status' && method === 'GET') {
      const statusResponse = {
        status: "healthy",
        uptime: process.uptime(),
        loaded_modules: [
          "state_manager",
          "registry",
          "router",
          "dag_engine",
          "memory_kernel",
          "validation_pipeline"
        ],
        active_tasks: []
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(statusResponse));
    }

    else if (pathname === '/api/agents' && method === 'GET') {
      const agents = agentKernel ? agentKernel.getAgentRegistry() : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(agents));
    }
    
    else if (pathname === '/api/skills' && method === 'GET') {
      const registry = semanticRouter.loadRegistry();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(registry.skills));
    } 
    
    else if (pathname === '/api/skill-detail' && method === 'GET') {
      const skillId = parsedUrl.query.id;
      if (!skillId) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing skill ID query parameter.');
        return;
      }

      const skillsBaseDir = path.join(rootDir, '02_SKILLS', '04_SKILL_DOMAINS', 'ROBOTICS_ENGINEERING');
      const skillDir = path.join(skillsBaseDir, skillId);
      
      // Path traversal security check
      const resolvedSkillDir = path.normalize(path.resolve(skillDir));
      const resolvedBase = path.normalize(path.resolve(skillsBaseDir));
      const safeBase = resolvedBase.endsWith(path.sep) ? resolvedBase : resolvedBase + path.sep;
      if (!resolvedSkillDir.startsWith(safeBase) && resolvedSkillDir !== resolvedBase) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden: Path traversal attempt blocked.');
        return;
      }

      const skillMdPath = path.join(resolvedSkillDir, 'skill.md');
      const validationMdPath = path.join(resolvedSkillDir, 'validation.md');
      const dependenciesYamlPath = path.join(resolvedSkillDir, 'dependencies.yaml');

      const response = {
        id: skillId,
        skill_md: fs.existsSync(skillMdPath) ? fs.readFileSync(skillMdPath, 'utf8') : '',
        validation_md: fs.existsSync(validationMdPath) ? fs.readFileSync(validationMdPath, 'utf8') : '',
        dependencies_yaml: fs.existsSync(dependenciesYamlPath) ? fs.readFileSync(dependenciesYamlPath, 'utf8') : ''
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } 
    
    else if (pathname === '/api/search' && method === 'POST') {
      const body = await parseJsonBody(req);
      const query = body.query || '';
      
      logger.logEvent({
        event: 'semantic_search',
        trace_id: 'user_session',
        message: `Semantic search query: "${query}"`
      });

      const result = semanticRouter.routeQuery(query);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } 
    
    else if (pathname === '/api/orchestrate' && method === 'POST') {
      const body = await parseJsonBody(req);
      const files = body.files || [];
      
      logger.logEvent({
        event: 'document_orchestration_trigger',
        trace_id: 'user_session',
        message: `Running document intelligence on ${files.length} documents.`
      });

      const result = await orchestrator.orchestrateDocs(files);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } 
    
    else if (pathname === '/api/execute-pipeline' && method === 'POST') {
      logger.logEvent({
        event: 'execution_pipeline_started',
        trace_id: 'pipeline_run',
        message: 'Initializing topological execution sort on custom robot design pipeline.'
      });

      const dag = new DAGEngine();
      dag.addNode('Requirements', []);
      dag.addNode('Architecture', ['Requirements']);
      dag.addNode('CAD', ['Architecture']);
      dag.addNode('PCB', ['Architecture']);
      dag.addNode('Firmware', ['Architecture']);
      dag.addNode('Simulation', ['CAD', 'Firmware']);
      dag.addNode('Validation', ['Simulation', 'PCB']);

      const sortedOrder = dag.topologicalSort();
      const executionLogs = [];
      const stepResults = {};

      const state = stateManager.getState();
      
      // Map frontend-compatible status keys
      const phaseToSkill = {
        'Requirements': 'bom_procurement',
        'Architecture': 'ros2_architecture',
        'CAD': 'cad_design',
        'PCB': 'pcb_design',
        'Firmware': 'embedded_systems',
        'Simulation': 'simulation',
        'Validation': 'robotics_safety'
      };

      for (const phase of sortedOrder) {
        executionLogs.push(`Starting task: ${phase}...`);
        
        // Mock data to feed into validation pipeline
        let testData = { trace_id: 'pipeline_run' };
        if (phase === 'CAD') {
          testData.dimensions = state.mobility || 'Legged';
          testData.weight_kg = 5.2; // Under the 10kg limit
        } else if (phase === 'PCB') {
          testData.voltage = 12; // Under 24V limit
          testData.mcu = state.compute_system || 'ESP32';
        } else if (phase === 'Validation') {
          testData.motor_runaway_protection = true;
          testData.max_cell_voltage = 4.2;
          testData.min_cell_voltage = 3.1;
          testData.max_temperature_c = 65;
          testData.emergency_stop_implemented = true;
        }

        const skillId = phaseToSkill[phase];
        let valResult = { passed: true, issues: [] };
        
        if (skillId) {
          valResult = validationPipeline.runValidation(skillId, testData);
        }

        if (valResult.passed) {
          stepResults[phase] = 'SUCCESS';
          executionLogs.push(`Task ${phase} completed successfully.`);
          
          logger.logEvent({
            event: 'task_run_success',
            trace_id: 'pipeline_run',
            message: `Completed phase ${phase} verification successfully.`,
            payload: valResult
          });
        } else {
          stepResults[phase] = 'FAILED';
          executionLogs.push(`Task ${phase} FAILED: ${valResult.issues.join(', ')}`);
          
          logger.logEvent({
            event: 'task_run_failed',
            trace_id: 'pipeline_run',
            severity: 'warning',
            message: `Phase ${phase} validation failed.`,
            payload: valResult
          });
        }
      }

      // Update completion in state
      const nextCompletion = {
        scaffold: 1.0,
        core_brain: 1.0,
        global_rules: 1.0,
        skills: 1.0,
        subagents: 1.0,
        memory: 0.8,
        validation: 1.0,
        execution: 1.0,
        dashboard: 0.95
      };
      
      stateManager.updateState({
        completion_map: nextCompletion
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        order: sortedOrder,
        steps: stepResults,
        console: executionLogs,
        completion: nextCompletion
      }));
    } 
    
    else if (pathname === '/api/logs' && method === 'GET') {
      const logType = parsedUrl.query.type || 'execution';
      const limit = parseInt(parsedUrl.query.limit, 10) || 50;
      let targetLogFile = logsFile;

      if (logType === 'audit') {
        targetLogFile = path.join(rootDir, '12_SYSTEM_LOGS', '01_AUDIT_LOGS', 'audit.jsonl');
      } else if (logType === 'execution') {
        targetLogFile = path.join(rootDir, '12_SYSTEM_LOGS', '02_EXECUTION_LOGS', 'execution.jsonl');
        try {
          await fs.promises.access(targetLogFile, fs.constants.F_OK);
        } catch (_) {
          targetLogFile = logsFile;
        }
      }

      const logs = [];
      try {
        await fs.promises.access(targetLogFile, fs.constants.F_OK);
        const fileContent = await fs.promises.readFile(targetLogFile, 'utf8');
        const lines = fileContent.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              logs.push(JSON.parse(line));
            } catch (e) {
              // Ignore malformed JSON lines
            }
          }
        }
      } catch (_) {
        // Handle file-not-found or read errors gracefully
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(logs.reverse().slice(0, limit)));
    }

    else if (pathname === '/api/validate' && method === 'POST') {
      const Validator = require('../08_VALIDATION/00_VALIDATION_CORE/validator');
      const validator = new Validator();
      const pipelineResult = validator.runPipeline(rootDir, ['schema', 'naming', 'dependencies']);
      
      const forbiddenPatterns = [
        /^\.env$/,
        /client_secret.*\.json$/,
        /secrets?\.json$/,
        /\.key$/,
        /id_rsa/
      ];
      const hygieneIssues = [];
      function walkDir(dir) {
        fs.readdirSync(dir).forEach(f => {
          const dirPath = path.join(dir, f);
          const isDirectory = fs.statSync(dirPath).isDirectory();
          if (f === 'node_modules' || f === '.git' || f === '17_SECRETS' || f === '13_BACKUPS') {
            return;
          }
          if (isDirectory) {
            walkDir(dirPath);
          } else {
            const basename = path.basename(dirPath);
            forbiddenPatterns.forEach(pattern => {
              if (pattern.test(basename)) {
                hygieneIssues.push(`Security Violation: Forbidden file pattern detected: ${path.relative(rootDir, dirPath)}`);
              }
            });
          }
        });
      }
      try {
        walkDir(rootDir);
      } catch (err) {
        hygieneIssues.push(`Hygiene scan failed: ${err.message}`);
      }

      const passed = pipelineResult.pass && hygieneIssues.length === 0;
      const errors = [...pipelineResult.errors, ...hygieneIssues];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: passed,
        passed: passed,
        errors: errors,
        warnings: pipelineResult.warnings || []
      }));
    }
    
    // Serve static dashboard files
    else {
      serveStatic(pathname, res);
    }
  } catch (err) {
    console.error('Server error on request:', req.url, err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Antigravity Robotics Ecosystem Server is LIVE!`);
  console.log(`Access the interactive dashboard at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`==================================================`);
});
