const fs = require('fs');
const path = require('path');
const registryModule = require('../01_CAPABILITY_REGISTRY/registry');

const root = path.resolve(__dirname, '../..');
const skillIndexJsonPath = path.join(root, '02_SKILLS', '01_CAPABILITY_REGISTRY', 'skill_index.json');

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
  const safeIndex = validatePath(skillIndexJsonPath);
  if (!fs.existsSync(safeIndex)) {
    return registryModule.getSkillIndex();
  }
  try {
    const raw = fs.readFileSync(safeIndex, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to load skill_index.json: ${err.message}. Rescanning.`);
    return registryModule.getSkillIndex();
  }
}

function resolveConflicts(matchedSkills) {
  if (!matchedSkills || matchedSkills.length === 0) return null;
  
  return matchedSkills.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const aDepsCount = (a.skill.dependencies || []).length;
    const bDepsCount = (b.skill.dependencies || []).length;
    if (bDepsCount !== aDepsCount) {
      return bDepsCount - aDepsCount;
    }
    return a.skill.id.localeCompare(b.skill.id);
  })[0];
}

function routeQuery(queryText) {
  const registry = loadRegistry();
  const tokens = queryText.toLowerCase().split(/[\s,_.\-\/]+/);

  const scoredSkills = (registry.skills || []).map(skill => {
    let score = 0;
    
    // Direct matches
    if (tokens.includes(skill.id.toLowerCase())) score += 10;
    
    // Name match (with simple stemming)
    const nameWords = (skill.name || '').toLowerCase().split(/\s+/);
    nameWords.forEach(word => {
      if (tokens.includes(word)) {
        score += 5;
      } else {
        tokens.forEach(t => {
          if (t.replace(/s$/, '') === word.replace(/s$/, '')) {
            score += 4;
          }
        });
      }
    });

    // Tag match (with simple stemming)
    if (skill.tags) {
      skill.tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (tokens.includes(tagLower)) {
          score += 3;
        } else {
          tokens.forEach(t => {
            if (t.replace(/s$/, '') === tagLower.replace(/s$/, '')) {
              score += 2.5;
            }
          });
        }
      });
    }

    // Keyword match (with simple stemming and partial matches)
    if (skill.keywords) {
      skill.keywords.forEach(keyword => {
        const keywordWords = keyword.toLowerCase().split(/\s+/);
        keywordWords.forEach(kw => {
          if (tokens.includes(kw)) {
            score += 2;
          } else {
            tokens.forEach(t => {
              if (t.replace(/s$/, '') === kw.replace(/s$/, '')) {
                score += 1.5;
              } else if (t.includes(kw) || kw.includes(t)) {
                score += 1.0;
              }
            });
          }
        });
      });
    }

    return { skill, score };
  });

  // Filter skills with score > 0
  const matches = scoredSkills.filter(item => item.score > 0);

  if (matches.length === 0) {
    return {
      success: false,
      message: "No matching capabilities found in the registry.",
      matches: []
    };
  }

  // Resolve conflicts
  const conflictResolved = resolveConflicts(matches);
  const bestMatch = conflictResolved.skill;
  const confidence = Math.min(1.0, conflictResolved.score / 15);

  // Transitive dependency resolution
  const dependencies = [];
  const visited = new Set();

  function resolveDeps(skillId) {
    if (visited.has(skillId)) return;
    visited.add(skillId);

    const s = (registry.skills || []).find(x => x.id === skillId);
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
    all_matches: matches
      .sort((a, b) => b.score - a.score)
      .map(m => ({ id: m.skill.id, score: m.score }))
  };
}

// Wrapper for new implementation plan interface
function routeTask(taskDescription) {
  return routeQuery(taskDescription);
}

module.exports = {
  routeQuery,
  loadRegistry,
  routeTask,
  resolveConflicts
};

// Direct execution from terminal
if (require.main === module) {
  const query = process.argv.slice(2).join(' ');
  if (!query) {
    console.log('Usage: node router.js "<query text>"');
  } else {
    console.log(JSON.stringify(routeTask(query), null, 2));
  }
}
