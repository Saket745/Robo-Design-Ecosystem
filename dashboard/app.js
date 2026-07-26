// Dashboard Client Application

let projectDna = {};
let skillsRegistry = [];
let completionStatus = {};

const EXECUTION_STEPS = [
  { id: "reqs", name: "Requirements Ingestion", desc: "Read specification docs" },
  { id: "arch", name: "Architecture Layout", desc: "Check dependency mapping" },
  { id: "cad", name: "CAD Design", desc: "Generate leg structures" },
  { id: "pcb", name: "PCB Schematic Routing", desc: "Configure MCU and power boards" },
  { id: "firmware", name: "Firmware Compilation", desc: "Build motor and sensor loops" },
  { id: "sim", name: "Simulation Testing", desc: "Run kinematics in Gazebo physics" },
  { id: "val", name: "Safety Validation", desc: "Check E-Stop & watchdogs" }
];

// App Init
document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  await initApp();
});

async function initApp() {
  const container = document.querySelector(".app-container");
  
  // Show loading indicator
  const loader = document.createElement("div");
  loader.className = "empty-state";
  loader.id = "global-app-loader";
  loader.innerHTML = `<span>🧬</span><p>Contacting Antigravity Core API Server...</p>`;
  loader.style.position = "absolute";
  loader.style.top = "0";
  loader.style.left = "0";
  loader.style.width = "100%";
  loader.style.height = "100%";
  loader.style.background = "var(--bg-primary)";
  loader.style.zIndex = "1000";
  container.appendChild(loader);

  try {
    // 1. Fetch State
    const stateRes = await fetch('/api/state');
    const stateData = await stateRes.json();
    projectDna = {
      project_name: stateData.project_name || "AntigravityBot",
      robot_type: stateData.robot_type || "Quadruped",
      purpose: stateData.purpose || "Indoor navigation + interactive mobile species",
      budget: stateData.budget || "Medium",
      autonomy_level: stateData.autonomy_level || "Semi-autonomous",
      mobility: stateData.mobility || "Legged (bio-inspired)",
      power_system: stateData.power_system || "Li-ion",
      compute_system: stateData.compute_system || "Configurable",
      manufacturing: stateData.manufacturing || "3D Printed + CNC",
      environment: stateData.environment || "Indoor",
      communication: stateData.communication || "ROS2",
      safety_level: stateData.safety_level || "Medium"
    };
    completionStatus = stateData.completion_map || {};

    // Update active project badge
    document.getElementById("active-project-name").textContent = projectDna.project_name;

    // 2. Fetch Skills Registry
    const skillsRes = await fetch('/api/skills');
    skillsRegistry = await skillsRes.json();

    // 3. Load Tab content
    loadOverviewTab();
    loadProjectDnaTab();
    loadSkillsTab();
    loadExecutionTab();
    loadLogsTab();
    setupSearchTab();

    // Remove loading indicator
    loader.remove();

    // Start 30-second auto-refresh
    setInterval(async () => {
      try {
        const stateRes = await fetch('/api/state');
        const stateData = await stateRes.json();
        completionStatus = stateData.completion_map || {};
        loadOverviewTab();

        const activeNav = document.querySelector(".nav-item.active");
        if (activeNav && activeNav.getAttribute("data-tab") === "logs") {
          fetchLogs();
        }
      } catch (e) {
        console.warn("Auto-refresh state fetch failed:", e);
      }
    }, 30000);
  } catch (err) {
    loader.innerHTML = `
      <span style="color: var(--accent-crimson);">⚠️</span>
      <p style="color: var(--accent-crimson); font-weight: 600;">Ecosystem Core Connection Failed</p>
      <p style="font-size: 13px; color: var(--color-text-muted);">Please make sure the server is running by executing: <code style="font-family: var(--font-mono); background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px;">npm start</code> inside antigravity-platform/</p>
    `;
    console.error("Connection failed:", err);
  }
}

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

      // Proactively refresh logs when opening logs tab
      if (tabId === "logs") {
        fetchLogs();
      }
    });
  });
}

// Populate Overview Tab
function loadOverviewTab() {
  const container = document.getElementById("progress-list-container");
  container.innerHTML = "";

  let totalPct = 0;
  let keysCount = 0;

  for (const [key, value] of Object.entries(completionStatus)) {
    if (key === 'history') continue;
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
    totalPct += value;
    keysCount++;
  }

  // Update overall completion value
  const overallAvg = keysCount > 0 ? (totalPct / keysCount) : 0;
  const overallPctText = `${(overallAvg * 100).toFixed(0)}%`;
  
  const compValEl = document.getElementById("completion-value");
  if (compValEl) compValEl.textContent = overallPctText;
  
  const compProgressEl = document.getElementById("completion-progress");
  if (compProgressEl) compProgressEl.style.width = overallPctText;

  // Update active skills metric card
  const skillsCountEl = document.getElementById("skills-count");
  if (skillsCountEl) skillsCountEl.textContent = skillsRegistry.length;
}

// Populate Project DNA Tab
function loadProjectDnaTab() {
  const container = document.getElementById("dna-grid-container");
  container.innerHTML = "";

  for (const [key, value] of Object.entries(projectDna)) {
    const card = document.createElement("div");
    card.className = "dna-card";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.innerHTML = `
      <div class="dna-label">${key.replace('_', ' ')}</div>
      <input type="text" class="dna-input-field" id="dna-input-${key}" value="${value}" style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 6px; color: var(--color-text); padding: 8px 12px; font-family: var(--font-sans); font-size: 14px; margin-top: 4px; transition: border 0.3s;" onfocus="this.style.borderColor='var(--accent-blue)'" onblur="this.style.borderColor='var(--glass-border)'">
    `;
    container.appendChild(card);
  }

  // Create save action button
  const actionRow = document.createElement("div");
  actionRow.style.gridColumn = "1 / -1";
  actionRow.style.display = "flex";
  actionRow.style.alignItems = "center";
  actionRow.style.gap = "16px";
  actionRow.style.marginTop = "12px";
  actionRow.innerHTML = `
    <button class="btn btn-primary" id="btn-save-dna">Save Project DNA</button>
    <span id="save-dna-status" style="font-size: 14px; font-weight: 500;"></span>
  `;
  container.appendChild(actionRow);

  document.getElementById("btn-save-dna").addEventListener("click", async () => {
    const statusSpan = document.getElementById("save-dna-status");
    statusSpan.textContent = "Writing variables...";
    statusSpan.style.color = "var(--accent-amber)";

    const updates = {};
    for (const key of Object.keys(projectDna)) {
      const inputEl = document.getElementById(`dna-input-${key}`);
      if (inputEl) {
        updates[key] = inputEl.value;
      }
    }

    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const nextState = await res.json();
      
      // Update local variables
      for (const [k, v] of Object.entries(updates)) {
        projectDna[k] = v;
      }

      statusSpan.textContent = "✓ Configurations successfully updated!";
      statusSpan.style.color = "var(--accent-emerald)";
      
      // Sync badge
      document.getElementById("active-project-name").textContent = projectDna.project_name;

      setTimeout(() => {
        statusSpan.textContent = "";
      }, 4000);
    } catch (err) {
      statusSpan.textContent = "❌ Save failed: " + err.message;
      statusSpan.style.color = "var(--accent-crimson)";
    }
  });
}

// Populate Skills Tab
function loadSkillsTab() {
  const gridContainer = document.getElementById("skills-grid-container");
  const detailContainer = document.getElementById("skill-detail-container");
  gridContainer.innerHTML = "";

  skillsRegistry.forEach(skill => {
    const card = document.createElement("div");
    card.className = "skill-card";
    card.innerHTML = `
      <h4>${skill.name}</h4>
      <span>ID: ${skill.id}</span>
    `;
    card.addEventListener("click", async () => {
      // Highlight selected card
      document.querySelectorAll(".skill-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      
      detailContainer.innerHTML = `
        <div class="empty-state">
          <p>Querying file registry...</p>
        </div>
      `;

      try {
        const res = await fetch(`/api/skill-detail?id=${skill.id}`);
        const data = await res.json();
        
        renderSkillDetail(skill, data);
      } catch (err) {
        detailContainer.innerHTML = `
          <div class="empty-state" style="color: var(--accent-crimson);">
            <span>⚠️</span>
            <p>Failed to retrieve skill details: ${err.message}</p>
          </div>
        `;
      }
    });
    gridContainer.appendChild(card);
  });
}

function renderSkillDetail(skill, data) {
  const detailContainer = document.getElementById("skill-detail-container");
  detailContainer.innerHTML = `
    <h3 style="color: var(--accent-blue); font-size: 22px; margin-bottom: 8px;">${skill.name}</h3>
    <p class="description" style="font-size: 14px; margin-bottom: 20px;">Category Domain: ${skill.domain || "robotics"}</p>
    
    <div class="file-tabs" style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--glass-border); padding-bottom: 8px;">
      <button class="file-tab btn-tab active" data-file="skill" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 6px 12px; font-weight: 600; font-size: 13px; border-radius: 4px; transition: all 0.3s;">skill.md</button>
      <button class="file-tab btn-tab" data-file="validation" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 6px 12px; font-weight: 600; font-size: 13px; border-radius: 4px; transition: all 0.3s;">validation.md</button>
      <button class="file-tab btn-tab" data-file="deps" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 6px 12px; font-weight: 600; font-size: 13px; border-radius: 4px; transition: all 0.3s;">dependencies.yaml</button>
    </div>

    <div class="file-viewer-container">
      <pre id="file-code-view" style="white-space: pre-wrap; font-family: var(--font-mono); font-size: 13px; padding: 16px; background: rgba(5, 6, 8, 0.7); border-radius: 8px; border: 1px solid var(--glass-border); color: #cbd5e1; line-height: 1.5; max-height: 420px; overflow-y: auto;"></pre>
    </div>
  `;

  const codeView = document.getElementById("file-code-view");
  const tabButtons = detailContainer.querySelectorAll(".file-tab");

  const showFile = (fileType) => {
    tabButtons.forEach(btn => {
      if (btn.getAttribute("data-file") === fileType) {
        btn.classList.add("active");
        btn.style.color = "var(--color-text)";
        btn.style.backgroundColor = "var(--glass-hover)";
      } else {
        btn.classList.remove("active");
        btn.style.color = "var(--color-text-muted)";
        btn.style.backgroundColor = "transparent";
      }
    });

    if (fileType === "skill") {
      codeView.textContent = data.skill_md || "# No skill.md content found.";
    } else if (fileType === "validation") {
      codeView.textContent = data.validation_md || "# No validation.md content found.";
    } else if (fileType === "deps") {
      codeView.textContent = data.dependencies_yaml || "# No dependencies.yaml content found.";
    }
  };

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      showFile(btn.getAttribute("data-file"));
    });
  });

  showFile("skill");
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
    runActualPipeline();
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

async function runActualPipeline() {
  const triggerBtn = document.getElementById("btn-trigger-pipeline");
  triggerBtn.disabled = true;
  triggerBtn.textContent = "⚡ Running Pipeline...";
  
  // Clear console
  document.getElementById("console-output-container").innerHTML = "";
  
  // Reset steps statuses
  EXECUTION_STEPS.forEach(step => {
    const node = document.getElementById(`step-node-${step.id}`);
    const statusText = document.getElementById(`step-status-${step.id}`);
    node.className = "dag-step";
    statusText.textContent = "PENDING";
  });

  appendConsoleLine("[System] Dispatching topological execution request...", "system");
  
  try {
    const res = await fetch('/api/execute-pipeline', { method: 'POST' });
    const data = await res.json();
    
    if (data.success) {
      const phaseToUiId = {
        'Requirements': 'reqs',
        'Architecture': 'arch',
        'CAD': 'cad',
        'PCB': 'pcb',
        'Firmware': 'firmware',
        'Simulation': 'sim',
        'Validation': 'val'
      };

      for (const phase of data.order) {
        const uiId = phaseToUiId[phase];
        const node = document.getElementById(`step-node-${uiId}`);
        const statusText = document.getElementById(`step-status-${uiId}`);
        
        if (!node) continue;
        
        node.className = "dag-step running";
        statusText.textContent = "RUNNING";
        
        appendConsoleLine(`Verifying node: ${phase}...`, "info");
        await new Promise(r => setTimeout(r, 50)); // Sleek micro-delay for visual aesthetic
        
        const status = data.steps[phase];
        if (status === 'SUCCESS') {
          node.className = "dag-step success";
          statusText.textContent = "SUCCESS";
          appendConsoleLine(`✓ Verified node ${phase} successfully.`, "success");
        } else {
          node.className = "dag-step error";
          statusText.textContent = "FAILED";
          appendConsoleLine(`❌ Node ${phase} failed constraints validation.`, "error");
        }
      }

      appendConsoleLine("\n[System] Compiling full execution run audit log...", "system");
      data.console.forEach(line => {
        let type = "info";
        if (line.includes("successfully") || line.includes("passed") || line.includes("OK")) type = "success";
        else if (line.includes("FAILED") || line.includes("Error") || line.includes("conflict")) type = "error";
        appendConsoleLine(line, type);
      });

      // Update local state
      completionStatus = data.completion;
      loadOverviewTab();
    } else {
      appendConsoleLine("Topological execution engine error: " + data.error, "error");
    }
  } catch (err) {
    appendConsoleLine("Ecosystem API server offline: " + err.message, "error");
  }

  triggerBtn.disabled = false;
  triggerBtn.textContent = "Trigger Pipeline Execution";
}

// Populate Logs Tab
function loadLogsTab() {
  fetchLogs();

  const filterInput = document.getElementById("log-trace-filter");
  // Remove event listeners to prevent duplication
  const newFilterInput = filterInput.cloneNode(true);
  filterInput.parentNode.replaceChild(newFilterInput, filterInput);

  newFilterInput.addEventListener("input", async (e) => {
    const val = e.target.value.trim().toLowerCase();
    try {
      const logsRes = await fetch('/api/logs');
      const logsData = await logsRes.json();
      
      if (!val) {
        renderLogs(logsData);
      } else {
        const filtered = logsData.filter(log => 
          (log.trace_id && log.trace_id.toLowerCase().includes(val)) ||
          (log.message && log.message.toLowerCase().includes(val)) ||
          (log.event && log.event.toLowerCase().includes(val)) ||
          (log.severity && log.severity.toLowerCase().includes(val))
        );
        renderLogs(filtered);
      }
    } catch (err) {
      console.error("Filter logs fetch failed:", err);
    }
  });
}

async function fetchLogs() {
  try {
    const res = await fetch('/api/logs');
    const data = await res.json();
    renderLogs(data);
  } catch (err) {
    document.getElementById("logs-list-container").innerHTML = `
      <div class="log-row" style="color: var(--accent-crimson);">Failed to load audit logs: ${err.message}</div>
    `;
  }
}

function renderLogs(logs) {
  const container = document.getElementById("logs-list-container");
  container.innerHTML = "";

  if (logs.length === 0) {
    container.innerHTML = `<div class="log-row" style="color: var(--color-text-muted);">No records found.</div>`;
    return;
  }

  logs.forEach(log => {
    const row = document.createElement("div");
    row.className = "log-row";
    
    const timeStr = log.timestamp ? log.timestamp.slice(11, 19) : "00:00:00";
    const agentStr = log.agent || "system";
    const severityStr = log.severity || "info";
    const messageStr = log.message || "";

    row.innerHTML = `
      <span class="log-time">[${timeStr}]</span>
      <span class="log-severity ${severityStr}">${severityStr}</span>
      <span class="log-msg">[${agentStr}] ${messageStr}</span>
    `;
    container.appendChild(row);
  });
}

// Setup Search Tab
function setupSearchTab() {
  const btn = document.getElementById("btn-search-query");
  const input = document.getElementById("search-input");
  const resultsContainer = document.getElementById("search-results-output");

  // Clone to avoid multiple listener bindings
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  // Clone input to avoid multiple keydown listener bindings
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);

  const performSearch = async () => {
    const query = newInput.value.trim();
    if (!query) return;

    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>Querying semantic router on backend...</p>
      </div>
    `;

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();

      resultsContainer.innerHTML = "";

      if (!data.success) {
        resultsContainer.innerHTML = `
          <div class="search-result-card" style="border-color: var(--accent-amber);">
            <h4>No matching capabilities found</h4>
            <p class="description">${data.message || 'Try searching for keywords like kinematics, cad, pcb, or simulation.'}</p>
          </div>
        `;
        return;
      }

      const match = data.matched_skill;
      const confidence = data.confidence_score;
      const deps = data.dependencies_to_load.length > 0 ? data.dependencies_to_load.join(", ") : "None";

      const card = document.createElement("div");
      card.className = "search-result-card";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <h4>${match.name}</h4>
          <span style="background-color: rgba(59, 130, 246, 0.15); color: var(--accent-blue); padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 600;">
            Confidence: ${(confidence * 100).toFixed(0)}%
          </span>
        </div>
        <p class="description" style="margin-top: 8px; margin-bottom: 12px;">Tag category: ${match.tags ? match.tags.join(', ') : 'robotics'}</p>
        <div style="font-family: var(--font-mono); font-size: 13px; color: #cbd5e1; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; border: 1px solid var(--glass-border);">
          <div><strong>Entrypoint:</strong> ${match.entrypoint}</div>
          <div style="margin-top: 4px;"><strong>Validation Protocol:</strong> ${match.validation}</div>
          <div style="margin-top: 4px; color: #f59e0b;"><strong>Transitive dependencies to resolve:</strong> ${deps}</div>
        </div>
      `;
      resultsContainer.appendChild(card);
    } catch (err) {
      resultsContainer.innerHTML = `
        <div class="search-result-card" style="border-color: var(--accent-crimson);">
          <h4 style="color: var(--accent-crimson);">Search Query Failed</h4>
          <p class="description" style="color: var(--accent-crimson);">${err.message}</p>
        </div>
      `;
    }
  };

  newBtn.addEventListener("click", performSearch);

  newInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });
}
