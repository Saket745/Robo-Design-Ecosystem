# Engineering Standards Rules

## Rule 1: Asynchronous Promise Management
**Severity**: ERROR
**Description**: All async operations (network requests, database reads, file access) must be handled using `async/await` syntax with proper `try/catch` wrapping. Plain nested callbacks or unhandled promise rejections are forbidden.
**Rationale**: Ensures robust asynchronous execution and prevents process crashes due to unhandled exceptions.
**Example (Correct)**:
```javascript
async function loadData() {
  try {
    const data = await fs.promises.readFile(path, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load data:', err.message);
    return null;
  }
}
```
**Example (Violation)**:
```javascript
function loadData() {
  fs.readFile(path, 'utf8', (err, data) => {
    // Nested callback with unhandled error
    return JSON.parse(data);
  });
}
```

## Rule 2: Path Normalization and Validation
**Severity**: ERROR
**Description**: All file operations (read, write, append, stat) must sanitize paths using a `validatePath` helper that prevents path traversal beyond the workspace root.
**Rationale**: Protects local system files from unauthorized access or malicious directory traversal queries.
**Example (Correct)**:
```javascript
function validatePath(targetPath) {
  const resolved = path.normalize(path.resolve(targetPath));
  if (!resolved.startsWith(safeRoot)) throw new Error('Security Violation');
  return resolved;
}
```
**Example (Violation)**:
```javascript
fs.readFileSync(path.join(__dirname, '../../', req.query.filePath));
```

## Rule 3: Error Severity Grading
**Severity**: WARNING
**Description**: System errors should be classified into severity levels: `info`, `warning`, `error`, or `critical` before writing to the log system.
**Rationale**: Enables efficient monitoring, alerting, and filtering of log records.
**Example (Correct)**:
`logger.logEvent({ event: 'network_failure', severity: 'warning', message: 'Failed to reach API, retrying...' });`
**Example (Violation)**:
`logger.logEvent({ event: 'network_failure', message: 'API failed.' }); // missing severity defaults to info`
