# Security Policies Rules

## Rule 1: No Plaintext Secrets in Code or Logs
**Severity**: ERROR
**Description**: Under no circumstances should passwords, API keys, tokens, or private certificates be hardcoded into code files, configs, or written to standard logs.
**Rationale**: Prevents leakage of credentials in git histories, audit logs, or public repository shares.
**Example (Correct)**:
`logger.js utilizes regex to scrub keywords like 'token' or 'secret' before formatting line entries.`
**Example (Violation)**:
`logger.logEvent({ event: 'git_sync', payload: { github_token: 'ghp_xyz12345' } });`

## Rule 2: Path Traversal Defenses
**Severity**: ERROR
**Description**: All file operations must explicitly use absolute path resolution and sanitize paths to block access outside the allowed workspace scope.
**Rationale**: Prevents malicious agents or input bugs from reading or overwriting root system directories.
**Example (Correct)**:
`If a path starts with parent indicators (e.g. '../'), resolve it to absolute path first and check it starts with the root directory.`
**Example (Violation)**:
`fs.readFile(__dirname + '/../../' + inputParam);`

## Rule 3: Git Exclusion of Environment Variables
**Severity**: ERROR
**Description**: Actual local configurations containing secrets or environment-specific values (e.g. `.env`, `development.env`, `.key`) must be added to `.gitignore`. Only `.env.example` templates should be committed.
**Rationale**: Standard industry security hygiene to ensure local keys are never shared.
**Example (Correct)**:
`A .gitignore file containing entries for *.env, secrets.json, and keyfiles.`
**Example (Violation)**:
`Committing development.env containing local API keys directly to the main repository branch.`
