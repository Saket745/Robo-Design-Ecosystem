/**
 * Log Viewer CLI
 * ---------------
 * Simple command-line tool to query and filter audit and execution logs.
 *
 * Usage:
 *   node log_viewer.js audit [--action=X] [--actor=X] [--limit=N] [--from=ISO] [--to=ISO]
 *   node log_viewer.js exec  [--taskId=X] [--status=X] [--level=X] [--limit=N] [--from=ISO] [--to=ISO]
 *   node log_viewer.js all   [--limit=N] [--from=ISO] [--to=ISO]
 *   node log_viewer.js tail  [--lines=N]
 *
 * Part of the Antigravity Platform — Tier 4 System Support Layer.
 */

const path = require('path');
const fs = require('fs');

// Resolve logger modules relative to this file's location inside 12_SYSTEM_LOGS/
const auditLogger = require(path.join(__dirname, '01_AUDIT_LOGS', 'audit_logger'));
const executionLogger = require(path.join(__dirname, '02_EXECUTION_LOGS', 'execution_logger'));

/**
 * Parse CLI arguments into a key-value map.
 * Supports --key=value and positional arguments.
 */
function parseArgs(argv) {
  const args = { _positional: [] };
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > -1) {
        const key = arg.substring(2, eqIdx);
        args[key] = arg.substring(eqIdx + 1);
      } else {
        args[arg.substring(2)] = true;
      }
    } else {
      args._positional.push(arg);
    }
  }
  return args;
}

/**
 * Print entries in a human-readable tabular format.
 */
function printEntries(entries, logType) {
  if (entries.length === 0) {
    console.log(`\n  No ${logType} entries found matching the given filters.\n`);
    return;
  }

  console.log(`\n  Found ${entries.length} ${logType} entries:\n`);
  console.log('  ' + '-'.repeat(100));

  for (const entry of entries) {
    const ts = entry.timestamp || 'N/A';
    const level = (entry.level || 'INFO').padEnd(8);

    if (logType === 'audit') {
      const action = (entry.action || '').padEnd(24);
      const actor = (entry.actor || '').padEnd(18);
      const target = entry.target || '';
      console.log(`  ${ts}  ${level} ${action} ${actor} → ${target}`);
    } else {
      const taskId = (entry.taskId || entry.event || '').padEnd(20);
      const step = (entry.step || entry.error || '').padEnd(20);
      const status = (entry.status || '').padEnd(10);
      console.log(`  ${ts}  ${level} ${taskId} ${step} ${status}`);
    }
  }

  console.log('  ' + '-'.repeat(100));
  console.log('');
}

/**
 * Tail the raw JSONL files (like `tail -n`).
 */
function tailLogs(n) {
  const logFiles = [
    { name: 'Audit', path: path.join(__dirname, '01_AUDIT_LOGS', 'audit.jsonl') },
    { name: 'Execution', path: path.join(__dirname, '02_EXECUTION_LOGS', 'execution.jsonl') }
  ];

  for (const lf of logFiles) {
    if (!fs.existsSync(lf.path)) {
      console.log(`\n  [${lf.name}] No log file found at ${lf.path}`);
      continue;
    }
    const raw = fs.readFileSync(lf.path, 'utf8');
    const lines = raw.split('\n').filter(l => l.trim());
    const tail = lines.slice(-n);

    console.log(`\n  === ${lf.name} Logs (last ${tail.length} entries) ===\n`);
    for (const line of tail) {
      try {
        const parsed = JSON.parse(line);
        console.log(`  ${parsed.timestamp}  [${(parsed.level || 'INFO').padEnd(8)}]  ${parsed.action || parsed.event || parsed.step || ''}: ${parsed.target || parsed.taskId || parsed.error || parsed.message || ''}`);
      } catch (_) {
        console.log(`  (malformed) ${line.substring(0, 120)}...`);
      }
    }
  }
  console.log('');
}

// ── Main CLI entrypoint ──
if (require.main === module) {
  (async () => {
    const args = parseArgs(process.argv.slice(2));
    const command = args._positional[0];

    const limit = parseInt(args.limit, 10) || 50;
    const startTime = args.from || undefined;
    const endTime = args.to || undefined;

    if (command === 'audit') {
      const entries = await auditLogger.queryAuditLogs({
        limit,
        action: args.action,
        actor: args.actor,
        startTime,
        endTime
      });
      printEntries(entries, 'audit');
    }
    else if (command === 'exec') {
      const entries = await executionLogger.queryExecutionLogs({
        limit,
        taskId: args.taskId,
        status: args.status,
        level: args.level,
        startTime,
        endTime
      });
      printEntries(entries, 'execution');
    }
    else if (command === 'all') {
      const [auditEntries, execEntries] = await Promise.all([
        auditLogger.queryAuditLogs({ limit, startTime, endTime }),
        executionLogger.queryExecutionLogs({ limit, startTime, endTime })
      ]);

      // Merge and sort by timestamp descending
      const merged = [...auditEntries, ...execEntries]
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, limit);

      printEntries(merged, 'combined');
    }
    else if (command === 'tail') {
      const lines = parseInt(args.lines, 10) || 20;
      tailLogs(lines);
    }
    else {
      console.log(`
  Antigravity Log Viewer — Query and filter platform logs
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Usage:
    node log_viewer.js audit  [--action=X] [--actor=X] [--limit=N] [--from=ISO] [--to=ISO]
    node log_viewer.js exec   [--taskId=X] [--status=X] [--level=X] [--limit=N] [--from=ISO] [--to=ISO]
    node log_viewer.js all    [--limit=N] [--from=ISO] [--to=ISO]
    node log_viewer.js tail   [--lines=N]

  Examples:
    node log_viewer.js audit --actor=planner_agent --limit=10
    node log_viewer.js exec --status=failed --level=ERROR
    node log_viewer.js all --from=2026-06-01 --to=2026-06-07
    node log_viewer.js tail --lines=30
`);
    }
  })().catch(console.error);
}

module.exports = {
  queryAuditLogs: auditLogger.queryAuditLogs,
  queryExecutionLogs: executionLogger.queryExecutionLogs
};
