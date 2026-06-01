const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');

// Checks for specific stages
const CHECKERS = {
  cad_design: (data) => {
    const issues = [];
    if (!data.dimensions) issues.push("Missing mechanical dimensions in CAD specification.");
    if (data.weight_kg && data.weight_kg > 10) issues.push("Estimated weight exceeds structural allowance (> 10kg).");
    return issues;
  },
  pcb_design: (data) => {
    const issues = [];
    if (!data.voltage) issues.push("Operating voltage level not defined.");
    if (data.voltage && data.voltage > 24) issues.push("Unsafe high-voltage layout (> 24V) detected on control PCB.");
    if (!data.mcu) issues.push("MCU model not specified.");
    return issues;
  },
  robotics_kinematics: (data) => {
    const issues = [];
    if (!data.joint_limits) issues.push("Joint angle physical limitations missing.");
    if (data.dof && data.dof < 3) issues.push("Degree of freedom under specified kinematics limit (< 3 DOF).");
    return issues;
  },
  robotics_safety: (data) => {
    const issues = [];
    
    // Motor runaway protection
    if (data.motor_runaway_protection !== true) {
      issues.push("Motor runaway protection software loop is disabled or not set.");
    }
    
    // Battery limits
    if (data.max_cell_voltage && data.max_cell_voltage > 4.25) {
      issues.push("Battery cell charging limit set to unsafe high level (> 4.25V).");
    }
    if (data.min_cell_voltage && data.min_cell_voltage < 3.0) {
      issues.push("Battery discharge protection limit set to unsafe low level (< 3.0V).");
    }
    
    // Thermal limits
    if (data.max_temperature_c && data.max_temperature_c > 80) {
      issues.push("Maximum operating temperature allowance exceeds safe limits (> 80C).");
    }

    // Emergency stop logic
    if (data.emergency_stop_implemented !== true) {
      issues.push("Emergency stop (E-Stop) hard/soft trigger is missing.");
    }

    return issues;
  }
};

function runValidation(stage, data) {
  console.log(`[Validation Pipeline] Running checks for stage: ${stage}...`);
  
  const issues = [];
  const checker = CHECKERS[stage];
  
  if (checker) {
    issues.push(...checker(data));
  } else {
    console.warn(`[Validation Pipeline] Warning: No specific validation checker found for stage: ${stage}`);
  }

  // General schema checks
  if (!data.trace_id) {
    issues.push("General Validation Error: Missing transaction trace ID.");
  }

  const passed = issues.length === 0;
  
  // Calculate confidence score
  let confidenceScore = 1.0;
  if (issues.length > 0) {
    confidenceScore = Math.max(0.0, 1.0 - (issues.length * 0.25));
  }

  const result = {
    stage,
    passed,
    issues,
    confidence_score: confidenceScore,
    timestamp: new Date().toISOString()
  };

  console.log(`[Validation Pipeline] Result: ${passed ? 'PASSED' : 'FAILED'} (Confidence: ${confidenceScore})`);
  return result;
}

module.exports = {
  runValidation
};

// Command line testing
if (require.main === module) {
  const testDataValid = {
    trace_id: "82c527e8-103b-472e-aa0d-1fad3d253506",
    motor_runaway_protection: true,
    max_cell_voltage: 4.2,
    min_cell_voltage: 3.1,
    max_temperature_c: 65,
    emergency_stop_implemented: true
  };

  const testDataInvalid = {
    trace_id: "82c527e8-103b-472e-aa0d-1fad3d253506",
    motor_runaway_protection: false,
    max_cell_voltage: 4.3,
    min_cell_voltage: 2.8,
    max_temperature_c: 90,
    emergency_stop_implemented: false
  };

  console.log('--- Running Valid Test ---');
  console.log(JSON.stringify(runValidation('robotics_safety', testDataValid), null, 2));

  console.log('\n--- Running Invalid Test ---');
  console.log(JSON.stringify(runValidation('robotics_safety', testDataInvalid), null, 2));
}
