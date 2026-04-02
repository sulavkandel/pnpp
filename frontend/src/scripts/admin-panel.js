const apiBase = "http://localhost:4000";
const storedAdmin = sessionStorage.getItem("admin_user");
const adminAuthToken = sessionStorage.getItem("admin_auth_token");

if (!storedAdmin || !adminAuthToken) {
  window.location.replace("./admin-login.html");
}

const adminUser = storedAdmin ? JSON.parse(storedAdmin) : null;
let currentLanguage = "ne";
let activeTab = "department-complaints";

const translations = {
  ne: {
    title: "एडमिन प्यानल",
    gov: "नेपाल सरकार",
    main: "केन्द्रिय प्रशासन प्यानल",
    sub: "विभाग तथा वडा एडमिन तथा गुनासो अनुगमन",
    welcome: `स्वागत छ, ${adminUser?.name || "Admin"}. यहाँबाट सम्पूर्ण गुनासो, एस्केलेसन, र विभागीय प्रदर्शन हेर्न सकिन्छ।`,
    addDepartmentAdmin: "Add Department Admin",
    slaAlertsEyebrow: "SLA चेतावनी",
    slaAlertsTitle: "पहिलो जवाफ समयसीमा नाघेका गुनासो",
    statusPending: "पेन्डिङ",
    statusInProgress: "प्रगतिमा",
    statusSolved: "समाधान",
    statusDelayed: "ढिलाइ",
    statusForwarded: "फर्वार्ड",
    statusEscalated: "एस्केलेटेड",
    btnDepartmentComplaints: "विभाग अनुसार गुनासो",
    btnSolvedComplaints: "समाधान भएका गुनासो",
    btnProgressComplaints: "कार्य प्रगतिमा",
    btnPendingComplaints: "पेन्डिङ गुनासो",
    btnForwardedComplaints: "फर्वार्ड गरिएका गुनासो",
    btnCentralAdminComplaints: "केन्द्रीय प्रशासन एस्केलेसन",
    deptGraphEyebrow: "विभागीय गुनासो",
    deptGraphTitle: "विभाग अनुसार गुनासो ग्राफ",
    wardGraphEyebrow: "वडागत गुनासो",
    wardGraphTitle: "वडा अनुसार गुनासो ग्राफ",
    solvedGraphEyebrow: "समाधान भएका गुनासो",
    solvedGraphTitle: "समाधान संख्या",
    solvedSummaryEyebrow: "समाधान सूची",
    solvedSummaryTitle: "समाधान भएका गुनासोको सारांश",
    progressDeptEyebrow: "कार्य प्रगतिमा",
    progressDeptTitle: "विभाग अनुसार कार्य प्रगतिमा",
    progressWardEyebrow: "वडागत प्रगति",
    progressWardTitle: "वडा अनुसार कार्य प्रगतिमा",
    pendingGraphEyebrow: "समयसीमा नाघेका गुनासो",
    pendingGraphTitle: "पेन्डिङ गुनासो ग्राफ",
    pendingListEyebrow: "पेन्डिङ सूची",
    pendingListTitle: "समयसीमा नाघेका गुनासोहरू",
    forwardedListEyebrow: "फर्वार्ड गरिएका गुनासो",
    forwardedListTitle: "विभाग / वडा बाट फर्वार्ड गरिएको सूची",
    centralAdminGraphEyebrow: "केन्द्रीय प्रशासनमा पुगेका गुनासो",
    centralAdminGraphTitle: "केन्द्रीय प्रशासनलाई तोकिएका गुनासो",
    centralAdminListEyebrow: "एस्केलेसन सूची",
    centralAdminListTitle: "वडा वा विभागले समाधान गर्न नसकेका गुनासोहरू",
    logout: "लगआउट",
    noData: "अहिलेसम्म डाटा छैन।",
  },
  en: {
    title: "Admin Panel",
    gov: "Government of Nepal",
    main: "Central Admin Panel",
    sub: "Department, ward, and complaint monitoring dashboard",
    welcome: `Welcome, ${adminUser?.name || "Admin"}. This view shows complaints, escalations, and department performance.`,
    addDepartmentAdmin: "Add Department Admin",
    slaAlertsEyebrow: "SLA Alerts",
    slaAlertsTitle: "Complaints breaching first-response SLA",
    statusPending: "Pending",
    statusInProgress: "In Progress",
    statusSolved: "Solved",
    statusDelayed: "Delayed",
    statusForwarded: "Forwarded",
    statusEscalated: "Escalated",
    btnDepartmentComplaints: "Complain Based on Department",
    btnSolvedComplaints: "Solved Complain",
    btnProgressComplaints: "In Progress",
    btnPendingComplaints: "Pending Complain",
    btnForwardedComplaints: "Forwarded Complain",
    btnCentralAdminComplaints: "Central Admin Escalations",
    deptGraphEyebrow: "Department complaints",
    deptGraphTitle: "Department-wise complaint graph",
    wardGraphEyebrow: "Ward complaints",
    wardGraphTitle: "Ward-wise complaint graph",
    solvedGraphEyebrow: "Solved complaints",
    solvedGraphTitle: "Solved complaint count",
    solvedSummaryEyebrow: "Solved list",
    solvedSummaryTitle: "Summary of solved complaints",
    progressDeptEyebrow: "In progress",
    progressDeptTitle: "In-progress complaints by department",
    progressWardEyebrow: "Ward progress",
    progressWardTitle: "In-progress complaints by ward",
    pendingGraphEyebrow: "Complaints past deadline",
    pendingGraphTitle: "Pending complaint graph",
    pendingListEyebrow: "Pending list",
    pendingListTitle: "Complaints beyond time frame",
    forwardedListEyebrow: "Forwarded complaints",
    forwardedListTitle: "Complaints forwarded by departments and wards",
    centralAdminGraphEyebrow: "Complaints escalated to central admin",
    centralAdminGraphTitle: "Complaints assigned to central admin",
    centralAdminListEyebrow: "Escalation list",
    centralAdminListTitle: "Complaints unresolved by ward or department",
    logout: "Logout",
    noData: "No data available yet.",
  },
};

function renderBars(targetId, items, colorClass = "") {
  const node = document.getElementById(targetId);
  if (!node) return;

  if (!items.length) {
    node.innerHTML = `<div class="admin-list-card"><p>${translations[currentLanguage].noData}</p></div>`;
    return;
  }

  const max = Math.max(...items.map(([, value]) => value), 1);
  node.innerHTML = `
    <div class="chart-stack">
      ${items
        .map(
          ([label, value]) => `
            <div class="bar-row">
              <div class="bar-head">
                <span>${label}</span>
                <strong>${value}</strong>
              </div>
              <div class="bar-track">
                <div class="bar-fill ${colorClass}" style="width:${(value / max) * 100}%"></div>
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCards(targetId, items) {
  const node = document.getElementById(targetId);
  if (!node) return;

  if (!items.length) {
    node.innerHTML = `<div class="admin-list-card"><p>${translations[currentLanguage].noData}</p></div>`;
    return;
  }

  node.innerHTML = `<div class="list-stack">${items
    .map(
      (item) => `
        <div class="admin-list-card">
          <strong>${item.title || item[0]}</strong>
          <p>${item.text || item[1]}</p>
          ${item.tokenNumber ? `<p>${item.tokenNumber}</p>` : ""}
        </div>
      `,
    )
    .join("")}</div>`;
}

function renderStatusSummary(items) {
  const node = document.getElementById("admin-status-summary");
  if (!node) return;

  const labels = {
    pending: translations[currentLanguage].statusPending,
    in_progress: translations[currentLanguage].statusInProgress,
    solved: translations[currentLanguage].statusSolved,
    delayed: translations[currentLanguage].statusDelayed,
    forwarded: translations[currentLanguage].statusForwarded,
    escalated: translations[currentLanguage].statusEscalated,
  };

  if (!items.length) {
    node.innerHTML = "";
    return;
  }

  node.innerHTML = items
    .map(
      ([status, value]) => `
        <div class="summary-card panel">
          <strong>${value}</strong>
          <p>${labels[status] || status}</p>
        </div>
      `,
    )
    .join("");
}

function setActiveTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".dashboard-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  document.querySelectorAll(".dashboard-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${tab}-panel`);
  });
}

async function loadAnalytics() {
  const response = await fetch(`${apiBase}/api/admin/analytics`, {
    headers: {
      Authorization: `Bearer ${adminAuthToken}`,
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Could not load analytics.");
  return result.analytics;
}

async function renderAnalytics() {
  const analytics = await loadAnalytics();
  renderStatusSummary(analytics.statusCounts || []);
  renderBars("department-complaint-graph", analytics.departmentComplaints || []);
  renderBars("ward-complaint-graph", analytics.wardComplaints || []);
  renderBars("solved-complaint-graph", analytics.solvedRates || [], "green");
  renderCards(
    "solved-summary-list",
    (analytics.solvedRates || []).map(([label, value]) => ({
      title: label,
      text: `${value} solved complaints`,
    })),
  );
  renderBars("progress-department-graph", analytics.inProgressDepartments || []);
  renderBars("progress-ward-graph", analytics.inProgressWards || []);
  renderBars("pending-complaint-graph", analytics.pendingGraph || []);
  renderCards("pending-complaint-list", analytics.pendingComplaints || []);
  renderCards("forwarded-complaint-list", analytics.forwardedComplaints || []);
  renderBars("central-admin-complaint-graph", analytics.centralAdminGraph || []);
  renderCards("central-admin-complaint-list", analytics.centralAdminComplaints || []);
  renderCards("sla-alerts-list", analytics.slaBreaches || []);
  setActiveTab(activeTab);
}

function fill(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function renderStatic() {
  const t = translations[currentLanguage];
  document.documentElement.lang = currentLanguage;
  fill("admin-panel-title", t.title);
  fill("admin-gov-label", t.gov);
  fill("admin-main-title", t.main);
  fill("admin-subtitle", t.sub);
  fill("admin-welcome-banner", t.welcome);
  fill("add-department-admin-button", t.addDepartmentAdmin);
  fill("sla-alerts-eyebrow", t.slaAlertsEyebrow);
  fill("sla-alerts-title", t.slaAlertsTitle);
  fill("btn-department-complaints", t.btnDepartmentComplaints);
  fill("btn-solved-complaints", t.btnSolvedComplaints);
  fill("btn-progress-complaints", t.btnProgressComplaints);
  fill("btn-pending-complaints", t.btnPendingComplaints);
  fill("btn-forwarded-complaints", t.btnForwardedComplaints);
  fill("btn-central-admin-complaints", t.btnCentralAdminComplaints);
  fill("dept-graph-eyebrow", t.deptGraphEyebrow);
  fill("dept-graph-title", t.deptGraphTitle);
  fill("ward-graph-eyebrow", t.wardGraphEyebrow);
  fill("ward-graph-title", t.wardGraphTitle);
  fill("solved-graph-eyebrow", t.solvedGraphEyebrow);
  fill("solved-graph-title", t.solvedGraphTitle);
  fill("solved-summary-eyebrow", t.solvedSummaryEyebrow);
  fill("solved-summary-title", t.solvedSummaryTitle);
  fill("progress-dept-eyebrow", t.progressDeptEyebrow);
  fill("progress-dept-title", t.progressDeptTitle);
  fill("progress-ward-eyebrow", t.progressWardEyebrow);
  fill("progress-ward-title", t.progressWardTitle);
  fill("pending-graph-eyebrow", t.pendingGraphEyebrow);
  fill("pending-graph-title", t.pendingGraphTitle);
  fill("pending-list-eyebrow", t.pendingListEyebrow);
  fill("pending-list-title", t.pendingListTitle);
  fill("forwarded-list-eyebrow", t.forwardedListEyebrow);
  fill("forwarded-list-title", t.forwardedListTitle);
  fill("central-admin-graph-eyebrow", t.centralAdminGraphEyebrow);
  fill("central-admin-graph-title", t.centralAdminGraphTitle);
  fill("central-admin-list-eyebrow", t.centralAdminListEyebrow);
  fill("central-admin-list-title", t.centralAdminListTitle);
  fill("admin-logout-button", t.logout);
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });
}

async function render() {
  renderStatic();
  await renderAnalytics();
}

render().catch(() => {
  renderStatic();
  renderBars("department-complaint-graph", []);
  renderBars("ward-complaint-graph", []);
  renderBars("solved-complaint-graph", []);
  renderCards("solved-summary-list", []);
  renderBars("progress-department-graph", []);
  renderBars("progress-ward-graph", []);
  renderBars("pending-complaint-graph", []);
  renderCards("pending-complaint-list", []);
  renderCards("forwarded-complaint-list", []);
  renderBars("central-admin-complaint-graph", []);
  renderCards("central-admin-complaint-list", []);
  renderCards("sla-alerts-list", []);
});

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLanguage = button.dataset.lang;
    render();
  });
});

document.querySelectorAll(".dashboard-tab").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tab);
  });
});

document.getElementById("admin-logout-button")?.addEventListener("click", async () => {
  try {
    await fetch(`${apiBase}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminAuthToken}`,
      },
    });
  } catch {}

  sessionStorage.removeItem("admin_user");
  sessionStorage.removeItem("admin_auth_token");
  window.location.replace("./admin-login.html");
});
