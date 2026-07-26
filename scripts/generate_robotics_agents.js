const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const baseDir = path.join(root, '03_SUBAGENTS', '04_ROBOTICS_AGENTS');

const agentsData = {
  quadruped_agent: {
    name: "Quadruped Agent",
    description: "Specialized robot-type subagent that manages quadruped geometry, leg routing, joint orientations, and limb configurations.",
    capabilities: [
      "Load quadruped robot templates",
      "Configure symmetrical limb structures",
      "Manage mechanical parameter configurations"
    ],
    permissions: [
      "Read project state and Project DNA",
      "Write visual chassis and leg templates"
    ]
  },
  kinematics_agent: {
    name: "Kinematics Agent",
    description: "Mathematical computation agent specialized in inverse kinematics, forward kinematics, and gait generation algorithms.",
    capabilities: [
      "Solve 3-DOF and 12-DOF inverse kinematics",
      "Generate walking, trotting, and bounding gait profiles",
      "Compute joint velocity limits and Jacobian matrices"
    ],
    permissions: [
      "Read project state parameters",
      "Write kinematics scripts and trajectory tables"
    ]
  },
  simulation_agent: {
    name: "Simulation Agent",
    description: "Specialized physics and environment agent that orchestrates Gazebo and PyBullet simulation setups.",
    capabilities: [
      "Construct robot URDF and SDF descriptions",
      "Load virtual obstacle worlds and friction environments",
      "Run closed-loop control simulation checks"
    ],
    permissions: [
      "Read project state and visual meshes",
      "Write URDF and SDF launch configurations",
      "Run simulation nodes in sandbox"
    ]
  }
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

if (require.main === module) {
  for (const [id, agent] of Object.entries(agentsData)) {
    const agentDir = path.join(baseDir, id);
    ensureDir(agentDir);
    ensureDir(path.join(agentDir, 'workflow_templates'));
    ensureDir(path.join(agentDir, 'examples'));
    ensureDir(path.join(agentDir, 'logs'));

    // 1. Write agent.md
    const agentMdContent = `# Subagent: ${agent.name}

## Description
${agent.description}

## Core Capabilities
${agent.capabilities.map(c => `- ${c}`).join('\n')}

## Permissions & Scope
${agent.permissions.map(p => `- ${p}`).join('\n')}

## Validation Checklists
- [ ] Inputs comply with schemas.
- [ ] No circular dependencies in execution.
- [ ] Confidence score >= 0.8.
`;
    fs.writeFileSync(path.join(agentDir, 'agent.md'), agentMdContent, 'utf8');

    // 2. Write capabilities.yaml
    const capsYamlContent = `agent_id: ${id}
name: ${agent.name}
capabilities:
${agent.capabilities.map(c => `  - ${c}`).join('\n')}
`;
    fs.writeFileSync(path.join(agentDir, 'capabilities.yaml'), capsYamlContent, 'utf8');

    // 3. Write permissions.yaml
    const permsYamlContent = `agent_id: ${id}
permissions:
${agent.permissions.map(p => `  - ${p}`).join('\n')}
`;
    fs.writeFileSync(path.join(agentDir, 'permissions.yaml'), permsYamlContent, 'utf8');

    console.log(`Generated subagent structure for: ${id}`);
  }

  console.log('Robotics subagents generated successfully.');
}

module.exports = {
  ensureDir,
  agentsData
};
