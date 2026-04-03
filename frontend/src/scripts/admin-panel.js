import { apiBase, appRoutes } from "./runtime-config.js";
const storedAdmin = sessionStorage.getItem("admin_user");
const adminAuthToken = sessionStorage.getItem("admin_auth_token");

if (!storedAdmin || !adminAuthToken) {
  window.location.replace(appRoutes.adminLogin);
}

const adminUser = storedAdmin ? JSON.parse(storedAdmin) : null;
const wards = Array.from({ length: 33 }, (_, index) => String(index + 1));

const state = {
  dashboard: null,
  departments: [],
  officers: [],
  rotations: [],
  oversight: {
    escalated: [],
    invalidPending: [],
    officerActionReviews: [],
  },
  complaints: [],
  activeSection: "dashboard",
  activeOversightTab: "escalated",
  selectedOversightToken: "",
};

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAuthToken}`,
      ...(options.headers || {}),
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Request failed.");
  }
  return result;
}

function renderSummaryCards(targetId, cards) {
  const node = document.getElementById(targetId);
  if (!node) return;
  node.innerHTML = cards
    .map(
      (card) => `
        <article class="admin-orbit-metric ${card.tone || ""}">
          <p>${card.label}</p>
          <strong>${card.value}</strong>
          <span>${card.note || ""}</span>
        </article>
      `,
    )
    .join("");
}

function renderBarStack(targetId, items, formatter = (item) => `${item.count}`) {
  const node = document.getElementById(targetId);
  if (!node) return;

  if (!items.length) {
    node.innerHTML = `<div class="admin-empty-state">No data available.</div>`;
    return;
  }

  const max = Math.max(...items.map((item) => item.count || item.total || 0), 1);
  node.innerHTML = `
    <div class="admin-orbit-bars">
      ${items
        .map((item) => {
          const value = item.count || item.total || 0;
          return `
            <div class="admin-orbit-bar">
              <div class="admin-orbit-bar-head">
                <span>${item.label}</span>
                <strong>${formatter(item)}</strong>
              </div>
              <div class="admin-orbit-bar-track">
                <div class="admin-orbit-bar-fill" style="width:${Math.max(10, (value / max) * 100)}%"></div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

// Chart.js instance store — destroy before re-creating to avoid canvas reuse errors
const chartInstances = {};

const CHART_COLORS = {
  blue: "rgba(26,58,107,0.85)",
  green: "rgba(40,167,69,0.85)",
  amber: "rgba(255,193,7,0.85)",
  red: "rgba(220,53,69,0.85)",
  teal: "rgba(32,178,170,0.85)",
  purple: "rgba(111,66,193,0.85)",
  palette: ["#1a3a6b","#2ecc71","#f39c12","#e74c3c","#3498db","#9b59b6","#1abc9c","#e67e22","#e91e63","#00bcd4"],
};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function renderHorizontalBarChart(canvasId, items, labelKey = "label", valueKey = "count") {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (!items || !items.length) {
    canvas.parentElement.innerHTML = `<div class="admin-empty-state">No data available.</div>`;
    return;
  }
  chartInstances[canvasId] = new Chart(canvas, {
    type: "bar",
    data: {
      labels: items.map((item) => item[labelKey]),
      datasets: [{
        label: "Complaints",
        data: items.map((item) => item[valueKey] || 0),
        backgroundColor: CHART_COLORS.palette.slice(0, items.length),
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

function renderSolvedByDeptChart(canvasId, items) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (!items || !items.length) {
    canvas.parentElement.innerHTML = `<div class="admin-empty-state">No data available.</div>`;
    return;
  }
  chartInstances[canvasId] = new Chart(canvas, {
    type: "bar",
    data: {
      labels: items.map((item) => item.label),
      datasets: [
        {
          label: "Solved",
          data: items.map((item) => item.solved || 0),
          backgroundColor: CHART_COLORS.green,
          borderRadius: 4,
        },
        {
          label: "Total",
          data: items.map((item) => (item.total || 0) - (item.solved || 0)),
          backgroundColor: "rgba(200,200,200,0.5)",
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            afterTitle: (tooltipItems) => {
              const item = items[tooltipItems[0].dataIndex];
              return `${item.percent || 0}% resolved`;
            },
          },
        },
      },
      scales: { x: { beginAtZero: true, stacked: false, ticks: { precision: 0 } }, y: { stacked: false } },
    },
  });
}

function renderDoughnutChart(canvasId, items, labelKey = "label", valueKey = "count") {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (!items || !items.length) {
    canvas.parentElement.innerHTML = `<div class="admin-empty-state">No data available.</div>`;
    return;
  }
  chartInstances[canvasId] = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: items.map((item) => item[labelKey]),
      datasets: [{
        data: items.map((item) => item[valueKey] || 0),
        backgroundColor: [CHART_COLORS.amber, CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.red, CHART_COLORS.teal, CHART_COLORS.purple],
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });
}

function renderCompactCards(targetId, items, emptyText) {
  const node = document.getElementById(targetId);
  if (!node) return;

  if (!items.length) {
    node.innerHTML = `<div class="admin-empty-state">${emptyText}</div>`;
    return;
  }

  node.innerHTML = items
    .map(
      (item) => `
        <article class="admin-orbit-card compact">
          <div class="admin-orbit-card-head">
            <span class="admin-orbit-pill ${item.status || ""}">${(item.status || "open").replaceAll("_", " ")}</span>
            <strong>${item.tokenNumber || item.name}</strong>
          </div>
          <h4>${item.title || item.name}</h4>
          <p>${item.assignedOfficeLabel || item.text || item.reviewMeta?.note || "-"}</p>
        </article>
      `,
    )
    .join("");
}

function getDepartmentByCode(code) {
  return state.departments.find((department) => department.code === code) || null;
}

function getOversightQueue() {
  if (state.activeOversightTab === "invalid") return state.oversight.invalidPending;
  if (state.activeOversightTab === "reviews") return state.oversight.officerActionReviews;
  return state.oversight.escalated;
}

function getSelectedComplaint() {
  return state.complaints.find((complaint) => complaint.tokenNumber === state.selectedOversightToken) || null;
}

function renderDashboard() {
  if (!state.dashboard) return;
  const { overview, charts } = state.dashboard;

  renderSummaryCards("dashboard-top-metrics", [
    { label: "Monthly complaints", value: overview.totalComplaintsMonth, note: "Current reporting month" },
    { label: "Solved rate", value: `${overview.solvedRate}%`, note: "City-wide resolution ratio", tone: "success" },
    { label: "Pending", value: overview.pending, note: "Needs operational follow-up", tone: "warning" },
    { label: "Escalated", value: overview.escalated, note: "Central admin decisions due", tone: "danger" },
    { label: "Active officers", value: overview.officers, note: `${overview.activeRotations} active rotations` },
  ]);

  renderHorizontalBarChart("dashboard-department-chart", charts.complaintsByDepartment);
  renderSolvedByDeptChart("dashboard-solved-chart", charts.solvedByDepartment);

  renderCompactCards("dashboard-escalations-list", state.oversight.escalated.slice(0, 4), "No escalated complaints right now.");
  renderCompactCards("dashboard-invalid-list", state.oversight.invalidPending.slice(0, 4), "No invalid complaints awaiting verification.");
  renderCompactCards("dashboard-reviews-list", state.oversight.officerActionReviews.slice(0, 4), "No officer action reviews pending.");

  setText("nav-dashboard-count", String(overview.totalComplaintsMonth));
  setText("nav-officer-count", String(overview.officers));
  setText(
    "nav-oversight-count",
    String(state.oversight.escalated.length + state.oversight.invalidPending.length + state.oversight.officerActionReviews.length),
  );
  setText("nav-analytics-rate", `${overview.solvedRate}%`);
}

function fillDepartmentOptions(selectId, allowBlank = false) {
  const node = document.getElementById(selectId);
  if (!node) return;
  const currentValue = node.value;
  node.innerHTML = `${allowBlank ? `<option value="">Select department</option>` : ""}${state.departments
    .map((department) => `<option value="${department.code}" ${currentValue === department.code ? "selected" : ""}>${department.name}</option>`)
    .join("")}`;
}

function fillSubDepartmentOptions(selectId, departmentCode, allowBlank = false) {
  const node = document.getElementById(selectId);
  if (!node) return;
  const currentValue = node.value;
  const department = getDepartmentByCode(departmentCode) || state.departments[0];
  const options = department?.subDepartments || [];
  node.innerHTML = `${allowBlank ? `<option value="">Select sub department</option>` : ""}${options
    .map((subDepartment) => `<option value="${subDepartment}" ${currentValue === subDepartment ? "selected" : ""}>${subDepartment}</option>`)
    .join("")}`;
}

function fillWardOptions() {
  const node = document.getElementById("officer-ward-number");
  if (!node) return;
  const currentValue = node.value;
  node.innerHTML = `<option value="">Select ward</option>${wards
    .map((ward) => `<option value="${ward}" ${currentValue === ward ? "selected" : ""}>Ward ${ward}</option>`)
    .join("")}`;
}

function fillOfficerSelect(selectId, includeBlank = true) {
  const node = document.getElementById(selectId);
  if (!node) return;
  const currentValue = node.value;
  node.innerHTML = `${includeBlank ? `<option value="">Select officer</option>` : ""}${state.officers
    .map((officer) => `<option value="${officer.id}" ${currentValue === officer.id ? "selected" : ""}>${officer.name} · ${officer.divisionName || `Ward ${officer.wardNumber}`}</option>`)
    .join("")}`;
}

function syncOfficerFormFields() {
  const form = document.getElementById("officer-form");
  if (!form) return;
  const officeType = form.elements.officeType.value;
  const departmentField = form.querySelector(".officer-department-field");
  const subDepartmentField = form.querySelector(".officer-subdepartment-field");
  const wardField = form.querySelector(".officer-ward-field");
  if (!departmentField || !subDepartmentField || !wardField) return;

  departmentField.classList.toggle("hidden", officeType !== "department");
  subDepartmentField.classList.toggle("hidden", officeType !== "department");
  wardField.classList.toggle("hidden", officeType !== "ward");

  const selectedDepartmentCode = form.elements.departmentCode.value || state.departments[0]?.code || "";
  fillSubDepartmentOptions("officer-subdepartment", selectedDepartmentCode, true);
}

function renderActiveOfficerGroups() {
  const node = document.getElementById("active-officer-groups");
  if (!node) return;

  const activeOfficers = state.officers.filter((officer) => officer.status === "active");
  const departmentGroups = new Map();
  const wardGroups = new Map();

  activeOfficers.forEach((officer) => {
    if (officer.officeType === "department") {
      const key = `${officer.divisionName}__${officer.sectionName || "Division-wide"}`;
      const list = departmentGroups.get(key) || [];
      list.push(officer);
      departmentGroups.set(key, list);
      return;
    }
    const key = `Ward ${officer.wardNumber}`;
    const list = wardGroups.get(key) || [];
    list.push(officer);
    wardGroups.set(key, list);
  });

  const renderPendingAdjustments = (officer) => {
    const pending = (officer.performanceAdjustments || [])
      .map((adj, idx) => ({ ...adj, idx }))
      .filter((adj) => adj.status === "pending");
    if (!pending.length) return "";
    return `
      <div class="admin-orbit-pending-adjustments">
        <strong style="font-size:0.75rem;color:#c9a227">⏳ Pending point adjustments:</strong>
        ${pending.map((adj) => `
          <div class="admin-orbit-adj-row">
            <span>${adj.points > 0 ? "+" : ""}${adj.points} pts — ${adj.message || "No reason"}</span>
            <button type="button" class="button compact-button" data-verify-adj="${officer.id}" data-adj-idx="${adj.idx}" data-adj-action="verify" style="padding:2px 8px;font-size:0.7rem">Verify</button>
            <button type="button" class="button secondary compact-button" data-verify-adj="${officer.id}" data-adj-idx="${adj.idx}" data-adj-action="reject" style="padding:2px 8px;font-size:0.7rem">Reject</button>
          </div>
        `).join("")}
      </div>
    `;
  };

  const renderGroup = (title, items) => `
    <section class="admin-orbit-group">
      <h4>${title}</h4>
      <div class="admin-orbit-group-list">
        ${items
          .map(
            (officer) => `
              <article class="admin-orbit-card">
                <div class="admin-orbit-card-head">
                  <strong>${officer.name}</strong>
                  <span class="admin-orbit-pill success">Active</span>
                </div>
                <p>${officer.loginId} · ${officer.email || "No email"}</p>
                <div style="display:flex;gap:12px;font-size:0.8rem;margin:4px 0">
                  <span>Week pts: <strong>${officer.currentWeekPoints || 0}</strong></span>
                  <span>All-time: <strong>${officer.allTimePoints || 0}</strong></span>
                </div>
                ${renderPendingAdjustments(officer)}
                <div class="admin-orbit-card-actions" style="flex-wrap:wrap;gap:4px">
                  <button type="button" class="button secondary compact-button" data-edit-officer="${officer.id}">Edit</button>
                  <button type="button" class="button secondary compact-button" data-toggle-officer="${officer.id}">Deactivate</button>
                  <button type="button" class="button compact-button" data-adjust-points="${officer.id}" style="background:#c9a227;border-color:#c9a227">± Points</button>
                </div>
                <div class="admin-orbit-points-form" id="points-form-${officer.id}" style="display:none;margin-top:8px;padding:8px;background:#f8f9fa;border-radius:6px">
                  <input type="number" placeholder="Points (+/−)" id="points-value-${officer.id}" style="width:90px;margin-right:6px;padding:4px 8px;border:1px solid #ddd;border-radius:4px" />
                  <input type="text" placeholder="Reason (required)" id="points-reason-${officer.id}" style="width:160px;margin-right:6px;padding:4px 8px;border:1px solid #ddd;border-radius:4px" />
                  <button type="button" class="button compact-button" data-submit-points="${officer.id}" style="padding:4px 10px">Apply</button>
                  <span id="points-msg-${officer.id}" style="font-size:0.75rem;margin-left:6px"></span>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;

  const sections = [
    ...[...departmentGroups.entries()].map(([title, items]) => renderGroup(title.replaceAll("__", " / "), items)),
    ...[...wardGroups.entries()].map(([title, items]) => renderGroup(title, items)),
  ];

  node.innerHTML = sections.length ? sections.join("") : `<div class="admin-empty-state">No active officers available.</div>`;
}

function renderRotations() {
  const node = document.getElementById("rotations-list");
  if (!node) return;

  if (!state.rotations.length) {
    node.innerHTML = `<div class="admin-empty-state">No rotations scheduled yet.</div>`;
    return;
  }

  node.innerHTML = state.rotations
    .map(
      (rotation) => `
        <article class="admin-orbit-card compact">
          <div class="admin-orbit-card-head">
            <strong>${rotation.officerName}</strong>
            <span class="admin-orbit-pill ${rotation.active ? "success" : "warning"}">${rotation.active ? "Active" : "Scheduled"}</span>
          </div>
          <p>${rotation.divisionName || `Ward ${rotation.wardNumber}`}${rotation.sectionName ? ` / ${rotation.sectionName}` : ""}</p>
          <small>${formatDate(rotation.startDate)} to ${formatDate(rotation.endDate)}</small>
        </article>
      `,
    )
    .join("");
}

function renderOversightList() {
  const node = document.getElementById("oversight-list");
  if (!node) return;

  const items = getOversightQueue();
  setText(
    "oversight-list-title",
    state.activeOversightTab === "reviews"
      ? "Cross-week officer validations"
      : state.activeOversightTab === "invalid"
        ? "Invalid complaint verification"
        : "Escalations awaiting central admin response",
  );
  setText(
    "oversight-queue-kicker",
    state.activeOversightTab === "reviews"
      ? "Officer action reviews"
      : state.activeOversightTab === "invalid"
        ? "Invalid complaints"
        : "Escalated queue",
  );

  if (!items.length) {
    node.innerHTML = `<div class="admin-empty-state">Nothing is waiting in this queue.</div>`;
    return;
  }

  node.innerHTML = items
    .map(
      (complaint) => `
        <article class="admin-orbit-card ${state.selectedOversightToken === complaint.tokenNumber ? "selected" : ""}">
          <div class="admin-orbit-card-head">
            <strong>${complaint.tokenNumber}</strong>
            <span class="admin-orbit-pill ${complaint.status}">${complaint.status.replaceAll("_", " ")}</span>
          </div>
          <h4>${complaint.title}</h4>
          <p>${complaint.assignedOfficeLabel || complaint.assignedDepartment || "-"}</p>
          <small>${formatDateTime(complaint.updatedAt || complaint.createdAt)}</small>
          <div class="admin-orbit-card-actions">
            <button type="button" class="button compact-button" data-select-oversight="${complaint.tokenNumber}">Open</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function syncOversightMode() {
  const escalated = document.querySelector(".oversight-mode-escalated");
  const invalid = document.querySelector(".oversight-mode-invalid");
  const reviews = document.querySelector(".oversight-mode-reviews");
  escalated?.classList.toggle("hidden", state.activeOversightTab !== "escalated");
  invalid?.classList.toggle("hidden", state.activeOversightTab !== "invalid");
  reviews?.classList.toggle("hidden", state.activeOversightTab !== "reviews");
}

function renderOversightDetail() {
  const complaint = getSelectedComplaint();
  const detailNode = document.getElementById("oversight-detail");
  const emptyNode = document.getElementById("oversight-detail-empty");
  const form = document.getElementById("oversight-action-form");
  if (!detailNode || !emptyNode || !form) return;

  syncOversightMode();

  if (!complaint) {
    detailNode.classList.add("hidden");
    form.classList.add("hidden");
    emptyNode.classList.remove("hidden");
    return;
  }

  emptyNode.classList.add("hidden");
  detailNode.classList.remove("hidden");
  form.classList.remove("hidden");
  form.elements.tokenNumber.value = complaint.tokenNumber;

  detailNode.innerHTML = `
    <div class="admin-orbit-detail">
      <div class="admin-orbit-card-head">
        <strong>${complaint.tokenNumber}</strong>
        <span class="admin-orbit-pill ${complaint.status}">${complaint.status.replaceAll("_", " ")}</span>
      </div>
      <h3>${complaint.title}</h3>
      <p>${complaint.description || "-"}</p>
      <div class="admin-orbit-detail-grid">
        <div>
          <h4>Current office</h4>
          <p>${complaint.assignedOfficeLabel || complaint.assignedDepartment || "-"}</p>
        </div>
        <div>
          <h4>Citizen</h4>
          <p>${complaint.citizenName || "Anonymous"}${complaint.citizenPhone ? ` · ${complaint.citizenPhone}` : ""}</p>
        </div>
        <div>
          <h4>Location</h4>
          <p>${complaint.locationText || "-"}${complaint.wardNumber ? ` · Ward ${complaint.wardNumber}` : ""}</p>
        </div>
        <div>
          <h4>Latest officer</h4>
          <p>${complaint.assignedOfficerName || "Unassigned"}</p>
        </div>
      </div>
      ${complaint.reviewMeta ? `
        <div class="admin-orbit-review-note">
          <strong>Officer review context</strong>
          <p>${complaint.reviewMeta.note || "-"}</p>
        </div>
      ` : ""}
      ${complaint.handoverFlag ? `
        <div class="admin-orbit-review-note" style="background:#fff8e1;border-left:4px solid #c9a227;padding:10px;margin-top:10px;border-radius:4px">
          <strong style="color:#c9a227">⚑ Handover Flag</strong>
          <p style="margin:4px 0">Flagged by: <strong>${complaint.handoverFlag.flaggedByOfficerName || "Officer"}</strong></p>
          <p style="margin:4px 0">Reason: ${complaint.handoverFlag.reason}</p>
          <p style="margin:4px 0;font-size:0.75rem;color:#666">Status: <strong>${complaint.handoverFlagStatus || "pending"}</strong> · ${new Date(complaint.handoverFlag.flaggedAt).toLocaleString()}</p>
        </div>
      ` : ""}
    </div>
  `;
}

function getFilteredComplaints() {
  const departmentCode = document.getElementById("analytics-department-filter")?.value || "";
  const officerId = document.getElementById("analytics-officer-filter")?.value || "";
  const dateFrom = document.getElementById("analytics-date-from")?.value || "";
  const dateTo = document.getElementById("analytics-date-to")?.value || "";
  const departmentName = getDepartmentByCode(departmentCode)?.name || "";

  return state.complaints.filter((complaint) => {
    const createdAt = new Date(complaint.createdAt).getTime();
    return (!departmentCode || complaint.divisionName === departmentName)
      && (!officerId || complaint.assignedOfficerId === officerId)
      && (!dateFrom || createdAt >= new Date(dateFrom).getTime())
      && (!dateTo || createdAt <= new Date(`${dateTo}T23:59:59`).getTime());
  });
}

function renderDepartmentList() {
  const node = document.getElementById("dept-list");
  if (!node) return;
  const depts = state.departments || [];
  document.getElementById("nav-dept-count").textContent = depts.length;

  if (!depts.length) {
    node.innerHTML = `<div class="admin-empty-state">No departments registered.</div>`;
    return;
  }

  node.innerHTML = depts.map((dept) => `
    <article class="admin-orbit-card" style="margin-bottom:8px">
      <div class="admin-orbit-card-head">
        <strong>${dept.name}</strong>
        <span class="admin-orbit-pill ${dept.active !== false ? "success" : ""}">${dept.code}</span>
      </div>
      <p style="font-size:0.8rem;color:#666">${dept.type || "Mahashakha"} ${dept.description ? "· " + dept.description : ""}</p>
      <div class="admin-orbit-card-actions">
        <button type="button" class="button secondary compact-button" data-edit-dept="${dept.code}">Edit</button>
        <button type="button" class="button secondary compact-button" style="color:#e74c3c;border-color:#e74c3c" data-delete-dept="${dept.code}">Delete</button>
      </div>
    </article>
  `).join("");
}

function renderAnalytics() {
  fillDepartmentOptions("analytics-department-filter", true);
  fillOfficerSelect("analytics-officer-filter", true);

  const complaints = getFilteredComplaints();
  const pending = complaints.filter((item) => item.status === "pending").length;
  const inProgress = complaints.filter((item) => item.status === "in_progress").length;
  const solved = complaints.filter((item) => item.status === "solved").length;
  const forwarded = complaints.filter((item) => item.status === "forwarded").length;
  const higherLevel = complaints.filter((item) => item.forwardedToLabel === "Transferred to higher level authority" || item.status === "escalated").length;

  renderSummaryCards("analytics-summary-cards", [
    { label: "Filtered complaints", value: complaints.length, note: "Current report scope" },
    { label: "Solved", value: solved, note: "Closed and verified", tone: "success" },
    { label: "Pending", value: pending, note: "Waiting for first action", tone: "warning" },
    { label: "Forward / higher-level", value: forwarded + higherLevel, note: "Requires coordination", tone: "danger" },
  ]);

  renderDoughnutChart("analytics-status-chart", [
    { label: "Pending", count: pending },
    { label: "In Progress", count: inProgress },
    { label: "Solved", count: solved },
    { label: "Delayed", count: complaints.filter((item) => item.status === "delayed").length },
    { label: "Forwarded", count: forwarded },
    { label: "Escalated", count: higherLevel },
  ]);

  renderHorizontalBarChart("analytics-forward-chart", [
    { label: "Transferred to department", count: forwarded },
    { label: "Transferred to higher level", count: higherLevel },
  ]);

  renderBarStack(
    "analytics-officer-leaderboard",
    state.officers
      .map((officer) => ({ label: officer.name, count: officer.currentWeekPoints }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  );

  const tableNode = document.getElementById("analytics-report-table");
  if (!tableNode) return;
  if (!complaints.length) {
    tableNode.innerHTML = `<div class="admin-empty-state">No complaints match these filters.</div>`;
    return;
  }

  tableNode.innerHTML = `
    <div class="admin-table-wrap">
      <table class="department-work-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Title</th>
            <th>Department</th>
            <th>Status</th>
            <th>Officer</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          ${complaints
            .slice(0, 20)
            .map(
              (complaint) => `
                <tr>
                  <td>${complaint.tokenNumber}</td>
                  <td>${complaint.title}</td>
                  <td>${complaint.divisionName || `Ward ${complaint.wardNumber || "-"}`}</td>
                  <td>${complaint.status.replaceAll("_", " ")}</td>
                  <td>${complaint.assignedOfficerName || "-"}</td>
                  <td>${formatDateTime(complaint.updatedAt || complaint.createdAt)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderEverything() {
  setText(
    "admin-live-date",
    new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date()),
  );

  fillDepartmentOptions("officer-department-code", true);
  fillDepartmentOptions("oversight-target-department", true);
  fillSubDepartmentOptions("oversight-target-subdepartment", document.getElementById("oversight-target-department")?.value || state.departments[0]?.code || "", true);
  fillWardOptions();
  fillOfficerSelect("rotation-officer-select");
  syncOfficerFormFields();

  renderDashboard();
  renderActiveOfficerGroups();
  renderRotations();
  renderOversightList();
  renderOversightDetail();
  renderAnalytics();
  renderDepartmentList();
}

function setMessage(targetId, message, tone = "") {
  const node = document.getElementById(targetId);
  if (!node) return;
  node.className = `form-message ${tone}`.trim();
  node.textContent = message;
}

function resetOfficerForm() {
  const form = document.getElementById("officer-form");
  if (!form) return;
  form.reset();
  form.elements.editingOfficerId.value = "";
  form.elements.active.checked = true;
  form.elements.officeType.value = "department";
  fillDepartmentOptions("officer-department-code", true);
  syncOfficerFormFields();
  setMessage("officer-form-message", "");
}

async function loadAllData() {
  const [dashboard, departments, officers, rotations, oversight, complaints] = await Promise.all([
    request("/api/admin/dashboard"),
    request("/api/admin/departments"),
    request("/api/admin/officers"),
    request("/api/admin/rotations"),
    request("/api/admin/oversight"),
    request("/api/admin/complaints"),
  ]);

  state.dashboard = dashboard.dashboard;
  state.departments = departments.departments;
  state.officers = officers.officers;
  state.rotations = rotations.rotations;
  state.oversight = oversight.oversight;
  state.complaints = complaints.complaints;

  const queue = getOversightQueue();
  if (!queue.some((item) => item.tokenNumber === state.selectedOversightToken)) {
    state.selectedOversightToken = queue[0]?.tokenNumber || "";
  }

  renderEverything();
}

document.querySelectorAll(".admin-orbit-nav").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeSection = button.dataset.section;
    document.querySelectorAll(".admin-orbit-nav").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".admin-orbit-section").forEach((section) => {
      section.classList.toggle("active", section.id === `section-${state.activeSection}`);
    });
  });
});

document.querySelectorAll("[data-oversight-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeOversightTab = button.dataset.oversightTab;
    document.querySelectorAll("[data-oversight-tab]").forEach((item) => item.classList.toggle("active", item === button));
    const queue = getOversightQueue();
    state.selectedOversightToken = queue[0]?.tokenNumber || "";
    renderOversightList();
    renderOversightDetail();
  });
});

document.getElementById("officer-office-type")?.addEventListener("change", syncOfficerFormFields);
document.getElementById("officer-department-code")?.addEventListener("change", (event) => {
  fillSubDepartmentOptions("officer-subdepartment", event.target.value, true);
});
document.getElementById("oversight-target-department")?.addEventListener("change", (event) => {
  fillSubDepartmentOptions("oversight-target-subdepartment", event.target.value, true);
});

document.getElementById("officer-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const editingOfficerId = form.elements.editingOfficerId.value;
  const officeType = form.elements.officeType.value;
  const department = getDepartmentByCode(form.elements.departmentCode.value);
  const payload = {
    officeType,
    departmentCode: officeType === "department" ? (department?.code || "") : "",
    divisionName: officeType === "department" ? (department?.name || "") : "",
    sectionName: officeType === "department" ? String(form.elements.sectionName.value || "").trim() : "",
    wardNumber: officeType === "ward" ? String(form.elements.wardNumber.value || "").trim() : "",
    name: String(form.elements.name.value || "").trim(),
    email: String(form.elements.email.value || "").trim(),
    loginId: String(form.elements.loginId.value || "").trim(),
    password: String(form.elements.password.value || "").trim(),
    active: Boolean(form.elements.active.checked),
  };

  try {
    if (editingOfficerId) {
      await request(`/api/admin/officers/${editingOfficerId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMessage("officer-form-message", "Officer updated successfully.", "success");
    } else {
      await request("/api/admin/officers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("officer-form-message", "Officer saved with one-week activation.", "success");
    }
    resetOfficerForm();
    await loadAllData();
  } catch (error) {
    setMessage("officer-form-message", error.message, "error");
  }
});

document.getElementById("officer-reset-button")?.addEventListener("click", resetOfficerForm);

document.getElementById("rotation-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    await request("/api/admin/rotations", {
      method: "POST",
      body: JSON.stringify({
        officerId: String(form.elements.officerId.value || "").trim(),
        startDate: String(form.elements.startDate.value || "").trim(),
        endDate: String(form.elements.endDate.value || "").trim(),
      }),
    });
    form.reset();
    setMessage("rotation-form-message", "Rotation scheduled successfully.", "success");
    await loadAllData();
  } catch (error) {
    setMessage("rotation-form-message", error.message, "error");
  }
});

document.getElementById("oversight-action-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  let action = "";
  if (state.activeOversightTab === "escalated") {
    action = form.elements.action.value;
  } else if (state.activeOversightTab === "invalid") {
    action = form.elements.invalidAction.value;
  } else {
    action = form.elements.reviewAction.value;
  }

  const targetDepartment = getDepartmentByCode(form.elements.targetDivisionName.value);

  try {
    await request(`/api/admin/oversight/${form.elements.tokenNumber.value}`, {
      method: "PATCH",
      body: JSON.stringify({
        action,
        targetDivisionName: targetDepartment?.name || "",
        targetSectionName: String(form.elements.targetSectionName.value || "").trim(),
        comment: String(form.elements.comment.value || "").trim(),
      }),
    });
    setMessage("oversight-form-message", "Central admin response recorded.", "success");
    form.reset();
    await loadAllData();
  } catch (error) {
    setMessage("oversight-form-message", error.message, "error");
  }
});

document.getElementById("admin-refresh-button")?.addEventListener("click", loadAllData);

document.getElementById("admin-logout-button")?.addEventListener("click", async () => {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore API failure and clear client session.
  }
  sessionStorage.removeItem("admin_user");
  sessionStorage.removeItem("admin_auth_token");
  window.location.href = appRoutes.adminLogin;
});

document.addEventListener("click", async (event) => {
  const editOfficer = event.target.closest("[data-edit-officer]");
  if (editOfficer) {
    const officer = state.officers.find((item) => item.id === editOfficer.dataset.editOfficer);
    const form = document.getElementById("officer-form");
    if (!officer || !form) return;
    const inferredDepartmentCode = officer.departmentCode || state.departments.find((item) => item.name === officer.divisionName)?.code || "";
    document.querySelector('[data-section="officers"]')?.click();
    form.elements.editingOfficerId.value = officer.id;
    form.elements.officeType.value = officer.officeType;
    form.elements.departmentCode.value = inferredDepartmentCode;
    syncOfficerFormFields();
    fillSubDepartmentOptions("officer-subdepartment", inferredDepartmentCode, true);
    form.elements.sectionName.value = officer.sectionName || "";
    form.elements.wardNumber.value = officer.wardNumber || "";
    form.elements.name.value = officer.name || "";
    form.elements.email.value = officer.email || "";
    form.elements.loginId.value = officer.loginId || "";
    form.elements.password.value = "";
    form.elements.active.checked = officer.status === "active";
    return;
  }

  const toggleOfficer = event.target.closest("[data-toggle-officer]");
  if (toggleOfficer) {
    const officer = state.officers.find((item) => item.id === toggleOfficer.dataset.toggleOfficer);
    if (!officer) return;
    try {
      await request(`/api/admin/officers/${officer.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          officeType: officer.officeType,
          departmentCode: officer.departmentCode,
          divisionName: officer.divisionName,
          sectionName: officer.sectionName,
          wardNumber: officer.wardNumber,
          name: officer.name,
          email: officer.email,
          loginId: officer.loginId,
          active: officer.status !== "active",
        }),
      });
      await loadAllData();
    } catch (error) {
      setMessage("officer-form-message", error.message, "error");
    }
    return;
  }

  // Toggle points adjustment inline form
  const adjustPoints = event.target.closest("[data-adjust-points]");
  if (adjustPoints) {
    const officerId = adjustPoints.dataset.adjustPoints;
    const form = document.getElementById(`points-form-${officerId}`);
    if (form) form.style.display = form.style.display === "none" ? "block" : "none";
    return;
  }

  // Submit manual points adjustment (pending → admin verifies)
  const submitPoints = event.target.closest("[data-submit-points]");
  if (submitPoints) {
    const officerId = submitPoints.dataset.submitPoints;
    const pts = parseInt(document.getElementById(`points-value-${officerId}`)?.value || "0", 10);
    const reason = (document.getElementById(`points-reason-${officerId}`)?.value || "").trim();
    const msgEl = document.getElementById(`points-msg-${officerId}`);
    if (!pts || !reason) {
      if (msgEl) { msgEl.textContent = "Points and reason are required."; msgEl.style.color = "red"; }
      return;
    }
    try {
      await request(`/api/admin/officers/${officerId}`, {
        method: "PATCH",
        body: JSON.stringify({ performanceAdjustment: { points: pts, message: reason, pending: true } }),
      });
      if (msgEl) { msgEl.textContent = "Saved — awaiting your verification."; msgEl.style.color = "green"; }
      await loadAllData();
    } catch (err) {
      if (msgEl) { msgEl.textContent = err.message; msgEl.style.color = "red"; }
    }
    return;
  }

  // Verify or reject a pending adjustment
  const verifyAdj = event.target.closest("[data-verify-adj]");
  if (verifyAdj) {
    const officerId = verifyAdj.dataset.verifyAdj;
    const adjIdx = verifyAdj.dataset.adjIdx;
    const adjAction = verifyAdj.dataset.adjAction;
    try {
      await request(`/api/admin/officers/${officerId}/adjustments/${adjIdx}`, {
        method: "PATCH",
        body: JSON.stringify({ action: adjAction }),
      });
      await loadAllData();
    } catch (err) {
      alert(err.message);
    }
    return;
  }

  const selectOversight = event.target.closest("[data-select-oversight]");
  if (selectOversight) {
    state.selectedOversightToken = selectOversight.dataset.selectOversight;
    renderOversightList();
    renderOversightDetail();
  }
});

["analytics-department-filter", "analytics-officer-filter", "analytics-date-from", "analytics-date-to"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", renderAnalytics);
});

document.getElementById("analytics-reset-button")?.addEventListener("click", () => {
  document.getElementById("analytics-department-filter").value = "";
  document.getElementById("analytics-officer-filter").value = "";
  document.getElementById("analytics-date-from").value = "";
  document.getElementById("analytics-date-to").value = "";
  renderAnalytics();
});

document.getElementById("analytics-export-csv")?.addEventListener("click", () => {
  const rows = [
    ["Token", "Title", "Department", "Status", "Officer", "Updated"],
    ...getFilteredComplaints().map((complaint) => [
      complaint.tokenNumber,
      complaint.title,
      complaint.divisionName || `Ward ${complaint.wardNumber || "-"}`,
      complaint.status,
      complaint.assignedOfficerName || "",
      formatDateTime(complaint.updatedAt || complaint.createdAt),
    ]),
  ];

  const csv = rows.map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "central-admin-report.csv";
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("analytics-export-pdf")?.addEventListener("click", () => {
  window.print();
});

// Department form — create or update
document.getElementById("dept-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const editingCode = form.elements.editingCode.value.trim();
  const payload = {
    code: form.elements.code.value.trim().toUpperCase(),
    name: form.elements.name.value.trim(),
    type: form.elements.type.value,
    description: form.elements.description.value.trim(),
    active: true,
  };
  try {
    if (editingCode) {
      await request(`/api/admin/departments/${editingCode}`, { method: "PATCH", body: JSON.stringify(payload) });
      setMessage("dept-form-message", "Department updated.", "success");
    } else {
      await request("/api/admin/departments", { method: "POST", body: JSON.stringify(payload) });
      setMessage("dept-form-message", "Department created.", "success");
    }
    form.reset();
    form.elements.editingCode.value = "";
    await loadAllData();
  } catch (err) {
    setMessage("dept-form-message", err.message, "error");
  }
});

document.getElementById("dept-reset-button")?.addEventListener("click", () => {
  document.getElementById("dept-form")?.reset();
  document.getElementById("dept-editing-code").value = "";
  setMessage("dept-form-message", "");
});

// Department edit / delete via event delegation
document.addEventListener("click", async (event) => {
  const editDept = event.target.closest("[data-edit-dept]");
  if (editDept) {
    const dept = state.departments.find((d) => d.code === editDept.dataset.editDept);
    if (!dept) return;
    document.querySelector('[data-section="departments"]')?.click();
    document.getElementById("dept-editing-code").value = dept.code;
    document.getElementById("dept-code").value = dept.code;
    document.getElementById("dept-name").value = dept.name;
    document.getElementById("dept-type").value = dept.type || "Mahashakha";
    document.getElementById("dept-description").value = dept.description || "";
    return;
  }

  const deleteDept = event.target.closest("[data-delete-dept]");
  if (deleteDept) {
    const code = deleteDept.dataset.deleteDept;
    if (!confirm(`Delete department ${code}? This cannot be undone.`)) return;
    try {
      await request(`/api/admin/departments/${code}`, { method: "DELETE" });
      await loadAllData();
    } catch (err) {
      alert(err.message);
    }
  }
});

loadAllData().catch((error) => {
  document.querySelector(".admin-orbit-main").innerHTML = `
    <div class="admin-orbit-panel">
      <div class="form-message error">${error.message}</div>
    </div>
  `;
});
