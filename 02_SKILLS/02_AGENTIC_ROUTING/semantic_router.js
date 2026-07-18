const fs = require('fs');
const path = require('path');
const { parseYAML } = require('../../08_VALIDATION/00_VALIDATION_CORE/yaml_parser');

const root = path.resolve(__dirname, '../..');
const registryPath = path.join(root, '02_SKILLS', '01_CAPABILITY_REGISTRY', 'master_skill_registry.yaml');

function validatePath(targetPath) {
  const resolved = path.normalize(path.resolve(targetPath));
  const resolvedRoot = path.normalize(path.resolve(root));
  const safeRoot = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  if (!resolved.startsWith(safeRoot) && resolved !== resolvedRoot) {
    throw new Error(`Security Error: Path '${resolved}' is outside allowed root '${resolvedRoot}'.`);
  }
  return resolved;
}

function loadRegistry() {
  const safeRegistryPath = validatePath(registryPath);
  if (!fs.existsSync(safeRegistryPath)) {
    console.error(`Master skill registry not found at ${safeRegistryPath}`);
    return { skills: [] };
  }
  const text = fs.readFileSync(safeRegistryPath, 'utf8');
  return parseYAML(text);
}

function routeQuery(queryText) {
  const registry = loadRegistry();
  const tokens = queryText.toLowerCase().split(/[\s,_.\-\/]+/);

  const scoredSkills = registry.skills.map(skill => {
    let score = 0;
    
    // Direct matches
    if (tokens.includes(skill.id.toLowerCase())) score += 10;
    
    // Name match
    const nameWords = skill.name.toLowerCase().split(/\s+/);
    nameWords.forEach(word => {
      if (tokens.includes(word)) score += 5;
    });

    // Tag match
    if (skill.tags) {
      skill.tags.forEach(tag => {
        if (tokens.includes(tag.toLowerCase())) score += 3;
      });
    }

    // Keyword match
    if (skill.keywords) {
      skill.keywords.forEach(keyword => {
        const keywordWords = keyword.toLowerCase().split(/\s+/);
        keywordWords.forEach(kw => {
          if (tokens.includes(kw)) score += 2;
        });
      });
    }

    return { skill, score };
  });

  // Filter skills with score > 0 and sort by descending score
  const matches = scoredSkills
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return {
      success: false,
      message: "No matching capabilities found in the registry.",
      matches: []
    };
  }

  const bestMatch = matches[0].skill;
  const confidence = Math.min(1.0, matches[0].score / 15);

  // Transitive dependency resolution
  const dependencies = [];
  const visited = new Set();

  function resolveDeps(skillId) {
    if (visited.has(skillId)) return;
    visited.add(skillId);

    const s = registry.skills.find(x => x.id === skillId);
    if (s && s.dependencies) {
      for (const dep of s.dependencies) {
        if (!dependencies.includes(dep)) {
          dependencies.push(dep);
        }
        resolveDeps(dep);
      }
    }
  }

  resolveDeps(bestMatch.id);

  return {
    success: true,
    matched_skill: {
      id: bestMatch.id,
      name: bestMatch.name,
      entrypoint: bestMatch.entrypoint,
      validation: bestMatch.validation,
      tags: bestMatch.tags
    },
    dependencies_to_load: dependencies,
    confidence_score: parseFloat(confidence.toFixed(2)),
    all_matches: matches.map(m => ({ id: m.skill.id, score: m.score }))
  };
}

module.exports = {
  routeQuery,
  loadRegistry
};

// Direct execution from terminal
if (require.main === module) {
  const query = process.argv.slice(2).join(' ');
  if (!query) {
    console.log('Usage: node semantic_router.js "<query text>"');
  } else {
    console.log(JSON.stringify(routeQuery(query), null, 2));
  }
}
