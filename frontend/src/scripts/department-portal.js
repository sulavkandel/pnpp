const apiBase = "http://localhost:4000";
const storedDepartment = sessionStorage.getItem("department_user");
const departmentAuthToken = sessionStorage.getItem("department_auth_token");

if (!storedDepartment || !departmentAuthToken) {
  window.location.replace("./department-login.html");
}

const officer = storedDepartment ? JSON.parse(storedDepartment) : null;
let currentLanguage = "ne";
let activeTab = "new";
let dashboard = null;
let selectedComplaintToken = "";

const translations = {
  ne: {
    topTitle: "जनसेवा · अधिकृत पोर्टल",
    weekLabel: "साप्ताहिक रोटेसन: {week}",
    gov: "पोखरा महानगरपालिका",
    main: "Officer Portal",
    sub: "गुनासो समीक्षा, स्वीकृति, फर्वार्ड र प्रदर्शन अनुगमन",
    logout: "लगआउट",
    alert: "{count} गुनासोमा पहिलो समीक्षा बाँकी छ। २४ घण्टाभित्र समीक्षा गर्नुहोस्।",
    noAlert: "यस हप्ताका सबै नयाँ गुनासो समयमै समीक्षा गरिएको छ।",
    tabNew: "गुनासो पंक्ति",
    tabAccepted: "मेरो समाधान",
    tabClosed: "फर्वार्ड / बन्द",
    tabPerformance: "मेरो रिपोर्ट",
    pointsEyebrow: "मेरो अंक",
    pointsCopy: "Performance points",
    solvedMini: "समाधान",
    pendingMini: "बाँकी",
    recentActivity: "Recent activity",
    leaderboard: "Points leaderboard",
    kpiReceived: "यस हप्ता प्राप्त",
    kpiCompleted: "यस हप्ता समाधान",
    kpiResponse: "औसत प्रतिक्रिया समय",
    kpiPoints: "यस हप्ताको अंक",
    newEyebrow: "नयाँ गुनासो",
    newTitle: "२४ घण्टाभित्र प्रारम्भिक समीक्षा आवश्यक",
    acceptedEyebrow: "मेरो स्वीकृत गुनासो",
    acceptedTitle: "प्रगतिमा रहेका कार्य",
    closedEyebrow: "फर्वार्ड / बन्द",
    closedTitle: "बन्द गरिएका वा माथि पठाइएका गुनासो",
    performanceEyebrow: "Officer Performance",
    performanceTitle: "अंक, इतिहास र साप्ताहिक रिपोर्ट",
    reportButton: "Download Weekly Report",
    reviewEyebrow: "Complaint Review",
    reviewTitle: "Review and handle complaint",
    reviewAction: "Action",
    reviewEta: "Estimated completion",
    reviewComment: "Reason / comment",
    reviewForwardType: "Forward target",
    reviewForwardDivision: "Division",
    reviewForwardSection: "Section / unit",
    reviewForwardWard: "Ward number",
    reviewSubmit: "Submit Review",
    actionSuccess: "कार्य सफलतापूर्वक अद्यावधिक भयो।",
    actionFailed: "कार्य पूरा गर्न सकिएन।",
    accept: "Accept",
    forward: "Forward",
    escalate: "Escalate",
    invalid: "Mark Invalid",
    delay: "Delay",
    resolve: "Close as Resolved",
    noForward: "No forwarding",
    department: "Department",
    ward: "Ward",
    centralAdmin: "Central Admin",
    noComplaints: "यस सूचीमा हाल गुनासो छैन।",
    noSelection: "सूचीबाट गुनासो छान्नुहोस्।",
    urgencyHigh: "अत्यावश्यक",
    status_pending: "समीक्षाधीन",
    status_in_progress: "प्रगतिमा",
    status_solved: "समाधान गरिएको",
    status_delayed: "ढिलाइ",
    status_forwarded: "फर्वार्ड गरिएको",
    status_escalated: "एस्केलेट गरिएको",
    status_pending_admin_verification: "प्रशासन पुष्टि बाँकी",
    reviewButton: "समीक्षा गर्नुहोस्",
    pointsCurrent: "Current points",
    pointsWeek: "Points earned this week",
    pointsAll: "All-time points",
    feedbackTitle: "Central admin feedback",
    performanceHistoryTitle: "Handled complaint history",
    noFeedback: "अहिलेसम्म कुनै प्रशासनिक टिप्पणी छैन।",
    officerNameLabel: "अधिकृत",
    departmentLabel: "विभाग",
    citizenLabel: "नागरिक",
    locationLabel: "स्थान",
    attachmentsLabel: "संलग्न फाइल",
    timelineLabel: "समयरेखा",
    commentsLabel: "टिप्पणीहरू",
    invalidNeedsReason: "Invalid भनेर पठाउँदा कारण आवश्यक छ।",
    forwardNeedsTarget: "Forward गर्दा लक्ष्य छान्नुहोस्।",
    downloadHint: "Weekly report print dialog opened. Save as PDF from the browser.",
  },
  en: {
    topTitle: "JanaSewa · Officer Portal",
    weekLabel: "Weekly rotation: {week}",
    gov: "Pokhara Metropolitan City",
    main: "Officer Portal",
    sub: "Review, accept, forward, escalate, and track officer performance",
    logout: "Logout",
    alert: "{count} complaints are still awaiting first review. Review them within 24 hours.",
    noAlert: "All new complaints for this week have been reviewed on time.",
    tabNew: "Complaint Queue",
    tabAccepted: "My Accepted",
    tabClosed: "Forwarded / Closed",
    tabPerformance: "My Performance",
    pointsEyebrow: "My points",
    pointsCopy: "Performance points",
    solvedMini: "Resolved",
    pendingMini: "Pending",
    recentActivity: "Recent activity",
    leaderboard: "Points leaderboard",
    kpiReceived: "Received this week",
    kpiCompleted: "Completed this week",
    kpiResponse: "Average response time",
    kpiPoints: "This week's points",
    newEyebrow: "New complaints",
    newTitle: "Initial review required within 24 hours",
    acceptedEyebrow: "My accepted complaints",
    acceptedTitle: "Work currently in progress",
    closedEyebrow: "Forwarded / closed",
    closedTitle: "Closed or escalated complaints",
    performanceEyebrow: "Officer Performance",
    performanceTitle: "Points, history, and weekly report",
    reportButton: "Download Weekly Report",
    reviewEyebrow: "Complaint Review",
    reviewTitle: "Review and handle complaint",
    reviewAction: "Action",
    reviewEta: "Estimated completion",
    reviewComment: "Reason / comment",
    reviewForwardType: "Forward target",
    reviewForwardDivision: "Division",
    reviewForwardSection: "Section / unit",
    reviewForwardWard: "Ward number",
    reviewSubmit: "Submit Review",
    actionSuccess: "Action updated successfully.",
    actionFailed: "Could not complete the action.",
    accept: "Accept",
    forward: "Forward",
    escalate: "Escalate",
    invalid: "Mark Invalid",
    delay: "Delay",
    resolve: "Close as Resolved",
    noForward: "No forwarding",
    department: "Department",
    ward: "Ward",
    centralAdmin: "Central Admin",
    noComplaints: "No complaints in this list right now.",
    noSelection: "Select a complaint from the queue.",
    urgencyHigh: "Urgent",
    status_pending: "Under Review",
    status_in_progress: "In Progress",
    status_solved: "Resolved",
    status_delayed: "Delayed",
    status_forwarded: "Forwarded",
    status_escalated: "Escalated",
    status_pending_admin_verification: "Pending Admin Verification",
    reviewButton: "Review",
    pointsCurrent: "Current points",
    pointsWeek: "Points earned this week",
    pointsAll: "All-time points",
    feedbackTitle: "Central admin feedback",
    performanceHistoryTitle: "Handled complaint history",
    noFeedback: "No admin feedback yet.",
    officerNameLabel: "Officer",
    departmentLabel: "Department",
    citizenLabel: "Citizen",
    locationLabel: "Location",
    attachmentsLabel: "Attachments",
    timelineLabel: "Timeline",
    commentsLabel: "Comments",
    invalidNeedsReason: "A reason is required when marking a complaint invalid.",
    forwardNeedsTarget: "Choose a forwarding target.",
    downloadHint: "Weekly report opened in print mode. Save as PDF from the browser.",
  },
};

function t() {
  return translations[currentLanguage];
}

function statusLabel(status) {
  return t()[`status_${status}`] || status || "-";
}

function statusClass(status) {
  if (status === "solved") return "department-badge-green";
  if (status === "delayed" || status === "pending_admin_verification") return "department-badge-red";
  if (status === "in_progress") return "department-badge-amber";
  return "department-badge-blue";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString(currentLanguage === "ne" ? "ne-NP" : "en-US");
}

function complaintAgeHours(complaint) {
  return Math.max(0, Math.round((Date.now() - new Date(complaint.createdAt).getTime()) / 3600000));
}

function urgencyBadge(complaint) {
  const age = complaintAgeHours(complaint);
  if (age >= 12) {
    return `<span class="department-badge department-badge-red">${t().urgencyHigh}</span>`;
  }
  if (age >= 6) {
    return `<span class="department-badge department-badge-amber">${age}h</span>`;
  }
  return `<span class="department-badge department-badge-blue">${age}h</span>`;
}

async function fetchDashboard() {
  const response = await fetch(`${apiBase}/api/officer/dashboard`, {
    headers: {
      Authorization: `Bearer ${departmentAuthToken}`,
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || t().actionFailed);
  return result.dashboard;
}

async function fetchComplaint(tokenNumber) {
  const response = await fetch(`${apiBase}/api/complaints/${tokenNumber}`, {
    headers: {
      Authorization: `Bearer ${departmentAuthToken}`,
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || t().actionFailed);
  return result.complaint;
}

function complaintCard(complaint) {
  const deadlineHours = Math.max(0, 24 - complaintAgeHours(complaint));
  return `
    <article class="officer-complaint-card ${complaint.status === "solved" ? "is-solved" : ""}">
      <div class="citizen-complaint-card-head">
        <div>
          <p class="department-tid">${complaint.tokenNumber}</p>
          <strong>${complaint.title || complaint.subcategory || complaint.category}</strong>
          <p>${complaint.assignedOfficeLabel || "-"} · ${complaint.citizenName || "-"}</p>
        </div>
        <div class="officer-card-badges">
          ${urgencyBadge(complaint)}
          <span class="department-badge ${statusClass(complaint.status)}">${statusLabel(complaint.status)}</span>
        </div>
      </div>
      <p class="citizen-muted-copy">${complaint.description || "-"}</p>
      <div class="officer-card-meta">
        <span>${formatDate(complaint.createdAt)}</span>
        <span>${deadlineHours}h left</span>
      </div>
      <button type="button" class="button primary compact-button" data-review-token="${complaint.tokenNumber}">${t().reviewButton}</button>
    </article>
  `;
}

function renderList(targetId, complaints) {
  const node = document.getElementById(targetId);
  if (!node) return;
  node.innerHTML = complaints.length
    ? complaints.map(complaintCard).join("")
    : `<div class="admin-list-card"><p>${t().noComplaints}</p></div>`;
}

function renderStatic() {
  document.documentElement.lang = currentLanguage;
  document.getElementById("officer-top-title").textContent = t().topTitle;
  document.getElementById("officer-week-label").textContent = t().weekLabel.replace("{week}", dashboard?.weekKey || "-");
  document.getElementById("dept-gov-label").textContent = t().gov;
  document.getElementById("dept-main-title").textContent = t().main;
  document.getElementById("dept-subtitle").textContent = t().sub;
  document.getElementById("department-logout-button").textContent = t().logout;
  document.getElementById("tab-link-new").textContent = t().tabNew;
  document.getElementById("tab-link-accepted").textContent = t().tabAccepted;
  document.getElementById("tab-link-closed").textContent = t().tabClosed;
  document.getElementById("tab-link-performance").textContent = t().tabPerformance;
  document.getElementById("points-summary-eyebrow").textContent = t().pointsEyebrow;
  document.getElementById("officer-points-copy").textContent = t().pointsCopy;
  document.getElementById("officer-solved-mini-label").textContent = t().solvedMini;
  document.getElementById("officer-pending-mini-label").textContent = t().pendingMini;
  document.getElementById("recent-activity-eyebrow").textContent = t().recentActivity;
  document.getElementById("leaderboard-eyebrow").textContent = t().leaderboard;
  document.getElementById("tab-button-new").textContent = currentLanguage === "ne" ? "New Complaints" : "New Complaints";
  document.getElementById("tab-button-accepted").textContent = currentLanguage === "ne" ? "My Accepted Complaints" : "My Accepted Complaints";
  document.getElementById("tab-button-closed").textContent = currentLanguage === "ne" ? "Forwarded / Closed" : "Forwarded / Closed";
  document.getElementById("tab-button-performance").textContent = currentLanguage === "ne" ? "My Performance" : "My Performance";
  document.getElementById("new-complaints-eyebrow").textContent = t().newEyebrow;
  document.getElementById("new-complaints-title").textContent = t().newTitle;
  document.getElementById("accepted-complaints-eyebrow").textContent = t().acceptedEyebrow;
  document.getElementById("accepted-complaints-title").textContent = t().acceptedTitle;
  document.getElementById("closed-complaints-eyebrow").textContent = t().closedEyebrow;
  document.getElementById("closed-complaints-title").textContent = t().closedTitle;
  document.getElementById("performance-eyebrow").textContent = t().performanceEyebrow;
  document.getElementById("performance-title").textContent = t().performanceTitle;
  document.getElementById("download-weekly-report-button").textContent = t().reportButton;
  document.getElementById("review-eyebrow").textContent = t().reviewEyebrow;
  document.getElementById("review-title").textContent = t().reviewTitle;
  document.getElementById("review-status-label").textContent = t().reviewAction;
  document.getElementById("review-eta-label").textContent = t().reviewEta;
  document.getElementById("review-comment-label").textContent = t().reviewComment;
  document.getElementById("review-forward-type-label").textContent = t().reviewForwardType;
  document.getElementById("review-forward-division-label").textContent = t().reviewForwardDivision;
  document.getElementById("review-forward-section-label").textContent = t().reviewForwardSection;
  document.getElementById("review-forward-ward-label").textContent = t().reviewForwardWard;
  document.getElementById("officer-review-submit-button").textContent = t().reviewSubmit;

  const statusSelect = document.getElementById("review-status-select");
  statusSelect.options[0].textContent = t().accept;
  statusSelect.options[1].textContent = t().forward;
  statusSelect.options[2].textContent = t().escalate;
  statusSelect.options[3].textContent = t().invalid;
  statusSelect.options[4].textContent = t().delay;
  statusSelect.options[5].textContent = t().resolve;

  const forwardSelect = document.getElementById("review-forward-type-select");
  forwardSelect.options[0].textContent = t().noForward;
  forwardSelect.options[1].textContent = t().department;
  forwardSelect.options[2].textContent = t().ward;
  forwardSelect.options[3].textContent = t().centralAdmin;

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });
}

function renderHeader() {
  document.getElementById("department-officer-name").textContent = dashboard.header.officerName;
  document.getElementById("department-officer-office").textContent = dashboard.header.departmentName;
  document.getElementById("department-avatar").textContent = dashboard.header.officerName.split(" ").map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
  document.getElementById("officer-points-total").textContent = String(dashboard.header.currentWeekPoints);
  document.getElementById("officer-solved-mini").textContent = String(dashboard.kpis.complaintsCompletedThisWeek);
  document.getElementById("officer-pending-mini").textContent = String(dashboard.tabs.myAcceptedComplaints.length);
  document.getElementById("officer-alert-banner").textContent = dashboard.alerts.pendingFirstReviewCount
    ? t().alert.replace("{count}", dashboard.alerts.pendingFirstReviewCount)
    : t().noAlert;
}

function renderKpis() {
  document.getElementById("officer-summary-row").innerHTML = [
    [t().kpiReceived, dashboard.kpis.complaintsReceivedThisWeek, "is-red"],
    [t().kpiCompleted, dashboard.kpis.complaintsCompletedThisWeek, "is-green"],
    [t().kpiResponse, dashboard.kpis.averageResponseTime, "is-amber"],
    [t().kpiPoints, dashboard.header.currentWeekPoints, "is-blue"],
  ].map(([label, value, className]) => `
    <div class="department-kpi-card citizen-stat-card">
      <div class="department-kpi-num ${className}">${value}</div>
      <div class="department-kpi-lbl">${label}</div>
    </div>
  `).join("");
}

function renderSidebar() {
  document.getElementById("recent-activity-list").innerHTML = dashboard.recentActivity.length
    ? dashboard.recentActivity.map((item) => `
      <div class="department-detail-line">
        <strong>${item.complaintToken}</strong>
        <span>${item.note || item.action}</span>
        <small>${formatDate(item.timestamp)}</small>
      </div>
    `).join("")
    : `<p class="citizen-muted-copy">${t().noComplaints}</p>`;

  document.getElementById("leaderboard-list").innerHTML = dashboard.leaderboard.length
    ? dashboard.leaderboard.map((item, index) => `
      <div class="officer-leaderboard-row">
        <span>${index + 1}. ${item.name}</span>
        <strong>${item.points}</strong>
      </div>
    `).join("")
    : `<p class="citizen-muted-copy">${t().noComplaints}</p>`;
}

function renderTabs() {
  renderList("officer-new-list", dashboard.tabs.newComplaints);
  renderList("officer-accepted-list", dashboard.tabs.myAcceptedComplaints);
  renderList("officer-closed-list", dashboard.tabs.forwardedOrClosed);
}

function renderPerformance() {
  document.getElementById("officer-performance-summary").innerHTML = `
    <h3>${t().pointsCurrent}</h3>
    <p><strong>${dashboard.performance.currentWeekPoints}</strong></p>
    <p>${t().pointsWeek}: ${dashboard.performance.pointsEarnedThisWeek}</p>
    <p>${t().pointsAll}: ${dashboard.performance.allTimePoints}</p>
  `;

  document.getElementById("officer-performance-feedback").innerHTML = `
    <h3>${t().feedbackTitle}</h3>
    ${dashboard.performance.feedback.length
      ? dashboard.performance.feedback.map((entry) => `<p>${entry.message || `${entry.points} pts`} · ${formatDate(entry.createdAt)}</p>`).join("")
      : `<p>${t().noFeedback}</p>`}
  `;

  document.getElementById("officer-performance-history").innerHTML = dashboard.performance.history.length
    ? dashboard.performance.history.map((item) => `
      <article class="admin-list-card">
        <strong>${item.tokenNumber} · ${item.title}</strong>
        <p>${statusLabel(item.status)} · ${formatDate(item.updatedAt)}</p>
        <p>${item.points ? `+${item.points} pts` : "0 pts"}</p>
      </article>
    `).join("")
    : `<div class="admin-list-card"><p>${t().noComplaints}</p></div>`;
}

async function renderSelectedComplaint() {
  const complaint = [...dashboard.tabs.newComplaints, ...dashboard.tabs.myAcceptedComplaints, ...dashboard.tabs.forwardedOrClosed]
    .find((item) => item.tokenNumber === selectedComplaintToken);
  const node = document.getElementById("officer-selected-complaint");

  if (!complaint) {
    node.innerHTML = `<div class="detail-card"><p>${t().noSelection}</p></div>`;
    return;
  }

  let detailed = complaint;
  try {
    detailed = await fetchComplaint(complaint.tokenNumber);
  } catch {}

  const attachments = detailed.attachments?.length
    ? detailed.attachments.map((item) => `<a class="track-link" href="${item.dataUrl}" download="${item.name}">${item.name}</a>`).join("<br />")
    : "-";
  const comments = detailed.comments?.length
    ? detailed.comments.map((item) => `<div class="department-detail-line"><strong>${item.actorName}</strong><span>${item.message}</span><small>${formatDate(item.createdAt)}</small></div>`).join("")
    : `<p>-</p>`;
  const history = detailed.history?.length
    ? detailed.history.map((item) => `<div class="department-detail-line"><strong>${item.action}</strong><span>${item.note || "-"}</span><small>${formatDate(item.timestamp || item.createdAt)}</small></div>`).join("")
    : `<p>-</p>`;

  node.innerHTML = `
    <div class="details-list citizen-detail-grid">
      <div class="detail-card">
        <h3>${detailed.title || detailed.subcategory || detailed.category}</h3>
        <p><strong>${t().officerNameLabel}:</strong> ${dashboard.header.officerName}</p>
        <p><strong>${t().departmentLabel}:</strong> ${detailed.assignedOfficeLabel || "-"}</p>
        <p><strong>${t().citizenLabel}:</strong> ${detailed.citizenName || "-"}</p>
        <p><strong>${t().locationLabel}:</strong> ${detailed.locationText || "-"}</p>
        <p>${detailed.description || "-"}</p>
        <p><strong>${t().attachmentsLabel}:</strong><br />${attachments}</p>
      </div>
      <div class="detail-card">
        <h3>${t().commentsLabel}</h3>
        ${comments}
      </div>
      <div class="detail-card">
        <h3>${t().timelineLabel}</h3>
        ${history}
      </div>
    </div>
  `;
}

function bindReviewButtons() {
  document.querySelectorAll("[data-review-token]").forEach((button) => {
    button.addEventListener("click", async () => {
      selectedComplaintToken = button.dataset.reviewToken;
      await renderSelectedComplaint();
    });
  });
}

async function loadDashboard() {
  dashboard = await fetchDashboard();
  selectedComplaintToken ||= dashboard.tabs.newComplaints[0]?.tokenNumber || dashboard.tabs.myAcceptedComplaints[0]?.tokenNumber || "";
}

function setActiveTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".officer-section").forEach((section) => {
    section.classList.toggle("active", section.id === `officer-section-${tab}`);
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
}

async function renderAll() {
  renderStatic();
  renderHeader();
  renderKpis();
  renderSidebar();
  renderTabs();
  renderPerformance();
  bindReviewButtons();
  await renderSelectedComplaint();
  setActiveTab(activeTab);
}

async function submitReview() {
  if (!selectedComplaintToken) return;

  const action = document.getElementById("review-status-select").value;
  const eta = document.getElementById("review-eta-input").value;
  const comment = document.getElementById("review-comment-input").value.trim();
  const forwardType = document.getElementById("review-forward-type-select").value;
  const targetDivisionName = document.getElementById("review-forward-division-input").value.trim();
  const targetSectionName = document.getElementById("review-forward-section-input").value.trim();
  const targetWardNumber = document.getElementById("review-forward-ward-input").value.trim();
  const messageNode = document.getElementById("officer-action-message");
  messageNode.className = "form-message";
  messageNode.textContent = "";

  try {
    if (action === "forward") {
      if (!forwardType) throw new Error(t().forwardNeedsTarget);
      const response = await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}/forward`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${departmentAuthToken}`,
        },
        body: JSON.stringify({
          targetOfficeType: forwardType === "central_admin" ? "" : forwardType,
          targetDivisionName,
          targetSectionName,
          targetWardNumber,
          comment,
          escalateToCentralAdmin: forwardType === "central_admin",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || t().actionFailed);
    } else {
      if (action === "pending_admin_verification" && !comment) {
        throw new Error(t().invalidNeedsReason);
      }
      const response = await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${departmentAuthToken}`,
        },
        body: JSON.stringify({
          status: action,
          comment,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || t().actionFailed);

      if (eta && ["in_progress", "delayed", "solved"].includes(action)) {
        await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}/eta`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${departmentAuthToken}`,
          },
          body: JSON.stringify({
            estimatedCompletionAt: eta,
          }),
        });
      }
    }

    messageNode.classList.add("success");
    messageNode.textContent = t().actionSuccess;
    await loadDashboard();
    await renderAll();
  } catch (error) {
    messageNode.classList.add("error");
    messageNode.textContent = error.message || t().actionFailed;
  }
}

function downloadWeeklyReport() {
  const reportWindow = window.open("", "_blank");
  if (!reportWindow) return;
  reportWindow.document.write(`
    <html>
      <head><title>Weekly Officer Report</title></head>
      <body>
        <h1>${dashboard.header.officerName}</h1>
        <p>${dashboard.header.departmentName}</p>
        <p>${dashboard.weekKey}</p>
        <p>${t().pointsCurrent}: ${dashboard.performance.currentWeekPoints}</p>
        <p>${t().pointsAll}: ${dashboard.performance.allTimePoints}</p>
        <ul>
          ${dashboard.performance.history.map((item) => `<li>${item.tokenNumber} - ${item.title} - ${statusLabel(item.status)} - ${item.points} pts</li>`).join("")}
        </ul>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
  document.getElementById("officer-action-message").className = "form-message success";
  document.getElementById("officer-action-message").textContent = t().downloadHint;
}

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", async () => {
    currentLanguage = button.dataset.lang;
    await renderAll();
  });
});

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

document.getElementById("officer-review-submit-button")?.addEventListener("click", submitReview);
document.getElementById("download-weekly-report-button")?.addEventListener("click", downloadWeeklyReport);

document.getElementById("department-logout-button")?.addEventListener("click", async () => {
  try {
    await fetch(`${apiBase}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${departmentAuthToken}`,
      },
    });
  } catch {}

  sessionStorage.removeItem("department_user");
  sessionStorage.removeItem("department_auth_token");
  window.location.replace("./department-login.html");
});

loadDashboard()
  .then(renderAll)
  .catch((error) => {
    const node = document.getElementById("officer-selected-complaint");
    if (node) {
      node.innerHTML = `<div class="detail-card"><p>${error.message || t().actionFailed}</p></div>`;
    }
  });
