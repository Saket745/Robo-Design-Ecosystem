# Documentation Standards Rules

## Rule 1: Required Document Headings
**Severity**: WARNING
**Description**: All major specification or walkthrough Markdown documents must contain an `h1` main title and structured sub-headings for `## Purpose`, `## Workflow`, and `## Validation`.
**Rationale**: Standardization allows documentation ingestion scripts and LLMs to navigate project documentation predictably.
**Example (Correct)**:
```markdown
# Skill: Motor Control
## Purpose
...
## Workflow
...
```
**Example (Violation)**:
```markdown
# Motor Control
Some text without headers or workflow sections.
```

## Rule 2: Markdown Local File Link Schemes
**Severity**: ERROR
**Description**: All references to local codebase files in Markdown documents must use clickable markdown links with the absolute `file:///` URI scheme (using forward slashes, e.g. `[main.js](file:///c:/path/to/main.js)`).
**Rationale**: Enables direct clicking and opening of workspace files in the IDE environment.
**Example (Correct)**:
`[schema](file:///c:/Users/mssak/OneDrive/Desktop/Robo%20Model/antigravity-platform/08_VALIDATION/00_VALIDATION_CORE/schemas/config_schema.json)`
**Example (Violation)**:
`[schema](../08_VALIDATION/schemas/config_schema.json)`

## Rule 3: Visual Flowcharts via Mermaid
**Severity**: WARNING
**Description**: Any system design, execution path, or state transition description must include a corresponding, syntax-valid `mermaid` code block.
**Rationale**: Provides interactive visual representations of complex logic directly inside markdown viewers.
**Example (Correct)**:
```mermaid
graph TD
  A --> B
```
**Example (Violation)**:
`Step A goes to Step B which goes to Step C` (described purely in text).
