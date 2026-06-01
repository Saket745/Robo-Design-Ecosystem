## 📦 Pull Request

### Description

<!-- Briefly describe what this PR does and why -->

### Type of Change

- [ ] `feat` — New feature (skill, agent, module, capability)
- [ ] `fix` — Bug fix
- [ ] `docs` — Documentation update
- [ ] `refactor` — Code refactoring (no functional change)
- [ ] `test` — Adding or updating tests/validation
- [ ] `chore` — Maintenance (deps, configs, tooling)
- [ ] `perf` — Performance improvement

### Module(s) Affected

<!-- List the modules this PR touches, e.g., 02_SKILLS, dashboard, scripts -->

### 🏗️ Architecture Impact

- [ ] This PR does **NOT** modify any immutable zone (`00_CORE_BRAIN`, `01_GLOBAL_RULES`, `07_SECURITY`, `SYSTEM_DNA.yaml`)
- [ ] This PR modifies an immutable zone (requires owner approval) — explain why:

### ✅ Validation Checklist

> Per SYSTEM_CONSTITUTION §3: Zero Unvalidated Execution

- [ ] No secrets, API keys, or credentials committed
- [ ] No circular dependencies introduced
- [ ] All new skills include `skill.md`, `validation.md`, `dependencies.yaml`
- [ ] State manager state is not corrupted by changes
- [ ] MANIFEST.yaml updated if new skills added
- [ ] Tested locally (`npm run dev` for dashboard, `node scripts/state_manager.js get` for state)
- [ ] CHANGELOG.md updated

### 📸 Screenshots / Demo

<!-- If UI/dashboard changes, add before/after screenshots -->

### 🔗 Related Issues

<!-- Link related issues: Closes #XX, Relates to #YY -->
