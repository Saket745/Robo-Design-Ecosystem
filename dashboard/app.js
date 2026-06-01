// Static Embedded Project Data for standalone capability
const PROJECT_DNA = {
  project_name: "AntigravityBot",
  robot_type: "Quadruped",
  purpose: "Indoor navigation + interactive mobile species",
  budget: "Medium",
  autonomy_level: "Semi-autonomous",
  mobility: "Legged (bio-inspired)",
  power_system: "Li-ion (4S2P)",
  compute_system: "Jetson Orin Nano + ESP32",
  manufacturing: "3D Printed (PETG) + CNC Aluminum",
  environment: "Indoor Obstacle Course",
  communication: "ROS2 Humble",
  safety_level: "High (Watchdog, E-Stop)"
};

const SKILLS_REGISTRY = [
  {
    id: "cad_design",
    name: "CAD Design",
    purpose: "Procedural and physical morphology modeling of robot chassis, legs, and mounts.",
    tools: ["Blender", "Fusion 360", "FreeCAD"],
    workflow: [
      "Define structural parameters and coordinates of robot links.",
      "Model base chassis and body layout with hollow cavities for electronics.",
      "Design multi-segment legged joints with actuator clearance.",
      "Export visual and collision meshes for ROS2/Gazebo integration.",
      "Export STEP files for CNC milling and manufacturing."
    ],
    constraints: [
      "Minimal shell thickness of 3mm for 3D printed structural parts.",
      "Clearance of at least 1mm around rotating joint actuators."
    ],
    validation: ["Visual checks for intersections", "Mesh manifold checks", "Weight budget limits"],
    failures: ["Non-manifold geometry errors", "Actuator clearance collisions"],
    dependencies: [],
    deliverables: ["chassis.step", "leg_upper.stl", "leg_lower.stl"]
  },
  {
    id: "pcb_design",
    name: "PCB Design",
    purpose: "Design and validate custom robotics control system PCBs.",
    tools: ["KiCad", "Altium Designer", "LTSpice"],
    workflow: [
      "Draw schematic with voltage dividers and power management stages.",
      "Configure trace widths based on continuous current ratings.",
      "Position MCU and decoupling capacitors near power inputs.",
      "Route differential pairs separating analog/digital paths.",
      "Execute DRC/ERC rules and export fabrication Gerbers."
    ],
    constraints: [
      "Ground loops must be prevented using single-point grounding.",
      "Trace widths must handle peak actuator current (min 1mm/A)."
    ],
    validation: ["Zero ERC errors", "Zero DRC clearance errors", "Thermal load simulations"],
    failures: ["Voltage instability under motor loads", "Signal noise in sensor lines"],
    dependencies: ["power_systems"],
    deliverables: ["control_board.kicad_pcb", "gerber_pack.zip"]
  },
  {
    id: "embedded_systems",
    name: "Embedded Systems",
    purpose: "Write and flash micro-controller firmware for sensor reading and actuator commands.",
    tools: ["PlatformIO", "Arduino IDE", "ESP-IDF"],
    workflow: [
      "Configure peripherals (GPIO, PWM, I2C, SPI, CAN bus).",
      "Write real-time sensor polling threads (FreeRTOS tasks).",
      "Implement communication packet parser for master commands.",
      "Configure safety watchdog timers and emergency stop handlers.",
      "Compile firmware and upload to the target micro-controller."
    ],
    constraints: [
      "Firmware loops must run deterministically at min 100Hz.",
      "Zero blocking delay() calls in real-time control threads."
    ],
    validation: ["Compile checks", "Sensor filter checks", "Watchdog timer responses"],
    failures: ["Thread lock or deadlock in scheduler", "CAN/I2C packet timeout"],
    dependencies: ["motor_control", "sensor_fusion"],
    deliverables: ["firmware.bin", "main.cpp"]
  },
  {
    id: "robotics_kinematics",
    name: "Robotics Kinematics",
    purpose: "Compute forward and inverse kinematics models and generate gait trajectories.",
    tools: ["Python", "NumPy", "SciPy", "SymPy"],
    workflow: [
      "Construct analytical Forward Kinematics equations for leg links.",
      "Derive Inverse Kinematics solver using trigonometric or numerical methods.",
      "Validate IK solver against mechanical joint limit constraints.",
      "Generate foot gait curves (e.g. cycloid swing curves).",
      "Generate joint angles trajectory list for coordination."
    ],
    constraints: [
      "IK solver must resolve within 2ms per leg loop.",
      "Disallow joint angle commands beyond physical motor limits."
    ],
    validation: ["FK vs target position error", "Trajectory spike detection"],
    failures: ["IK solver singularity (unresolvable math)", "Joint speed limit exceeded"],
    dependencies: [],
    deliverables: ["kinematics_model.py", "gait_profile.json"]
  },
  {
    id: "sensor_fusion",
    name: "Sensor Fusion",
    purpose: "Synthesize data from IMUs, LiDAR, encoders, and cameras to estimate robot pose.",
    tools: ["ROS2 Robot Localization", "Python", "C++"],
    workflow: [
      "Read and normalize high-frequency IMU sensors.",
      "Apply Madgwick or Extended Kalman Filter (EKF) algorithms.",
      "Fuse encoder telemetry to estimate linear/angular displacement.",
      "Configure transform tree (TF2 static/dynamic transforms).",
      "Output consolidated odometry updates to navigation stack."
    ],
    constraints: [
      "Fused pose drift must not exceed 5% over 10m traversal.",
      "Sensor fusion loops must operate at >= 50Hz."
    ],
    validation: ["Covariance matrix reduction", "Orientation check vs ground truth"],
    failures: ["Filter divergence under high-acceleration", "Coordinate frame misalignment"],
    dependencies: [],
    deliverables: ["ekf_node.py", "tf_broadcaster.cpp"]
  },
  {
    id: "motor_control",
    name: "Motor Control",
    purpose: "Actuator driver tuning, calibration, and closed-loop speed/position control.",
    tools: ["ODrive Tool", "STM32 CubeMX", "Arduino Control Libraries"],
    workflow: [
      "Measure phase resistance and inductance parameters.",
      "Calibrate encoder alignment with motor pole pairs.",
      "Tune proportional-integral-derivative (PID) gains for current loop.",
      "Tune velocity and position loop feedback gains.",
      "Implement motor thermal safety thresholds."
    ],
    constraints: [
      "Actuator overshoot must remain under 5% during step inputs.",
      "Current draw must not exceed motor continuous rating."
    ],
    validation: ["Step response parameters", "Stall current limits trigger"],
    failures: ["Motor runaway (positive feedback)", "Encoder slip causing offset"],
    dependencies: [],
    deliverables: ["motor_calibration.json", "pid_tuner.py"]
  },
  {
    id: "power_systems",
    name: "Power Systems",
    purpose: "Design battery configurations, charge protection circuits, and regulator distributions.",
    tools: ["LTSpice", "KiCad", "Excel"],
    workflow: [
      "Sum continuous/peak current metrics for all motors and computing cores.",
      "Select cell configurations (e.g. 4S2P Li-Ion).",
      "Integrate Battery Management System (BMS) with overcurrent protection.",
      "Design buck-boost regulators for clean logic power supply.",
      "Perform thermal sizing for heat sinks and copper power planes."
    ],
    constraints: [
      "Logic power supply ripple must remain below 50mV peak-to-peak.",
      "BMS must shut off power if cell voltage drops below 3.0V."
    ],
    validation: ["LTSpice transient loads check", "Peak PDN voltage drop checks"],
    failures: ["Regulator thermal shutdown", "Logic brownout during motor starts"],
    dependencies: [],
    deliverables: ["power_budget.xlsx", "regulator_schematic.sch"]
  },
  {
    id: "computer_vision",
    name: "Computer Vision",
    purpose: "Extract depth mappings, detect obstacles, and recognize interactive items.",
    tools: ["OpenCV", "Open3D", "TensorRT", "YOLOv8"],
    workflow: [
      "Configure camera exposure, resolution, and frame rates.",
      "Calibrate camera lens distortion parameters.",
      "Process color frames through optimized neural networks (YOLO).",
      "Filter point clouds to extract ground plane and obstacles.",
      "Publish object locations relative to the camera frame."
    ],
    constraints: [
      "Inference frame rate must maintain >= 15 FPS.",
      "Memory consumption must fit within Jetson Orin RAM limits."
    ],
    validation: ["mAP metric validation", "Depth accuracy validation"],
    failures: ["Pipeline lag and frame drop", "Reflections causing false obstacles"],
    dependencies: ["sensor_fusion"],
    deliverables: ["detection_node.py", "camera_calibration.yaml"]
  },
  {
    id: "simulation",
    name: "Simulation",
    purpose: "Physics-based evaluation of kinematics, controllers, and odometry in virtual environments.",
    tools: ["Gazebo Classic", "ROS2 Gazebo Plugins", "PyBullet"],
    workflow: [
      "Generate URDF with correct visual/collision/inertial properties.",
      "Configure Gazebo ros2_control hardware interface plugin.",
      "Construct virtual world with obstacles and slip friction surfaces.",
      "Launch simulation and verify joint controllers respond correctly.",
      "Record and plot telemetry curves comparing sim against math targets."
    ],
    constraints: [
      "Real-time factor (RTF) in simulation must hold >= 0.8.",
      "Inertial matrices of URDF links must be positive-definite."
    ],
    validation: ["check_urdf output", "Joint limit vs physical bounds check"],
    failures: ["Simulation explosion", "Gazebo joint controller oscillations"],
    dependencies: ["cad_design", "robotics_kinematics"],
    deliverables: ["robot.urdf", "gazebo_world.sdf", "sim_launch.py"]
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    purpose: "Generate toolpaths, infill patterns, and machining plans for mechanical parts.",
    tools: ["PrusaSlicer", "Cura", "Fusion 360 CAM"],
    workflow: [
      "Orient meshes to minimize stress on print layer boundaries.",
      "Configure infill densities (min 40% gyroid for structural parts).",
      "Generate support structures for overhang angles exceeding 45 degrees.",
      "Generate CNC paths for aluminum joint structural plates.",
      "Export G-Code files ready for manufacturing machines."
    ],
    constraints: [
      "Structural links must be printed in PETG or Carbon Fiber filament.",
      "Part tolerances must fall within +/- 0.1mm limits."
    ],
    validation: ["G-code dry run checks", "Print wall count verification"],
    failures: ["Layer shearing under loads", "CNC toolpath collisions"],
    dependencies: ["cad_design"],
    deliverables: ["chassis.gcode", "leg_upper.3mf"]
  },
  {
    id: "ros2_architecture",
    name: "ROS2 Architecture",
    purpose: "Configure topics, services, actions, and custom interfaces for multi-node communication.",
    tools: ["ROS2 Humble", "colcon", "rclpy", "rclcpp"],
    workflow: [
      "Design clean topic structure with customized namespaces.",
      "Define custom messages (e.g. LegJointState.msg).",
      "Create ros2 workspace and scaffold packages.",
      "Write launch.py script integrating parameters and nodes.",
      "Build workspace using colcon and source setups."
    ],
    constraints: [
      "Crucial control messages must be delivered with QoS reliability.",
      "Nodes must compile without warning logs."
    ],
    validation: ["ros2 topic check", "Channel bandwidth checks"],
    failures: ["DDS dropouts or latency spikes", "Circular node dependency lock"],
    dependencies: ["embedded_systems"],
    deliverables: ["LegJointState.msg", "robot_nodes.launch.py", "package.xml"]
  },
  {
    id: "bom_procurement",
    name: "BOM & Procurement",
    purpose: "Generate components bill of materials, verify supply chains, and calculate budget costs.",
    tools: ["Excel", "Python", "DigiKey API"],
    workflow: [
      "Extract components from CAD structures and PCB files.",
      "Deduplicate components and consolidate packages.",
      "Query online APIs for availability and bulk price models.",
      "Select alternative component paths for long lead-time parts.",
      "Generate consolidated purchase files with pricing summaries."
    ],
    constraints: [
      "Consolidated parts list must remain within project budget.",
      "Zero active components marked as obsolete or end-of-life."
    ],
    validation: ["Footprint verification vs physical PCB", "Lead-time checks"],
    failures: ["Footprint mismatch", "Out-of-stock component stalling"],
    dependencies: ["pcb_design", "cad_design"],
    deliverables: ["bom_master.xlsx", "procurement_sources.csv"]
  }
];

const COMPLETION_STATUS = {
  scaffold: 1.0,
  core_brain: 1.0,
  global_rules: 1.0,
  skills: 1.0,
  subagents: 1.0,
  memory: 1.0,
  validation: 1.0,
  execution: 1.0,
  dashboard: 0.8
};

const EXECUTION_STEPS = [
  { id: "reqs", name: "Requirements Ingestion", desc: "Read specification docs" },
  { id: "arch", name: "Architecture Layout", desc: "Check dependency mapping" },
  { id: "cad", name: "CAD Design", desc: "Generate leg structures" },
  { id: "pcb", name: "PCB Schematic Routing", desc: "Configure MCU and power boards" },
  { id: "firmware", name: "Firmware Compilation", desc: "Build motor and sensor loops" },
  { id: "sim", name: "Simulation Testing", desc: "Run kinematics in Gazebo physics" },
  { id: "val", name: "Safety Validation", desc: "Check E-Stop & watchdogs" }
];

const LOG_RECORDS = [
  { timestamp: "2026-05-30T18:42:28.102Z", event: "workflow_init", trace_id: "82c527e8-103b-472e-aa0d-1fad3d253506", severity: "info", message: "Master orchestrator loading robotics pipeline" },
  { timestamp: "2026-05-30T18:42:28.150Z", event: "dna_load", trace_id: "82c527e8-103b-472e-aa0d-1fad3d253506", severity: "info", message: "Project DNA for quadruped bot loaded successfully" },
  { timestamp: "2026-05-30T18:42:28.320Z", event: "dependency_check", trace_id: "82c527e8-103b-472e-aa0d-1fad3d253506", severity: "info", message: "Verifying 12 domain skill directories" },
  { timestamp: "2026-05-30T18:42:28.450Z", event: "validation_run", trace_id: "82c527e8-103b-472e-aa0d-1fad3d253506", severity: "info", message: "Running robotics validation safety checkers" },
  { timestamp: "2026-05-30T18:42:28.530Z", event: "state_update", trace_id: "82c527e8-103b-472e-aa0d-1fad3d253506", severity: "warning", message: "Ecosystem state updated to v1. Pre-execution snapshots archived" }
];

// App Init
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  loadOverviewTab();
  loadProjectDnaTab();
  loadSkillsTab();
  loadExecutionTab();
  loadLogsTab();
  setupSearchTab();
});

// Tab Navigation
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const tabTitle = document.getElementById("current-tab-title");
  const tabSubtitle = document.getElementById("current-tab-subtitle");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabId = item.getAttribute("data-tab");
      
      // Update sidebar nav items active class
      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");

      // Show matching tab pane
      tabPanes.forEach(pane => pane.classList.remove("active"));
      document.getElementById(`tab-${tabId}`).classList.add("active");

      // Update Header Text
      const textMap = {
        overview: { title: "Overview Dashboard", subtitle: "Real-time status of the autonomous engineering ecosystem." },
        "project-dna": { title: "Project DNA Registry", subtitle: "Permanent parameter definition layer for the active robotic model." },
        skills: { title: "Skill Registry Explorer", subtitle: "View and browse capabilities, validation contracts, and dependencies." },
        execution: { title: "DAG Execution Monitor", subtitle: "Observe sequential task scheduling and pipeline outputs." },
        search: { title: "Semantic Search Engine", subtitle: "Query and find capabilities dynamically using natural language." },
        logs: { title: "Structured System Logs", subtitle: "Audit logs, errors, and trace ID mappings." }
      };

      if (textMap[tabId]) {
        tabTitle.textContent = textMap[tabId].title;
        tabSubtitle.textContent = textMap[tabId].subtitle;
      }
    });
  });
}

// Populate Overview Tab
function loadOverviewTab() {
  const container = document.getElementById("progress-list-container");
  container.innerHTML = "";

  for (const [key, value] of Object.entries(COMPLETION_STATUS)) {
    const item = document.createElement("div");
    item.className = "progress-item";
    item.innerHTML = `
      <div class="progress-info">
        <span class="progress-label">${key.replace('_', ' ')}</span>
        <span class="progress-pct">${(value * 100).toFixed(0)}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${value * 100}%;"></div>
      </div>
    `;
    container.appendChild(item);
  }
}

// Populate Project DNA Tab
function loadProjectDnaTab() {
  const container = document.getElementById("dna-grid-container");
  container.innerHTML = "";

  for (const [key, value] of Object.entries(PROJECT_DNA)) {
    const card = document.createElement("div");
    card.className = "dna-card";
    card.innerHTML = `
      <div class="dna-label">${key.replace('_', ' ')}</div>
      <div class="dna-value">${value}</div>
    `;
    container.appendChild(card);
  }
}

// Populate Skills Tab
function loadSkillsTab() {
  const gridContainer = document.getElementById("skills-grid-container");
  const detailContainer = document.getElementById("skill-detail-container");
  gridContainer.innerHTML = "";

  SKILLS_REGISTRY.forEach(skill => {
    const card = document.createElement("div");
    card.className = "skill-card";
    card.innerHTML = `
      <h4>${skill.name}</h4>
      <span>ID: ${skill.id}</span>
    `;
    card.addEventListener("click", () => {
      // Highlight selected card
      document.querySelectorAll(".skill-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      
      // Load details
      detailContainer.innerHTML = `
        <h3 style="color: var(--accent-blue); font-size: 22px; margin-bottom: 8px;">${skill.name}</h3>
        <p class="description" style="font-size: 15px; margin-bottom: 20px;">${skill.purpose}</p>
        
        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 14px; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 6px;">Required Tools</h4>
          <p style="font-family: var(--font-mono); font-size: 13px;">${skill.tools.join(", ")}</p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 14px; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 6px;">Execution Workflow</h4>
          <ol style="margin-left: 20px; font-size: 14px; line-height: 1.6;">
            ${skill.workflow.map(w => `<li>${w}</li>`).join("")}
          </ol>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 14px; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 6px;">Operational Constraints</h4>
          <ul style="margin-left: 20px; font-size: 14px; line-height: 1.6;">
            ${skill.constraints.map(c => `<li>${c}</li>`).join("")}
          </ul>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 14px; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 6px;">Deliverables</h4>
          <p style="font-family: var(--font-mono); font-size: 13px; color: var(--accent-emerald);">${skill.deliverables.join(", ")}</p>
        </div>
      `;
    });
    gridContainer.appendChild(card);
  });
}

// Populate Execution Tab & Simulated Pipeline Run
function loadExecutionTab() {
  const stepsContainer = document.getElementById("dag-steps-container");
  stepsContainer.innerHTML = "";

  EXECUTION_STEPS.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "dag-step";
    item.id = `step-node-${step.id}`;
    item.innerHTML = `
      <div class="step-indicator">${index + 1}</div>
      <div class="step-details">
        <h4>${step.name}</h4>
        <p>${step.desc}</p>
      </div>
      <div class="step-status-text" id="step-status-${step.id}">PENDING</div>
    `;
    stepsContainer.appendChild(item);
  });

  const triggerBtn = document.getElementById("btn-trigger-pipeline");
  triggerBtn.addEventListener("click", () => {
    runSimulatedPipeline();
  });
}

function appendConsoleLine(text, type = "info") {
  const container = document.getElementById("console-output-container");
  const line = document.createElement("span");
  line.className = `console-line ${type}`;
  const time = new Date().toLocaleTimeString();
  line.textContent = `[${time}] ${text}`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

async function runSimulatedPipeline() {
  const triggerBtn = document.getElementById("btn-trigger-pipeline");
  triggerBtn.disabled = true;
  
  // Clear console
  document.getElementById("console-output-container").innerHTML = "";
  
  appendConsoleLine("[System] Initializing topological execution sort...", "system");
  
  for (const step of EXECUTION_STEPS) {
    const node = document.getElementById(`step-node-${step.id}`);
    const statusText = document.getElementById(`step-status-${step.id}`);
    
    node.className = "dag-step running";
    statusText.textContent = "RUNNING";
    
    appendConsoleLine(`Starting task: ${step.name}...`, "info");
    
    // Custom logging messages per stage
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (step.id === "reqs") {
      appendConsoleLine("Parsed 3 local spec sheets. Classifying parameters.", "success");
    } else if (step.id === "arch") {
      appendConsoleLine("Modularity check passed. Zero circular references found.", "success");
    } else if (step.id === "cad") {
      appendConsoleLine("Blender visual links generated successfully.", "success");
    } else if (step.id === "pcb") {
      appendConsoleLine("DRC check: 0 errors, 0 warnings. GERBER output compiled.", "success");
    } else if (step.id === "firmware") {
      appendConsoleLine("Compiling Esp32 firmware tasks. PlatformIO status: SUCCESS", "success");
    } else if (step.id === "sim") {
      appendConsoleLine("Gazebo simulator starting up. Physics load: RTF = 0.94", "success");
    } else if (step.id === "val") {
      appendConsoleLine("Checking motor safety loops... OK", "success");
      appendConsoleLine("E-Stop hard interrupt logic active... OK", "success");
    }

    node.className = "dag-step success";
    statusText.textContent = "SUCCESS";
    appendConsoleLine(`Task ${step.name} completed successfully.`, "success");
  }

  appendConsoleLine("[System] All validation gates passed. Deploying runtime changes.", "system");
  triggerBtn.disabled = false;
}

// Populate Logs Tab
function loadLogsTab() {
  renderLogs(LOG_RECORDS);

  const filterInput = document.getElementById("log-trace-filter");
  filterInput.addEventListener("input", (e) => {
    const val = e.target.value.trim().toLowerCase();
    if (!val) {
      renderLogs(LOG_RECORDS);
    } else {
      const filtered = LOG_RECORDS.filter(log => log.trace_id.toLowerCase().includes(val));
      renderLogs(filtered);
    }
  });
}

function renderLogs(logs) {
  const container = document.getElementById("logs-list-container");
  container.innerHTML = "";

  logs.forEach(log => {
    const row = document.createElement("div");
    row.className = "log-row";
    row.innerHTML = `
      <span class="log-time">[${log.timestamp.slice(11, 19)}]</span>
      <span class="log-severity ${log.severity}">${log.severity}</span>
      <span class="log-msg">[${log.agent}] ${log.message}</span>
    `;
    container.appendChild(row);
  });
}

// Setup Search Tab
function setupSearchTab() {
  const btn = document.getElementById("btn-search-query");
  const input = document.getElementById("search-input");
  const resultsContainer = document.getElementById("search-results-output");

  btn.addEventListener("click", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) return;

    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>Analyzing capability graph...</p>
      </div>
    `;

    setTimeout(() => {
      // Run custom lookup based on query tokens
      const tokens = query.split(/[\s,_.\-\/]+/);
      const matches = SKILLS_REGISTRY.map(skill => {
        let score = 0;
        if (tokens.includes(skill.id.toLowerCase())) score += 10;
        
        const words = skill.name.toLowerCase().split(/\s+/);
        words.forEach(w => { if (tokens.includes(w)) score += 5; });

        if (skill.purpose.toLowerCase().split(/\s+/).some(w => tokens.includes(w))) score += 2;

        return { skill, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

      resultsContainer.innerHTML = "";

      if (matches.length === 0) {
        resultsContainer.innerHTML = `
          <div class="search-result-card">
            <h4>No matching skills found</h4>
            <p class="description">Try searching for keywords like 'kinematics', 'cad', 'pcb', 'firmware', or 'motor'.</p>
          </div>
        `;
        return;
      }

      matches.forEach(match => {
        const skill = match.skill;
        const confidence = Math.min(1.0, match.score / 15);
        
        // Resolve fake dependencies for view
        const deps = skill.dependencies.length > 0 ? skill.dependencies.join(", ") : "None";

        const card = document.createElement("div");
        card.className = "search-result-card";
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h4>${skill.name} (Matched)</h4>
            <span style="background-color: rgba(59, 130, 246, 0.15); color: var(--accent-blue); padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 600;">
              Confidence: ${(confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p class="description" style="margin-top: 8px; margin-bottom: 12px;">${skill.purpose}</p>
          <div style="font-family: var(--font-mono); font-size: 13px;">
            <div><strong>Entrypoint:</strong> 02_SKILLS/04_SKILL_DOMAINS/ROBOTICS_ENGINEERING/${skill.id}/skill.md</div>
            <div style="margin-top: 4px;"><strong>Dependencies to load:</strong> ${deps}</div>
          </div>
        `;
        resultsContainer.appendChild(card);
      });
    }, 800);
  });
}
