const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const baseDir = path.join(root, '02_SKILLS', '04_SKILL_DOMAINS', 'ROBOTICS_ENGINEERING');

const skillsData = {
  cad_design: {
    name: "CAD Design",
    purpose: "Procedural and physical morphology modeling of robot chassis, legs, and mounts.",
    inputs: [
      "Robot morphology dimensions (height, width, leg segments)",
      "Material specifications (density, yield strength)",
      "Actuator mounting layouts and dimensions"
    ],
    outputs: [
      "3D Mesh files (.stl, .obj)",
      "Exchangeable CAD files (.step)",
      "URDF link visual/collision geometry"
    ],
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
    validation: [
      "Visual inspections for structural self-intersections.",
      "Check mesh manifold integrity (no open edges).",
      "Verify weight estimations match budget limits."
    ],
    failures: [
      "Non-manifold geometry errors.",
      "Insufficient clearances around structural actuators."
    ],
    dependencies: [],
    deliverables: ["chassis.step", "leg_upper.stl", "leg_lower.stl"]
  },
  pcb_design: {
    name: "PCB Design",
    purpose: "Design and validate custom robotics control system PCBs.",
    inputs: [
      "Schematic design requirements",
      "Target microcontroller pinouts (ESP32/Jetson)",
      "Sensor interfaces and voltage limits"
    ],
    outputs: [
      "Schematics files (.sch)",
      "PCB Layout design (.kicad_pcb)",
      "Gerber manufacturing files"
    ],
    tools: ["KiCad", "Altium Designer", "LTSpice"],
    workflow: [
      "Draw schematic with voltage dividers and power management stages.",
      "Configure trace widths based on target continuous current ratings.",
      "Position MCU and decoupling capacitors near power input pins.",
      "Route differential pairs and signal lines separating analog/digital paths.",
      "Execute DRC/ERC rules and export fabrication Gerbers."
    ],
    constraints: [
      "Ground loops must be prevented using single-point grounding.",
      "Trace widths must handle peak actuator current without overheating (min 1mm/A)."
    ],
    validation: [
      "Zero ERC errors.",
      "Zero DRC clearance errors.",
      "Thermal load simulation checks."
    ],
    failures: [
      "Voltage instability and high ripple under motor loads.",
      "Signal noise interference in sensor lines due to poor trace isolation."
    ],
    dependencies: ["power_systems"],
    deliverables: ["control_board.kicad_pcb", "gerber_pack.zip"]
  },
  embedded_systems: {
    name: "Embedded Systems",
    purpose: "Write and flash micro-controller firmware for sensor reading and actuator commands.",
    inputs: [
      "Target pinout map from PCB schematic",
      "Sensor sampling rates and communication protocols (I2C/SPI/CAN)",
      "Target micro-controller specification"
    ],
    outputs: [
      "C++ firmware source code (.cpp, .h)",
      "Compiled binary firmware (.bin, .hex)"
    ],
    tools: ["PlatformIO", "Arduino IDE", "ESP-IDF"],
    workflow: [
      "Configure peripherals (GPIO, PWM, I2C, SPI, CAN bus).",
      "Write real-time sensor polling threads (e.g. FreeRTOS tasks).",
      "Implement communication packet parser for master commands.",
      "Configure safety watchdog timers and emergency stop handlers.",
      "Compile firmware and upload to the target micro-controller."
    ],
    constraints: [
      "Firmware execution loops must run deterministically at min 100Hz.",
      "Zero blocking delay() calls in real-time control threads."
    ],
    validation: [
      "Compile checks (warnings treated as errors).",
      "Verify sensor data streams are noise-filtered.",
      "Check watchdog timer response."
    ],
    failures: [
      "Thread lock or deadlock in task scheduler.",
      "CAN/I2C communication packet timeout."
    ],
    dependencies: ["motor_control", "sensor_fusion"],
    deliverables: ["firmware.bin", "main.cpp"]
  },
  robotics_kinematics: {
    name: "Robotics Kinematics",
    purpose: "Compute forward and inverse kinematics models and generate gait trajectories.",
    inputs: [
      "Leg segment lengths and physical offsets",
      "Joint angle limits (minimum/maximum degrees)",
      "Target foot tip trajectories (x, y, z path)"
    ],
    outputs: [
      "Kinematic models (DH parameters or analytical solutions)",
      "Gait trajectory tables (.json, .csv)"
    ],
    tools: ["Python", "NumPy", "SciPy", "SymPy"],
    workflow: [
      "Construct analytical Forward Kinematics (FK) equations for leg links.",
      "Derive Inverse Kinematics (IK) solver using trigonometric or numerical methods.",
      "Validate IK solver against mechanical joint limit constraints.",
      "Generate foot gait curves (e.g. cycloid swing curves).",
      "Generate joint angles trajectory list for coordination."
    ],
    constraints: [
      "IK solver must resolve within 2ms per leg loop.",
      "Disallow joint angle commands beyond physical motor limits."
    ],
    validation: [
      "Compare target foot position with computed FK position.",
      "Ensure joint trajectories contain no sudden spikes or discontinuities."
    ],
    failures: [
      "IK solver singularity (unresolvable math).",
      "Joint speed limit violations during swing phase."
    ],
    dependencies: [],
    deliverables: ["kinematics_model.py", "gait_profile.json"]
  },
  sensor_fusion: {
    name: "Sensor Fusion",
    purpose: "Synthesize data from IMUs, LiDAR, encoders, and cameras to estimate robot pose.",
    inputs: [
      "Raw IMU accelerometer/gyroscope readings",
      "Wheel/joint encoder state telemetry",
      "Lidar scanning arrays"
    ],
    outputs: [
      "Filtered robot pose (orientation, position, velocity)"
    ],
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
    validation: [
      "Verify covariance matrices decrease on consistent sensor feeds.",
      "Cross-check orientation outputs against ground truth state."
    ],
    failures: [
      "Filter divergence under high-acceleration movements.",
      "LiDAR/IMU coordinate frame misalignment."
    ],
    dependencies: [],
    deliverables: ["ekf_node.py", "tf_broadcaster.cpp"]
  },
  motor_control: {
    name: "Motor Control",
    purpose: "Actuator driver tuning, calibration, and closed-loop speed/position control.",
    inputs: [
      "Motor voltage, phase resistance, and KV ratings",
      "Encoder counts per revolution (CPR)",
      "Target torque, speed, or position commands"
    ],
    outputs: [
      "Calibrated motor feedback configurations",
      "Actuator command loops"
    ],
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
    validation: [
      "Execute step response checks.",
      "Verify current limiting logic triggers under stall conditions."
    ],
    failures: [
      "Motor runaway (positive feedback loops).",
      "Encoder slip causing misalignment errors."
    ],
    dependencies: [],
    deliverables: ["motor_calibration.json", "pid_tuner.py"]
  },
  power_systems: {
    name: "Power Systems",
    purpose: "Design battery configurations, charge protection circuits, and regulator distributions.",
    inputs: [
      "Continuous and peak current draw requirements",
      "Operating voltage requirements of all subsystems",
      "Target battery chemistry and weight limits"
    ],
    outputs: [
      "Ecosystem power distribution budget",
      "Regulator schematics"
    ],
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
    validation: [
      "Simulate regulator load transitions in LTSpice.",
      "Measure voltage drop across power delivery network under peak loads."
    ],
    failures: [
      "Regulator thermal shutdown due to overheating.",
      "Logic reset (brownout) during actuator high-draw startup."
    ],
    dependencies: [],
    deliverables: ["power_budget.xlsx", "regulator_schematic.sch"]
  },
  computer_vision: {
    name: "Computer Vision",
    purpose: "Extract depth mappings, detect obstacles, and recognize interactive items.",
    inputs: [
      "RGB-D depth camera stream",
      "Camera intrinsic/extrinsic calibration data"
    ],
    outputs: [
      "Depth point cloud arrays",
      "Bounding boxes of detected items"
    ],
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
    validation: [
      "Calculate Mean Average Precision (mAP) on calibration test set.",
      "Verify object depth measurement accuracy within 5cm tolerance."
    ],
    failures: [
      "Pipeline lag and frame drop under heavy processing loads.",
      "False obstacle detection due to lens reflections."
    ],
    dependencies: ["sensor_fusion"],
    deliverables: ["detection_node.py", "camera_calibration.yaml"]
  },
  simulation: {
    name: "Simulation",
    purpose: "Physics-based evaluation of kinematics, controllers, and odometry in virtual environments.",
    inputs: [
      "Robot URDF descriptions",
      "World collision models and mesh environments",
      "Control node topics"
    ],
    outputs: [
      "Simulation log outputs",
      "Sensor emulation data streams"
    ],
    tools: ["Gazebo Classic", "ROS2 Gazebo Plugins", "PyBullet"],
    workflow: [
      "Generate complete URDF with correct visual/collision/inertial properties.",
      "Configure Gazebo ros2_control hardware interface plugin.",
      "Construct virtual world with obstacles and slip friction surfaces.",
      "Launch simulation and verify joint controllers respond correctly.",
      "Record and plot telemetry curves comparing sim against math targets."
    ],
    constraints: [
      "Real-time factor (RTF) in simulation must hold >= 0.8.",
      "Inertial matrices of URDF links must be positive-definite."
    ],
    validation: [
      "URDF validation checks (check_urdf).",
      "Verify joint limits match physical robot specifications."
    ],
    failures: [
      "Simulation explosion (non-physical inertial properties).",
      "Controller joint oscillation in gazebo physics engine."
    ],
    dependencies: ["cad_design", "robotics_kinematics"],
    deliverables: ["robot.urdf", "gazebo_world.sdf", "sim_launch.py"]
  },
  manufacturing: {
    name: "Manufacturing",
    purpose: "Generate toolpaths, infill patterns, and machining plans for mechanical parts.",
    inputs: [
      "STEP/STL mechanical mesh files",
      "Material density and strength requirements",
      "Target tolerances"
    ],
    outputs: [
      "Slicer printer configurations",
      "CNC milling G-Code files"
    ],
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
    validation: [
      "G-code dry run simulations.",
      "Verify layer adhesion and wall counts (min 4 walls)."
    ],
    failures: [
      "Layer shearing under load.",
      "CNC toolpath collisions."
    ],
    dependencies: ["cad_design"],
    deliverables: ["chassis.gcode", "leg_upper.3mf"]
  },
  ros2_architecture: {
    name: "ROS2 Architecture",
    purpose: "Configure topics, services, actions, and custom interfaces for multi-node communication.",
    inputs: [
      "List of software nodes and responsibilities",
      "Communication update rate constraints"
    ],
    outputs: [
      "Node dependency charts",
      "ROS2 Packages, launch scripts, and custom message schemas (.msg, .srv)"
    ],
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
    validation: [
      "ROS2 topic list and graph inspections.",
      "Bandwidth analysis on communication channels."
    ],
    failures: [
      "DDS communication dropouts or high packet latencies.",
      "Circular node dependency locking runtime threads."
    ],
    dependencies: ["embedded_systems"],
    deliverables: ["LegJointState.msg", "robot_nodes.launch.py", "package.xml"]
  },
  bom_procurement: {
    name: "BOM & Procurement",
    purpose: "Generate components bill of materials, verify supply chains, and calculate budget costs.",
    inputs: [
      "Chassis CAD components list",
      "PCB schematics component list",
      "Subsystem target budgets"
    ],
    outputs: [
      "Ecosystem Bill of Materials spreadsheet (.xlsx, .csv)"
    ],
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
    validation: [
      "Check footprint sizes against footprints defined in PCB files.",
      "Verify lead-time constraints align with build roadmaps."
    ],
    failures: [
      "Footprint mismatch causing assembly assembly locks.",
      "Out-of-stock items stalling PCB production."
    ],
    dependencies: ["pcb_design", "cad_design"],
    deliverables: ["bom_master.xlsx", "procurement_sources.csv"]
  }
};

function validatePath(targetPath) {
  const resolved = path.normalize(path.resolve(targetPath));
  const resolvedRoot = path.normalize(root);
  if (!resolved.startsWith(resolvedRoot + path.sep) && resolved !== resolvedRoot) {
    throw new Error(`Security Error: Path '${resolved}' is outside allowed root '${resolvedRoot}'.`);
  }
  return resolved;
}

function ensureDirectoryExistence(filePath) {
  const safePath = validatePath(filePath);
  const dirname = path.dirname(safePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Generate the files
for (const [id, skill] of Object.entries(skillsData)) {
  const skillDir = validatePath(path.join(baseDir, id));
  ensureDirectoryExistence(path.join(skillDir, 'skill.md'));

  // 1. Write skill.md
  const skillMdContent = `# Skill: ${skill.name}

## Purpose
${skill.purpose}

## Inputs
${skill.inputs.map(i => `- ${i}`).join('\n')}

## Outputs
${skill.outputs.map(o => `- ${o}`).join('\n')}

## Required Tools
${skill.tools.map(t => `- ${t}`).join('\n')}

## Workflow
${skill.workflow.map((w, idx) => `${idx + 1}. ${w}`).join('\n')}

## Constraints
${skill.constraints.map(c => `- ${c}`).join('\n')}

## Validation
${skill.validation.map(v => `- ${v}`).join('\n')}

## Failure Conditions
${skill.failures.map(f => `- ${f}`).join('\n')}

## Dependencies
${skill.dependencies.map(d => `- ${d}`).join('\n')}

## Deliverables
${skill.deliverables.map(dl => `- ${dl}`).join('\n')}
`;

  const skillMdPath = validatePath(path.join(skillDir, 'skill.md'));
  fs.writeFileSync(skillMdPath, skillMdContent, 'utf8');

  // 2. Write validation.md
  const validationMdContent = `# Validation Protocol: ${skill.name}

## Validation Summary
This document defines the validation gates, verification commands, and test suites for confirming the quality of outputs generated by the ${skill.name} skill.

## Validation Gates
1. **Gate 1 - Schema Validation**:
   - Verify deliverables match expected extensions and naming schemas.
2. **Gate 2 - Logic & Parameters Validation**:
   - Validate variables against structural constraints.
3. **Gate 3 - Integration & Execution Verification**:
   - Ensure the deliverables load cleanly into simulator or compilers.

## Automated Verification Steps
- Run the local linter checks.
- Verify file existence:
${skill.deliverables.map(dl => `  - [ ] \`templates/${dl}\` exists and matches spec.`).join('\n')}

## Recovery Protocols
- On validation failure, roll back workspace state.
- Surface error code and escalate to the coordination layer.
`;

  const validationMdPath = validatePath(path.join(skillDir, 'validation.md'));
  fs.writeFileSync(validationMdPath, validationMdContent, 'utf8');

  // 3. Write dependencies.yaml
  const depsYamlContent = `skill_id: ${id}
version: 1.0.0
dependencies:
${skill.dependencies.map(d => `  - ${d}`).join('\n')}
recommended_extensions:
  - ms-vscode.cpptools
  - python
`;

  const depsYamlPath = validatePath(path.join(skillDir, 'dependencies.yaml'));
  fs.writeFileSync(depsYamlPath, depsYamlContent, 'utf8');

  console.log(`Generated skill structure for: ${id}`);
}

console.log('All 12 domain skills generated successfully.');
