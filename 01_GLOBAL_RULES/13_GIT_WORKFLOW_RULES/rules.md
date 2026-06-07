# Git Workflow Rules

## Rule 1: Conventional Commit Messages
**Severity**: WARNING
**Description**: All git commit messages must adhere to the Conventional Commits specification: `type(scope): message`. Allowed types include `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`.
**Rationale**: Enables automated changelog compilation and keeps project history structured and searchable.
**Example (Correct)**:
`feat(dag-engine): add topological sort execution`
**Example (Violation)**:
`fixed the sorting bug`

## Rule 2: Pre-Commit Validation Mandatory
**Severity**: ERROR
**Description**: Developers and agents must run `npm run validate` and ensure it passes successfully before committing any code changes to the repository.
**Rationale**: Guarantees that only lint-free, schema-compliant, and well-behaved code is versioned.
**Example (Correct)**:
`Running validate-ecosystem.js before executing git commit.`
**Example (Violation)**:
`Pushing code that violates naming conventions or tier boundaries, breaking the build pipeline.`

## Rule 3: Branch Naming Conventions
**Severity**: WARNING
**Description**: Feature branches must be named following the pattern `feature/[task-id]-[short-name]` or `bugfix/[task-id]-[short-name]`.
**Rationale**: Links branches directly to tasks in the PRD, facilitating progress audits.
**Example (Correct)**:
`feature/task-5-skill-registry`
**Example (Violation)**:
`my-new-skills-branch`
