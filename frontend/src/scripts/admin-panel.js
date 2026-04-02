const apiBase = "http://localhost:4000";
const storedAdmin = sessionStorage.getItem("admin_user");
const adminAuthToken = sessionStorage.getItem("admin_auth_token");

if (!storedAdmin || !adminAuthToken) {
  window.location.replace("./admin-login.html");
}

const adminUser = storedAdmin ? JSON.parse(storedAdmin) : null;
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
  analytics: null,
  complaints: [],
  activeSection: "dashboard",
  activeManagementTab: "departments",
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

function renderMetricCards(targetId, cards) {
  const node = document.getElementById(targetId);
  if (!node) return;
  node.innerHTML = cards
    .map(
      (card) => `
        <article class="admin-kpi-card ${card.tone || ""}">
          <p>${card.label}</p>
          <strong>${card.value}</strong>
          <span>${card.note || ""}</span>
        </article>
      `,
    )
    .join("");
}

function renderBarList(targetId, items, formatter = (item) => `${item.count}`) {
  const node = document.getElementById(targetId);
  if (!node) return;
  if (!items.length) {
    node.innerHTML = `<div class="admin-empty-state">No data available.</div>`;
    return;
  }

  const max = Math.max(...items.map((item) => item.count || item.total || 0), 1);
  node.innerHTML = `
    <div class="admin-bar-stack">
      ${items
        .map((item) => {
          const value = item.count || item.total || 0;
          const width = Math.max(8, (value / max) * 100);
          return `
            <div class="admin-bar-row">
              <div class="admin-bar-head">
                <span>${item.label}</span>
                <strong>${formatter(item)}</strong>
              </div>
              <div class="admin-bar-track">
                <div class="admin-bar-fill" style="width:${width}%"></div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderListCards(targetId, items, emptyText = "No items available.") {
  const node = document.getElementById(targetId);
  if (!node) return;
  if (!items.length) {
    node.innerHTML = `<div class="admin-empty-state">${emptyText}</div>`;
    return;
  }

  node.innerHTML = items
    .map(
      (item) => `
        <article class="admin-list-item">
          <div class="admin-list-item-main">
            <div class="admin-list-item-topline">
              <span class="admin-badge ${item.status || item.action || ""}">${item.statusLabel || item.status || item.action || "Item"}</span>
              <strong>${item.tokenNumber || item.code || item.name}</strong>
            </div>
            <h4>${item.title || item.name || item.officerName || "Untitled"}</h4>
            <p>${item.text || item.description || item.assignedOfficeLabel || item.divisionName || ""}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderDashboard() {
  if (!state.dashboard) return;
  const { overview, charts, spotlight } = state.dashboard;
  renderMetricCards("admin-overview-cards", [
    { label: "Total Complaints (Month)", value: overview.totalComplaintsMonth, note: `${overview.departments} departments live` },
    { label: "Solved Rate", value: `${overview.solvedRate}%`, note: "Verified city-wide" },
    { label: "Pending", value: overview.pending, note: "Open and in review", tone: "warning" },
    { label: "Forwarded", value: overview.forwarded, note: "Needs coordination", tone: "soft" },
    { label: "Escalated", value: overview.escalated, note: "Admin attention required", tone: "danger" },
    { label: "Active Rotations", value: overview.activeRotations, note: `${overview.officers} officers configured` },
  ]);

  renderBarList("dashboard-department-chart", charts.complaintsByDepartment);
  renderBarList("dashboard-solved-chart", charts.solvedByDepartment, (item) => `${item.solved}/${item.total} · ${item.percent}%`);

  renderListCards("dashboard-escalations-list", spotlight.recentEscalations, "No escalated complaints right now.");
  renderListCards("dashboard-invalid-list", spotlight.recentInvalid, "No invalid complaints awaiting review.");
  renderListCards("dashboard-reviews-list", spotlight.officerActionReviews, "No officer action reviews pending.");

  setText("nav-total-complaints", String(overview.totalComplaintsMonth));
  setText("nav-total-officers", String(overview.officers));
  setText(
    "nav-oversight-count",
    String(
      state.oversight.escalated.length
      + state.oversight.invalidPending.length
      + state.oversight.officerActionReviews.length,
    ),
  );
  setText("nav-solved-rate", `${overview.solvedRate}%`);
  setText("nav-active-rotations", String(overview.activeRotations));
}

function fillDepartmentSelect(selectId, includeAll = false) {
  const node = document.getElementById(selectId);
  if (!node) return;
  node.innerHTML = `${includeAll ? `<option value="">All Departments</option>` : `<option value="">Select department</option>`}${state.departments
    .map((department) => `<option value="${department.code}">${department.name}</option>`)
    .join("")}`;
}

function fillOfficerSelect(selectId, includeAll = false) {
  const node = document.getElementById(selectId);
  if (!node) return;
  node.innerHTML = `${includeAll ? `<option value="">All Officers</option>` : `<option value="">Select officer</option>`}${state.officers
    .map((officer) => `<option value="${officer.id}">${officer.name} · ${officer.divisionName || `Ward ${officer.wardNumber}`}</option>`)
    .join("")}`;
}

function syncOfficerDepartmentName() {
  const departmentSelect = document.getElementById("officer-department-code");
  const divisionInput = document.querySelector('#officer-form input[name="divisionName"]');
  if (!departmentSelect || !divisionInput) return;
  const department = state.departments.find((item) => item.code === departmentSelect.value);
  if (department && !divisionInput.value) {
    divisionInput.value = department.name;
  }
}

function renderDepartments() {
  fillDepartmentSelect("officer-department-code");
  fillDepartmentSelect("oversight-target-division");
  fillDepartmentSelect("analytics-department-filter", true);

  const node = document.getElementById("departments-list");
  if (!node) return;
  if (!state.departments.length) {
    node.innerHTML = `<div class="admin-empty-state">No departments configured yet.</div>`;
    return;
  }

  node.innerHTML = state.departments
    .map(
      (department) => `
        <article class="admin-record-card">
          <div>
            <div class="admin-record-title">
              <strong>${department.name}</strong>
              <span class="admin-badge ${department.active ? "solved" : "pending"}">${department.type}</span>
            </div>
            <p>${department.code} · ${department.description || "No description provided."}</p>
            <small>Wards: ${department.wards.length ? department.wards.join(", ") : "City-wide"}</small>
          </div>
          <div class="admin-card-actions">
            <button type="button" class="button secondary compact-button" data-edit-department="${department.code}">Edit</button>
            <button type="button" class="button danger compact-button" data-delete-department="${department.code}">Delete</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderOfficers() {
  fillOfficerSelect("rotation-officer-select");
  fillOfficerSelect("oversight-penalty-officer");
  fillOfficerSelect("oversight-reward-officer");
  fillOfficerSelect("analytics-officer-filter", true);

  const node = document.getElementById("officers-list");
  if (!node) return;
  if (!state.officers.length) {
    node.innerHTML = `<div class="admin-empty-state">No officers configured yet.</div>`;
    return;
  }

  node.innerHTML = state.officers
    .map(
      (officer) => `
        <article class="admin-record-card">
          <div>
            <div class="admin-record-title">
              <strong>${officer.name}</strong>
              <span class="admin-badge ${officer.status === "active" ? "solved" : "pending"}">${officer.status}</span>
            </div>
            <p>${officer.divisionName || `Ward ${officer.wardNumber}`} ${officer.sectionName ? `· ${officer.sectionName}` : ""}</p>
            <small>${officer.loginId} · ${officer.email || "No email"} · ${officer.currentWeekPoints} pts this week</small>
          </div>
          <div class="admin-card-actions">
            <button type="button" class="button secondary compact-button" data-edit-officer="${officer.id}">Edit</button>
            <button type="button" class="button secondary compact-button" data-toggle-officer="${officer.id}">
              ${officer.status === "active" ? "Deactivate" : "Activate"}
            </button>
          </div>
        </article>
      `,
    )
    .join("");
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
        <article class="admin-record-card">
          <div>
            <div class="admin-record-title">
              <strong>${rotation.officerName}</strong>
              <span class="admin-badge ${rotation.active ? "solved" : "forwarded"}">${rotation.active ? "Active" : "Scheduled"}</span>
            </div>
            <p>${rotation.divisionName || `Ward ${rotation.wardNumber}`} ${rotation.sectionName ? `· ${rotation.sectionName}` : ""}</p>
            <small>${formatDate(rotation.startDate)} to ${formatDate(rotation.endDate)} · ${rotation.weekKeys.join(", ")}</small>
          </div>
        </article>
      `,
    )
    .join("");
}

function getOversightListForActiveTab() {
  if (state.activeOversightTab === "invalid") return state.oversight.invalidPending;
  if (state.activeOversightTab === "reviews") return state.oversight.officerActionReviews;
  return state.oversight.escalated;
}

function renderOversightList() {
  const list = getOversightListForActiveTab();
  setText(
    "oversight-list-title",
    state.activeOversightTab === "invalid"
      ? "Invalid complaints pending"
      : state.activeOversightTab === "reviews"
        ? "Officer action reviews"
        : "Escalated complaints",
  );

  const node = document.getElementById("oversight-list");
  if (!node) return;
  if (!list.length) {
    node.innerHTML = `<div class="admin-empty-state">Nothing is waiting in this queue.</div>`;
    return;
  }

  node.innerHTML = list
    .map(
      (complaint) => `
        <article class="admin-record-card ${state.selectedOversightToken === complaint.tokenNumber ? "selected" : ""}">
          <div>
            <div class="admin-record-title">
              <strong>${complaint.tokenNumber}</strong>
              <span class="admin-badge ${complaint.status}">${complaint.status.replaceAll("_", " ")}</span>
            </div>
            <h4>${complaint.title}</h4>
            <p>${complaint.assignedOfficeLabel || complaint.assignedDepartment || "-"}</p>
            <small>${formatDateTime(complaint.updatedAt || complaint.createdAt)}</small>
          </div>
          <div class="admin-card-actions">
            <button type="button" class="button compact-button" data-select-oversight="${complaint.tokenNumber}">Review</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderOversightDetail() {
  const complaint = state.complaints.find((item) => item.tokenNumber === state.selectedOversightToken);
  const detailNode = document.getElementById("oversight-detail");
  const emptyNode = document.getElementById("oversight-detail-empty");
  const form = document.getElementById("oversight-action-form");
  if (!detailNode || !emptyNode || !form) return;

  if (!complaint) {
    detailNode.classList.add("hidden");
    form.classList.add("hidden");
    emptyNode.classList.remove("hidden");
    return;
  }

  emptyNode.classList.add("hidden");
  detailNode.classList.remove("hidden");
  form.classList.remove("hidden");

  detailNode.innerHTML = `
    <div class="admin-detail-stack">
      <div class="admin-detail-header">
        <div>
          <span class="admin-badge ${complaint.status}">${complaint.status.replaceAll("_", " ")}</span>
          <h3>${complaint.title}</h3>
          <p>${complaint.tokenNumber} · ${complaint.assignedOfficeLabel || complaint.assignedDepartment || "-"}</p>
        </div>
      </div>
      <div class="admin-detail-grid">
        <div>
          <h4>Description</h4>
          <p>${complaint.description || "-"}</p>
        </div>
        <div>
          <h4>Location</h4>
          <p>${complaint.locationText || "-"} ${complaint.wardNumber ? `· Ward ${complaint.wardNumber}` : ""}</p>
        </div>
        <div>
          <h4>Citizen / Contact</h4>
          <p>${complaint.citizenName || "Anonymous"} ${complaint.citizenPhone ? `· ${complaint.citizenPhone}` : ""}</p>
        </div>
        <div>
          <h4>Officer</h4>
          <p>${complaint.assignedOfficerName || "Unassigned"}</p>
        </div>
      </div>
      <div>
        <h4>History</h4>
        <div class="admin-history-list">
          ${((complaint.history || []).length ? complaint.history : [{ note: "No history recorded yet.", timestamp: complaint.createdAt }])
            .slice(-6)
            .reverse()
            .map(
              (entry) => `
                <div class="admin-history-item">
                  <strong>${entry.action || "update"}</strong>
                  <span>${entry.note || "-"}</span>
                  <small>${formatDateTime(entry.timestamp || entry.createdAt)}</small>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    </div>
  `;

  form.elements.tokenNumber.value = complaint.tokenNumber;
}

function getFilteredComplaints() {
  const departmentCode = document.getElementById("analytics-department-filter")?.value || "";
  const officerId = document.getElementById("analytics-officer-filter")?.value || "";
  const dateFrom = document.getElementById("analytics-date-from")?.value || "";
  const dateTo = document.getElementById("analytics-date-to")?.value || "";

  return state.complaints.filter((complaint) => {
    const matchesDepartment = !departmentCode || state.departments.find((department) => department.code === departmentCode)?.name === complaint.divisionName;
    const matchesOfficer = !officerId || complaint.assignedOfficerId === officerId;
    const createdAt = new Date(complaint.createdAt).getTime();
    const matchesFrom = !dateFrom || createdAt >= new Date(dateFrom).getTime();
    const matchesTo = !dateTo || createdAt <= new Date(`${dateTo}T23:59:59`).getTime();
    return matchesDepartment && matchesOfficer && matchesFrom && matchesTo;
  });
}

function renderAnalytics() {
  const complaints = getFilteredComplaints();
  const pending = complaints.filter((item) => item.status === "pending").length;
  const inProgress = complaints.filter((item) => item.status === "in_progress").length;
  const forwardedToDepartment = complaints.filter((item) => item.status === "forwarded").length;
  const forwardedToAdmin = complaints.filter((item) => item.status === "escalated" || item.officeType === "central_admin").length;
  const resolved = complaints.filter((item) => item.status === "solved").length;

  renderMetricCards("analytics-summary-cards", [
    { label: "Filtered Complaints", value: complaints.length, note: "Current report scope" },
    { label: "Resolved", value: resolved, note: "Verified closed cases", tone: "success" },
    { label: "Pending", value: pending, note: "Awaiting review", tone: "warning" },
    { label: "In Progress", value: inProgress, note: "Assigned to officers" },
  ]);

  renderBarList("analytics-status-chart", [
    { label: "In Progress", count: inProgress },
    { label: "Pending", count: pending },
    { label: "Delayed", count: complaints.filter((item) => item.status === "delayed").length },
    { label: "Solved", count: resolved },
  ]);

  renderBarList("analytics-forward-chart", [
    { label: "Forwarded to Department/Ward", count: forwardedToDepartment },
    { label: "Escalated to Central Admin", count: forwardedToAdmin },
  ]);

  const leaderboard = state.officers
    .map((officer) => ({
      label: officer.name,
      count: officer.currentWeekPoints,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  renderBarList("analytics-officer-leaderboard", leaderboard);

  const tableNode = document.getElementById("analytics-report-table");
  if (!tableNode) return;
  if (!complaints.length) {
    tableNode.innerHTML = `<div class="admin-empty-state">No complaints match the selected filters.</div>`;
    return;
  }

  tableNode.innerHTML = `
    <div class="admin-table-wrap">
      <table class="department-work-table">
        <thead>
          <tr>
            <th>ID</th>
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

function renderSettings() {
  const runtimeNode = document.getElementById("settings-runtime");
  const securityNode = document.getElementById("settings-security");
  if (runtimeNode) {
    runtimeNode.innerHTML = `
      <div class="admin-setting-item"><strong>Backend API</strong><span>${apiBase}</span></div>
      <div class="admin-setting-item"><strong>Configured Departments</strong><span>${state.departments.length}</span></div>
      <div class="admin-setting-item"><strong>Configured Officers</strong><span>${state.officers.length}</span></div>
      <div class="admin-setting-item"><strong>Scheduled Rotations</strong><span>${state.rotations.length}</span></div>
    `;
  }

  if (securityNode) {
    securityNode.innerHTML = `
      <div class="admin-setting-item"><strong>Admin User</strong><span>${adminUser?.name || "Super Admin"}</span></div>
      <div class="admin-setting-item"><strong>Login ID</strong><span>${adminUser?.loginId || "admin@pokharamun.gov.np"}</span></div>
      <div class="admin-setting-item"><strong>Session Storage</strong><span>Active</span></div>
      <div class="admin-setting-item"><strong>Role</strong><span>${adminUser?.role || "admin"}</span></div>
    `;
  }
}

function renderEverything() {
  setText("admin-user-name", adminUser?.name || "Super Admin");
  setText("admin-user-role", "Central Administration");
  setText("admin-user-avatar", String(adminUser?.name || "SA").trim().slice(0, 2).toUpperCase());
  setText(
    "admin-live-date",
    new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date()),
  );

  renderDashboard();
  renderDepartments();
  renderOfficers();
  renderRotations();
  renderOversightList();
  renderOversightDetail();
  renderAnalytics();
  renderSettings();
}

async function loadAllData() {
  const [dashboard, departments, officers, rotations, oversight, analytics, complaints] = await Promise.all([
    request("/api/admin/dashboard"),
    request("/api/admin/departments"),
    request("/api/admin/officers"),
    request("/api/admin/rotations"),
    request("/api/admin/oversight"),
    request("/api/admin/analytics"),
    request("/api/admin/complaints"),
  ]);

  state.dashboard = dashboard.dashboard;
  state.departments = departments.departments;
  state.officers = officers.officers;
  state.rotations = rotations.rotations;
  state.oversight = oversight.oversight;
  state.analytics = analytics.analytics;
  state.complaints = complaints.complaints;

  const currentOversightList = getOversightListForActiveTab();
  if (!currentOversightList.some((item) => item.tokenNumber === state.selectedOversightToken)) {
    state.selectedOversightToken = currentOversightList[0]?.tokenNumber || "";
  }

  renderEverything();
}

function resetDepartmentForm() {
  const form = document.getElementById("department-form");
  if (!form) return;
  form.reset();
  form.elements.editingCode.value = "";
  form.elements.code.disabled = false;
  setText("department-form-message", "");
}

function resetOfficerForm() {
  const form = document.getElementById("officer-form");
  if (!form) return;
  form.reset();
  form.elements.editingOfficerId.value = "";
  form.elements.password.required = false;
  form.elements.active.checked = true;
  syncOfficerDepartmentName();
  setText("officer-form-message", "");
}

function setMessage(targetId, message, tone = "") {
  const node = document.getElementById(targetId);
  if (!node) return;
  node.className = `form-message ${tone}`.trim();
  node.textContent = message;
}

document.querySelectorAll(".admin-nav-link").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeSection = button.dataset.section;
    document.querySelectorAll(".admin-nav-link").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".admin-section").forEach((section) => {
      section.classList.toggle("active", section.id === `section-${state.activeSection}`);
    });
  });
});

document.querySelectorAll("[data-management-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeManagementTab = button.dataset.managementTab;
    document.querySelectorAll("[data-management-tab]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".admin-management-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `management-${state.activeManagementTab}`);
    });
  });
});

document.querySelectorAll("[data-oversight-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeOversightTab = button.dataset.oversightTab;
    state.selectedOversightToken = getOversightListForActiveTab()[0]?.tokenNumber || "";
    document.querySelectorAll("[data-oversight-tab]").forEach((item) => item.classList.toggle("active", item === button));
    renderOversightList();
    renderOversightDetail();
  });
});

document.getElementById("admin-refresh-button")?.addEventListener("click", async () => {
  await loadAllData();
});

document.getElementById("admin-logout-button")?.addEventListener("click", async () => {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore logout API errors and clear local session anyway.
  }
  sessionStorage.removeItem("admin_user");
  sessionStorage.removeItem("admin_auth_token");
  window.location.href = "./admin-login.html";
});

document.getElementById("department-reset-button")?.addEventListener("click", resetDepartmentForm);
document.getElementById("officer-reset-button")?.addEventListener("click", resetOfficerForm);
document.getElementById("officer-department-code")?.addEventListener("change", syncOfficerDepartmentName);

document.getElementById("department-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const editingCode = String(form.elements.editingCode.value || "").trim();
  const payload = {
    code: String(form.elements.code.value || "").trim().toUpperCase(),
    name: String(form.elements.name.value || "").trim(),
    type: String(form.elements.type.value || "").trim(),
    wards: String(form.elements.wards.value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    description: String(form.elements.description.value || "").trim(),
  };

  try {
    if (editingCode) {
      await request(`/api/admin/departments/${encodeURIComponent(editingCode)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMessage("department-form-message", "Department updated successfully.", "success");
    } else {
      await request("/api/admin/departments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("department-form-message", "Department created successfully.", "success");
    }
    resetDepartmentForm();
    await loadAllData();
  } catch (error) {
    setMessage("department-form-message", error.message, "error");
  }
});

document.getElementById("officer-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const editingOfficerId = String(form.elements.editingOfficerId.value || "").trim();
  const officeType = String(form.elements.officeType.value || "department").trim();
  const departmentCode = String(form.elements.departmentCode.value || "").trim();
  const selectedDepartment = state.departments.find((item) => item.code === departmentCode);
  const payload = {
    officeType,
    departmentCode,
    divisionName: officeType === "department"
      ? String(form.elements.divisionName.value || selectedDepartment?.name || "").trim()
      : "",
    sectionName: officeType === "department" ? String(form.elements.sectionName.value || "").trim() : "",
    wardNumber: officeType === "ward" ? String(form.elements.wardNumber.value || "").trim() : "",
    name: String(form.elements.name.value || "").trim(),
    email: String(form.elements.email.value || "").trim(),
    phone: String(form.elements.phone.value || "").trim(),
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
      setMessage("officer-form-message", "Officer created successfully.", "success");
    }
    resetOfficerForm();
    await loadAllData();
  } catch (error) {
    setMessage("officer-form-message", error.message, "error");
  }
});

document.getElementById("rotation-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = {
    officerId: String(form.elements.officerId.value || "").trim(),
    startDate: String(form.elements.startDate.value || "").trim(),
    endDate: String(form.elements.endDate.value || "").trim(),
  };

  try {
    await request("/api/admin/rotations", {
      method: "POST",
      body: JSON.stringify(payload),
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
  const pointsAdjustments = [];
  const penaltyOfficerId = String(form.elements.penaltyOfficerId.value || "").trim();
  const rewardOfficerId = String(form.elements.rewardOfficerId.value || "").trim();
  const penaltyPoints = Number(form.elements.penaltyPoints.value || 0);
  const rewardPoints = Number(form.elements.rewardPoints.value || 0);
  const comment = String(form.elements.comment.value || "").trim();

  if (penaltyOfficerId && penaltyPoints) {
    pointsAdjustments.push({
      officerId: penaltyOfficerId,
      points: penaltyPoints,
      message: comment || "Penalty assigned by admin.",
    });
  }

  if (rewardOfficerId && rewardPoints) {
    pointsAdjustments.push({
      officerId: rewardOfficerId,
      points: rewardPoints,
      message: comment || "Reward assigned by admin.",
    });
  }

  const payload = {
    action: String(form.elements.action.value || "").trim(),
    targetOfficeType: String(form.elements.targetOfficeType.value || "").trim(),
    targetDivisionName: state.departments.find((item) => item.code === String(form.elements.targetDivisionName.value || "").trim())?.name
      || String(form.elements.targetDivisionName.value || "").trim(),
    targetSectionName: String(form.elements.targetSectionName.value || "").trim(),
    targetWardNumber: String(form.elements.targetWardNumber.value || "").trim(),
    comment,
    pointsAdjustments,
  };

  try {
    await request(`/api/admin/oversight/${form.elements.tokenNumber.value}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setMessage("oversight-form-message", "Admin decision saved successfully.", "success");
    form.reset();
    await loadAllData();
  } catch (error) {
    setMessage("oversight-form-message", error.message, "error");
  }
});

document.addEventListener("click", async (event) => {
  const editDepartment = event.target.closest("[data-edit-department]");
  if (editDepartment) {
    const department = state.departments.find((item) => item.code === editDepartment.dataset.editDepartment);
    const form = document.getElementById("department-form");
    if (department && form) {
      state.activeSection = "management";
      state.activeManagementTab = "departments";
      document.querySelector('[data-section="management"]')?.click();
      document.querySelector('[data-management-tab="departments"]')?.click();
      form.elements.editingCode.value = department.code;
      form.elements.code.value = department.code;
      form.elements.code.disabled = true;
      form.elements.name.value = department.name;
      form.elements.type.value = department.type;
      form.elements.wards.value = department.wards.join(",");
      form.elements.description.value = department.description || "";
    }
    return;
  }

  const deleteDepartment = event.target.closest("[data-delete-department]");
  if (deleteDepartment) {
    try {
      await request(`/api/admin/departments/${encodeURIComponent(deleteDepartment.dataset.deleteDepartment)}`, {
        method: "DELETE",
      });
      await loadAllData();
    } catch (error) {
      setMessage("department-form-message", error.message, "error");
    }
    return;
  }

  const editOfficer = event.target.closest("[data-edit-officer]");
  if (editOfficer) {
    const officer = state.officers.find((item) => item.id === editOfficer.dataset.editOfficer);
    const form = document.getElementById("officer-form");
    if (officer && form) {
      document.querySelector('[data-section="management"]')?.click();
      document.querySelector('[data-management-tab="officers"]')?.click();
      form.elements.editingOfficerId.value = officer.id;
      form.elements.officeType.value = officer.officeType;
      form.elements.departmentCode.value = officer.departmentCode || "";
      form.elements.divisionName.value = officer.divisionName || "";
      form.elements.sectionName.value = officer.sectionName || "";
      form.elements.wardNumber.value = officer.wardNumber || "";
      form.elements.name.value = officer.name || "";
      form.elements.email.value = officer.email || "";
      form.elements.phone.value = officer.phone || "";
      form.elements.loginId.value = officer.loginId || "";
      form.elements.password.value = "";
      form.elements.active.checked = officer.status === "active";
    }
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
          active: officer.status !== "active",
          name: officer.name,
          email: officer.email,
          phone: officer.phone,
          departmentCode: officer.departmentCode,
          divisionName: officer.divisionName,
          sectionName: officer.sectionName,
          wardNumber: officer.wardNumber,
          assignmentWeeks: officer.assignmentWeeks,
        }),
      });
      await loadAllData();
    } catch (error) {
      setMessage("officer-form-message", error.message, "error");
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

document.getElementById("analytics-reset-button")?.addEventListener("click", () => {
  document.getElementById("analytics-department-filter").value = "";
  document.getElementById("analytics-officer-filter").value = "";
  document.getElementById("analytics-date-from").value = "";
  document.getElementById("analytics-date-to").value = "";
  renderAnalytics();
});

["analytics-department-filter", "analytics-officer-filter", "analytics-date-from", "analytics-date-to"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", renderAnalytics);
});

document.getElementById("analytics-export-csv")?.addEventListener("click", () => {
  const complaints = getFilteredComplaints();
  const rows = [
    ["Token", "Title", "Department", "Status", "Officer", "Updated"],
    ...complaints.map((complaint) => [
      complaint.tokenNumber,
      complaint.title,
      complaint.divisionName || `Ward ${complaint.wardNumber || ""}`,
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
  link.download = "admin-report.csv";
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("analytics-export-pdf")?.addEventListener("click", () => {
  window.print();
});

loadAllData().catch((error) => {
  document.querySelector(".admin-suite-main").innerHTML = `
    <div class="panel admin-suite-panel">
      <div class="form-message error">${error.message}</div>
    </div>
  `;
});
