import { apiBase, appRoutes } from "./runtime-config.js";
const storedDepartment = sessionStorage.getItem("department_user");
const departmentAuthToken = sessionStorage.getItem("department_auth_token");

if (!storedDepartment || !departmentAuthToken) {
  window.location.replace(appRoutes.departmentLogin);
}

const officer = JSON.parse(storedDepartment);
let currentLanguage = "ne";
let activeTab = "new";
let dashboard = null;
let handoverComplaints = [];
let selectedComplaintToken = "";

const departmentCatalog = [
  { code: "ADMIN", division: "Administration", sections: ["Admin Section", "Inspection (Security)", "Fire & Emergency"] },
  { code: "FIN", division: "Finance & Revenue", sections: ["Internal Audit", "Procurement", "Revenue/Tax Units"] },
  { code: "INFRA", division: "Infrastructure Development", sections: ["Road Section", "Bridge Section", "Buildings", "Water & Sewer"] },
  { code: "URBAN", division: "Urban Dev & Environment", sections: ["Tourism", "Sanitation/Waste", "Greenery Units"] },
  { code: "PLANIT", division: "Planning, Monitoring & IT", sections: ["IT Section", "Data & Statistics", "Documentation"] },
  { code: "SOCIAL", division: "Social Development", sections: ["Women/Child Program", "Social Security", "Community Development"] },
  { code: "HEALTH", division: "Health", sections: ["Health Services / Health Center Coordination"] },
  { code: "EDU", division: "Education", sections: ["School Management / Education Programs"] },
  { code: "ECON", division: "Economic Development", sections: ["Business Promotion", "Employment", "Agri & Livestock"] },
  { code: "LEGAL", division: "Legal", sections: ["Legal Advice / Dispute Management"] },
];

const translations = {
  ne: {
    topTitle: "जनसेवा · अधिकृत पोर्टल",
    weekLabel: "साप्ताहिक कार्य अवधि: {week}",
    gov: "पोखरा महानगरपालिका",
    main: "अधिकृत पोर्टल",
    sub: "गुनासो समीक्षा, कार्य प्रगति र विभागीय समन्वय",
    logout: "लगआउट",
    alert: "{count} गुनासोमा प्रारम्भिक समीक्षा बाँकी छ।",
    noAlert: "यस हप्ताका सबै नयाँ गुनासो समयमै समीक्षा भएका छन्।",
    tabNew: "नयाँ गुनासो",
    tabForwarded: "मलाई पठाइएका",
    tabAccepted: "प्रगतिमा",
    tabClosed: "फर्वार्ड / बन्द",
    tabPerformance: "मेरो रिपोर्ट",
    pointsEyebrow: "मेरो अंक",
    pointsCopy: "Performance points",
    solvedMini: "समाधान",
    pendingMini: "बाँकी",
    recentActivity: "हालैको गतिविधि",
    leaderboard: "अंक तालिका",
    kpiReceived: "यस हप्ता प्राप्त",
    kpiForwarded: "मलाई पठाइएका",
    kpiCompleted: "यस हप्ता समाधान",
    kpiResponse: "औसत प्रतिक्रिया",
    kpiPoints: "यस हप्ताको अंक",
    newEyebrow: "नयाँ गुनासो",
    newTitle: "२४ घण्टाभित्र प्रारम्भिक समीक्षा गर्नुहोस्",
    forwardedEyebrow: "मलाई पठाइएका गुनासो",
    forwardedTitle: "अन्य विभागबाट आएका गुनासो",
    acceptedEyebrow: "प्रगतिमा रहेका गुनासो",
    acceptedTitle: "स्वीकृत र कार्यरत गुनासो",
    closedEyebrow: "फर्वार्ड / बन्द",
    closedTitle: "तपाईंले फर्वार्ड वा बन्द गरेका गुनासो",
    performanceEyebrow: "अधिकृत प्रदर्शन",
    performanceTitle: "अंक, इतिहास र साप्ताहिक रिपोर्ट",
    reportButton: "साप्ताहिक रिपोर्ट",
    reviewEyebrow: "गुनासो समीक्षा",
    reviewTitle: "कार्य चयन गरी समीक्षा पठाउनुहोस्",
    reviewAction: "कार्य छान्नुहोस्",
    accept: "स्वीकार गर्नुहोस्",
    forward: "फर्वार्ड गर्नुहोस्",
    escalate: "केन्द्रीय प्रशासनमा पठाउनुहोस्",
    invalid: "अवैध चिन्ह लगाउनुहोस्",
    delay: "ढिलाइ देखाउनुहोस्",
    resolve: "समाधान गरेर बन्द गर्नुहोस्",
    expectedDate: "अपेक्षित सम्पन्न मिति",
    comment: "टिप्पणी",
    forwardDepartment: "लक्ष्य विभाग",
    forwardSection: "लक्ष्य उप-विभाग",
    reviewSubmit: "समीक्षा पठाउनुहोस्",
    actionSuccess: "कार्य सफलतापूर्वक अद्यावधिक भयो।",
    actionFailed: "कार्य पूरा गर्न सकिएन।",
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
    pointsCurrent: "हालको अंक",
    pointsWeek: "यस हप्ताको अंक",
    pointsAll: "कुल अंक",
    feedbackTitle: "केन्द्रीय प्रशासन प्रतिक्रिया",
    noFeedback: "अहिलेसम्म कुनै प्रतिक्रिया छैन।",
    officerNameLabel: "अधिकृत",
    departmentLabel: "कार्यालय",
    citizenLabel: "नागरिक",
    locationLabel: "स्थान",
    attachmentsLabel: "संलग्न फाइल",
    timelineLabel: "समयरेखा",
    commentsLabel: "टिप्पणीहरू",
    invalidNeedsReason: "अवैध चिन्ह लगाउँदा टिप्पणी आवश्यक छ।",
    forwardNeedsTarget: "फर्वार्ड गर्न लक्ष्य विभाग र उप-विभाग छान्नुहोस्।",
    acceptedNeedsEta: "स्वीकार गर्दा अपेक्षित सम्पन्न मिति आवश्यक छ।",
    delayNeedsEta: "ढिलाइ गर्दा नयाँ मिति आवश्यक छ।",
    escalateNeedsComment: "एस्केलेट गर्दा टिप्पणी आवश्यक छ।",
    resolveNeedsComment: "समाधान गर्दा टिप्पणी आवश्यक छ।",
    downloadHint: "Print dialog opened. Save as PDF if needed.",
    handoverEyebrow: "ह्यान्डओभर समीक्षा",
    handoverTitle: "अघिल्ला अधिकृतले समाधान गरेका गुनासो पुष्टि गर्नुहोस्",
    handoverEmpty: "ह्यान्डओभर समीक्षाको लागि गुनासो छैन।",
    handoverVerify: "पुष्टि गर्नुहोस्",
    handoverFlag: "अपूर्ण चिन्ह लगाउनुहोस्",
    proofImageLabel: "प्रमाण फोटो",
    handoverFlagReason: "अपूर्णताको कारण",
    handoverFlagSubmit: "झण्डा पठाउनुहोस्",
    handoverFlagSuccess: "झण्डा प्रशासनको समीक्षाका लागि पठाइयो।",
    handoverFlagNeedsReason: "कारण आवश्यक छ।",
    handoverFlagPending: "प्रशासन समीक्षाधीन",
    handoverFlagVerified: "पुष्टि भयो",
    handoverFlagRejected: "अस्वीकार गरियो",
    handoverCancel: "रद्द गर्नुहोस्",
    handoverFlaggedBy: "झण्डा लगाउनेः",
    handoverFlagReason2: "कारणः",
  },
  en: {
    topTitle: "JanaSewa · Officer Portal",
    weekLabel: "Weekly duty: {week}",
    gov: "Pokhara Metropolitan City",
    main: "Officer Portal",
    sub: "Complaint review, work progress, and department coordination",
    logout: "Logout",
    alert: "{count} complaints are still waiting for first review.",
    noAlert: "All new complaints have been reviewed on time this week.",
    tabNew: "New Complaints",
    tabForwarded: "Forwarded To Me",
    tabAccepted: "In Progress",
    tabClosed: "Forwarded / Closed",
    tabPerformance: "My Performance",
    pointsEyebrow: "My points",
    pointsCopy: "Performance points",
    solvedMini: "Resolved",
    pendingMini: "Pending",
    recentActivity: "Recent activity",
    leaderboard: "Points leaderboard",
    kpiReceived: "Received this week",
    kpiForwarded: "Forwarded to me",
    kpiCompleted: "Completed this week",
    kpiResponse: "Average response",
    kpiPoints: "Weekly points",
    newEyebrow: "New complaints",
    newTitle: "Complete initial review within 24 hours",
    forwardedEyebrow: "Forwarded to me",
    forwardedTitle: "Complaints received from other departments",
    acceptedEyebrow: "In-progress complaints",
    acceptedTitle: "Accepted complaints under work",
    closedEyebrow: "Forwarded / Closed",
    closedTitle: "Complaints you forwarded or closed",
    performanceEyebrow: "Officer performance",
    performanceTitle: "Points, history, and weekly report",
    reportButton: "Weekly report",
    reviewEyebrow: "Complaint review",
    reviewTitle: "Choose an action and submit review",
    reviewAction: "Select action",
    accept: "Accept",
    forward: "Forward",
    escalate: "Escalate to Central Admin",
    invalid: "Mark Invalid",
    delay: "Delay",
    resolve: "Close as Resolved",
    expectedDate: "Expected completion date",
    comment: "Comment",
    forwardDepartment: "Target department",
    forwardSection: "Target sub department",
    reviewSubmit: "Submit Review",
    actionSuccess: "Action updated successfully.",
    actionFailed: "Could not complete the action.",
    noComplaints: "No complaints in this list right now.",
    noSelection: "Select a complaint from the list.",
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
    noFeedback: "No admin feedback yet.",
    officerNameLabel: "Officer",
    departmentLabel: "Office",
    citizenLabel: "Citizen",
    locationLabel: "Location",
    attachmentsLabel: "Attachments",
    timelineLabel: "Timeline",
    commentsLabel: "Comments",
    invalidNeedsReason: "A comment is required when marking invalid.",
    forwardNeedsTarget: "Choose the target department and sub department.",
    acceptedNeedsEta: "Expected completion date is required when accepting.",
    delayNeedsEta: "A new completion date is required for delay.",
    escalateNeedsComment: "A comment is required when escalating.",
    resolveNeedsComment: "A resolution comment is required.",
    downloadHint: "Print dialog opened. Save as PDF if needed.",
    handoverEyebrow: "Handover Review",
    handoverTitle: "Verify resolved complaints from outgoing officers",
    handoverEmpty: "No complaints pending handover review.",
    handoverVerify: "Verify",
    handoverFlag: "Flag as Incomplete",
    proofImageLabel: "Proof Image",
    handoverFlagReason: "Reason for flagging",
    handoverFlagSubmit: "Submit Flag",
    handoverFlagSuccess: "Flag submitted for admin review.",
    handoverFlagNeedsReason: "A reason is required.",
    handoverFlagPending: "Pending Admin Review",
    handoverFlagVerified: "Flag Verified",
    handoverFlagRejected: "Flag Rejected",
    handoverCancel: "Cancel",
    handoverFlaggedBy: "Flagged by:",
    handoverFlagReason2: "Reason:",
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
  if (status === "forwarded" || status === "escalated") return "department-badge-blue";
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
  if (complaint.status === "solved" || complaint.status === "closed_invalid" || complaint.status === "cannot_solve") {
    return "";
  }
  const age = complaintAgeHours(complaint);
  const hoursLeft = Math.max(0, 24 - age);
  if (age >= 24) {
    return `<span class="department-badge department-badge-red" style="animation:pulse 1s infinite">🔴 OVERDUE</span>`;
  }
  if (hoursLeft <= 6) {
    return `<span class="department-badge department-badge-red">⚠️ ${hoursLeft}h left</span>`;
  }
  if (hoursLeft <= 12) {
    return `<span class="department-badge department-badge-amber">⏰ ${hoursLeft}h left</span>`;
  }
  return `<span class="department-badge department-badge-blue">${hoursLeft}h left</span>`;
}

async function fetchDashboard() {
  const response = await fetch(`${apiBase}/api/officer/dashboard`, {
    headers: { Authorization: `Bearer ${departmentAuthToken}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || t().actionFailed);
  return result.dashboard;
}

async function fetchComplaint(tokenNumber) {
  const response = await fetch(`${apiBase}/api/complaints/${tokenNumber}`, {
    headers: { Authorization: `Bearer ${departmentAuthToken}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || t().actionFailed);
  return result.complaint;
}

function getAllReviewableComplaints() {
  return [
    ...(dashboard?.tabs.newComplaints || []),
    ...(dashboard?.tabs.forwardedToMe || []),
    ...(dashboard?.tabs.myAcceptedComplaints || []),
    ...(dashboard?.tabs.forwardedOrClosed || []),
  ];
}

function complaintCard(complaint) {
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
        ${urgencyBadge(complaint)}
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

function fillForwardDepartments() {
  const divisionSelect = document.getElementById("review-forward-division-select");
  const sectionSelect = document.getElementById("review-forward-section-select");
  if (!divisionSelect || !sectionSelect) return;

  const currentDivision = divisionSelect.value;
  divisionSelect.innerHTML = `<option value="">${t().forwardDepartment}</option>${departmentCatalog
    .map((department) => `<option value="${department.division}" ${currentDivision === department.division ? "selected" : ""}>${department.division}</option>`)
    .join("")}`;

  const selected = departmentCatalog.find((department) => department.division === divisionSelect.value) || departmentCatalog[0];
  const currentSection = sectionSelect.value;
  sectionSelect.innerHTML = `<option value="">${t().forwardSection}</option>${(selected?.sections || [])
    .map((section) => `<option value="${section}" ${currentSection === section ? "selected" : ""}>${section}</option>`)
    .join("")}`;
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
  document.getElementById("tab-link-forwarded").textContent = t().tabForwarded;
  document.getElementById("tab-link-accepted").textContent = t().tabAccepted;
  document.getElementById("tab-link-closed").textContent = t().tabClosed;
  document.getElementById("tab-link-performance").textContent = t().tabPerformance;
  document.getElementById("points-summary-eyebrow").textContent = t().pointsEyebrow;
  document.getElementById("officer-points-copy").textContent = t().pointsCopy;
  document.getElementById("officer-solved-mini-label").textContent = t().solvedMini;
  document.getElementById("officer-pending-mini-label").textContent = t().pendingMini;
  document.getElementById("recent-activity-eyebrow").textContent = t().recentActivity;
  document.getElementById("leaderboard-eyebrow").textContent = t().leaderboard;
  document.getElementById("tab-button-new").textContent = t().tabNew;
  document.getElementById("tab-button-forwarded").textContent = t().tabForwarded;
  document.getElementById("tab-button-accepted").textContent = t().tabAccepted;
  document.getElementById("tab-button-closed").textContent = t().tabClosed;
  document.getElementById("tab-button-performance").textContent = t().tabPerformance;
  document.getElementById("tab-button-handover").textContent = currentLanguage === "ne" ? "ह्यान्डओभर" : "Handover Review";
  document.getElementById("tab-link-handover").textContent = currentLanguage === "ne" ? "ह्यान्डओभर समीक्षा" : "Handover Review";
  document.getElementById("handover-complaints-eyebrow").textContent = t().handoverEyebrow;
  document.getElementById("handover-complaints-title").textContent = t().handoverTitle;
  document.getElementById("new-complaints-eyebrow").textContent = t().newEyebrow;
  document.getElementById("new-complaints-title").textContent = t().newTitle;
  document.getElementById("forwarded-complaints-eyebrow").textContent = t().forwardedEyebrow;
  document.getElementById("forwarded-complaints-title").textContent = t().forwardedTitle;
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
  document.getElementById("review-eta-label").textContent = t().expectedDate;
  document.getElementById("review-comment-label").textContent = t().comment;
  document.getElementById("review-forward-division-label").textContent = t().forwardDepartment;
  document.getElementById("review-forward-section-label").textContent = t().forwardSection;
  document.getElementById("review-forward-comment-label").textContent = t().comment;
  document.getElementById("review-escalate-comment-label").textContent = t().comment;
  document.getElementById("review-invalid-comment-label").textContent = t().comment;
  document.getElementById("review-delay-eta-label").textContent = t().expectedDate;
  document.getElementById("review-delay-comment-label").textContent = t().comment;
  document.getElementById("review-resolve-comment-label").textContent = t().comment;
  document.getElementById("officer-review-submit-button").textContent = t().reviewSubmit;

  const statusSelect = document.getElementById("review-status-select");
  statusSelect.options[0].textContent = t().accept;
  statusSelect.options[1].textContent = t().forward;
  statusSelect.options[2].textContent = t().escalate;
  statusSelect.options[3].textContent = t().invalid;
  statusSelect.options[4].textContent = t().delay;
  statusSelect.options[5].textContent = t().resolve;

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });

  fillForwardDepartments();
  syncActionGroups();
}

function renderHeader() {
  document.getElementById("department-officer-name").textContent = dashboard.header.officerName;
  document.getElementById("department-officer-office").textContent = dashboard.header.departmentName;
  document.getElementById("department-avatar").textContent = dashboard.header.officerName.split(" ").map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
  document.getElementById("officer-points-total").textContent = String(dashboard.header.currentWeekPoints);
  document.getElementById("officer-solved-mini").textContent = String(dashboard.kpis.complaintsCompletedThisWeek);
  document.getElementById("officer-pending-mini").textContent = String((dashboard.tabs.myAcceptedComplaints || []).length);
  document.getElementById("officer-alert-banner").textContent = dashboard.alerts.pendingFirstReviewCount
    ? t().alert.replace("{count}", dashboard.alerts.pendingFirstReviewCount)
    : t().noAlert;
}

function renderKpis() {
  document.getElementById("officer-summary-row").innerHTML = [
    [t().kpiReceived, dashboard.kpis.complaintsReceivedThisWeek, "is-red"],
    [t().kpiForwarded, (dashboard.tabs.forwardedToMe || []).length, "is-blue"],
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
  renderList("officer-new-list", dashboard.tabs.newComplaints || []);
  renderList("officer-forwarded-list", dashboard.tabs.forwardedToMe || []);
  renderList("officer-accepted-list", dashboard.tabs.myAcceptedComplaints || []);
  renderList("officer-closed-list", dashboard.tabs.forwardedOrClosed || []);
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
  const complaint = getAllReviewableComplaints().find((item) => item.tokenNumber === selectedComplaintToken);
  const node = document.getElementById("officer-selected-complaint");
  if (!node) return;

  if (!complaint) {
    node.innerHTML = `<div class="detail-card"><p>${t().noSelection}</p></div>`;
    return;
  }

  let detailed = complaint;
  try {
    detailed = await fetchComplaint(complaint.tokenNumber);
  } catch {
    detailed = complaint;
  }

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

  // Render proof image if available
  if (detailed.proofImage && detailed.proofImage.dataUrl) {
    const proofSection = document.createElement("div");
    proofSection.className = "detail-card";
    proofSection.innerHTML = `
      <h3>${t().proofImageLabel}</h3>
      <img src="${detailed.proofImage.dataUrl}" alt="${detailed.proofImage.name || 'Proof'}" style="max-width:100%;border-radius:8px;margin-top:8px" />
    `;
    node.querySelector(".details-list").appendChild(proofSection);
  }
}

function bindReviewButtons() {
  document.querySelectorAll("[data-review-token]").forEach((button) => {
    button.addEventListener("click", async () => {
      selectedComplaintToken = button.dataset.reviewToken;
      await renderSelectedComplaint();
    });
  });
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

function syncActionGroups() {
  const action = document.getElementById("review-status-select")?.value || "in_progress";
  ["accept", "forward", "escalate", "invalid", "delay", "solved"].forEach((group) => {
    document.getElementById(`action-group-${group}`)?.classList.add("hidden");
  });

  const map = {
    in_progress: "accept",
    forward: "forward",
    escalate: "escalate",
    pending_admin_verification: "invalid",
    delayed: "delay",
    solved: "solved",
  };

  document.getElementById(`action-group-${map[action]}`)?.classList.remove("hidden");
}

async function loadDashboard() {
  dashboard = await fetchDashboard();
  selectedComplaintToken ||= dashboard.tabs.newComplaints[0]?.tokenNumber
    || dashboard.tabs.forwardedToMe[0]?.tokenNumber
    || dashboard.tabs.myAcceptedComplaints[0]?.tokenNumber
    || "";

  // Load handover queue
  try {
    const handoverResponse = await fetch(`${apiBase}/api/officer/handover-queue`, {
      headers: { Authorization: `Bearer ${departmentAuthToken}` },
    });
    const handoverResult = await handoverResponse.json();
    if (handoverResponse.ok) {
      handoverComplaints = handoverResult.handoverComplaints || [];
    }
  } catch {
    handoverComplaints = [];
  }
}

async function renderAll() {
  renderStatic();
  renderHeader();
  renderKpis();
  renderSidebar();
  renderTabs();
  renderPerformance();
  renderHandoverList();
  bindReviewButtons();
  await renderSelectedComplaint();
  setActiveTab(activeTab);
}

async function patchStatus(status, comment) {
  const response = await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${departmentAuthToken}`,
    },
    body: JSON.stringify({ status, comment }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || t().actionFailed);
}

async function patchEta(estimatedCompletionAt) {
  const response = await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}/eta`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${departmentAuthToken}`,
    },
    body: JSON.stringify({ estimatedCompletionAt }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || t().actionFailed);
}

async function patchForward({ targetDivisionName, targetSectionName, comment, escalateToCentralAdmin }) {
  const response = await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}/forward`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${departmentAuthToken}`,
    },
    body: JSON.stringify({
      targetOfficeType: "department",
      targetDivisionName,
      targetSectionName,
      targetWardNumber: "",
      comment,
      escalateToCentralAdmin,
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || t().actionFailed);
}

function clearActionInputs() {
  [
    "review-eta-input",
    "review-comment-input",
    "review-forward-comment-input",
    "review-escalate-comment-input",
    "review-invalid-comment-input",
    "review-delay-eta-input",
    "review-delay-comment-input",
    "review-resolve-comment-input",
  ].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.value = "";
  });
}

async function submitReview() {
  if (!selectedComplaintToken) return;

  const action = document.getElementById("review-status-select").value;
  const messageNode = document.getElementById("officer-action-message");
  messageNode.className = "form-message";
  messageNode.textContent = "";

  try {
    if (action === "in_progress") {
      const eta = document.getElementById("review-eta-input").value;
      const comment = document.getElementById("review-comment-input").value.trim();
      if (!eta) throw new Error(t().acceptedNeedsEta);
      await patchStatus("in_progress", comment);
      await patchEta(eta);
    } else if (action === "forward") {
      const targetDivisionName = document.getElementById("review-forward-division-select").value;
      const targetSectionName = document.getElementById("review-forward-section-select").value;
      const comment = document.getElementById("review-forward-comment-input").value.trim();
      if (!targetDivisionName || !targetSectionName) throw new Error(t().forwardNeedsTarget);
      await patchForward({ targetDivisionName, targetSectionName, comment, escalateToCentralAdmin: false });
    } else if (action === "escalate") {
      const comment = document.getElementById("review-escalate-comment-input").value.trim();
      if (!comment) throw new Error(t().escalateNeedsComment);
      await patchForward({ targetDivisionName: "", targetSectionName: "", comment, escalateToCentralAdmin: true });
    } else if (action === "pending_admin_verification") {
      const comment = document.getElementById("review-invalid-comment-input").value.trim();
      if (!comment) throw new Error(t().invalidNeedsReason);
      await patchStatus("pending_admin_verification", comment);
    } else if (action === "delayed") {
      const eta = document.getElementById("review-delay-eta-input").value;
      const comment = document.getElementById("review-delay-comment-input").value.trim();
      if (!eta) throw new Error(t().delayNeedsEta);
      await patchStatus("delayed", comment);
      await patchEta(eta);
    } else if (action === "solved") {
      const comment = document.getElementById("review-resolve-comment-input").value.trim();
      if (!comment) throw new Error(t().resolveNeedsComment);
      await patchStatus("solved", comment);
    }

    messageNode.classList.add("success");
    messageNode.textContent = t().actionSuccess;
    clearActionInputs();
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

function handoverFlagBadge(complaint) {
  const fs = complaint.handoverFlagStatus;
  if (!fs) return "";
  if (fs === "pending") return `<span class="department-badge department-badge-amber">${t().handoverFlagPending}</span>`;
  if (fs === "verified") return `<span class="department-badge department-badge-red">${t().handoverFlagVerified}</span>`;
  if (fs === "rejected") return `<span class="department-badge department-badge-green">${t().handoverFlagRejected}</span>`;
  return "";
}

function renderHandoverList() {
  const node = document.getElementById("officer-handover-list");
  if (!node) return;
  if (!handoverComplaints.length) {
    node.innerHTML = `<div class="admin-list-card"><p>${t().handoverEmpty}</p></div>`;
    return;
  }

  node.innerHTML = handoverComplaints.map((complaint) => {
    const alreadyFlagged = complaint.handoverFlagStatus === "pending";
    const flagInfo = complaint.handoverFlag
      ? `<div style="margin-top:8px;padding:8px 12px;background:#fff8e1;border-left:3px solid #f59e0b;border-radius:4px;font-size:0.875rem">
          <strong>${t().handoverFlagReason2}</strong> ${complaint.handoverFlag.reason || "-"}
          ${complaint.handoverFlag.flaggedByOfficerName ? `<br/><strong>${t().handoverFlaggedBy}</strong> ${complaint.handoverFlag.flaggedByOfficerName}` : ""}
        </div>`
      : "";

    return `
      <article class="officer-complaint-card is-solved">
        <div class="citizen-complaint-card-head">
          <div>
            <p class="department-tid">${complaint.tokenNumber}</p>
            <strong>${complaint.title || complaint.subcategory || complaint.category}</strong>
            <p>${complaint.assignedOfficeLabel || "-"} · ${complaint.assignedOfficerName || "-"}</p>
          </div>
          <div class="officer-card-badges">
            ${handoverFlagBadge(complaint)}
            <span class="department-badge department-badge-green">${statusLabel("solved")}</span>
          </div>
        </div>
        <p class="citizen-muted-copy">${complaint.description || "-"}</p>
        <div class="officer-card-meta">
          <span>${formatDate(complaint.updatedAt || complaint.createdAt)}</span>
          <span>${complaint.citizenName || "Anonymous"}</span>
        </div>
        ${flagInfo}
        <div class="action-strip" style="margin-top:8px">
          <button type="button" class="button primary compact-button" data-review-token="${complaint.tokenNumber}">${t().handoverVerify}</button>
          ${!alreadyFlagged ? `<button type="button" class="button secondary compact-button" data-flag-token="${complaint.tokenNumber}">${t().handoverFlag}</button>` : ""}
        </div>
        ${!alreadyFlagged ? `
        <div class="handover-flag-form hidden" id="flag-form-${complaint.tokenNumber}" style="margin-top:12px;padding:12px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">
          <label style="display:block;margin-bottom:8px">
            <span style="font-size:0.875rem;font-weight:600;display:block;margin-bottom:4px">${t().handoverFlagReason}</span>
            <textarea id="flag-reason-${complaint.tokenNumber}" rows="3" style="width:100%;box-sizing:border-box" placeholder="${currentLanguage === "ne" ? "कारण लेख्नुहोस्..." : "Describe the issue with this complaint..."}"></textarea>
          </label>
          <div class="action-strip">
            <button type="button" class="button primary compact-button" data-submit-flag="${complaint.tokenNumber}">${t().handoverFlagSubmit}</button>
            <button type="button" class="button secondary compact-button" data-cancel-flag="${complaint.tokenNumber}">${t().handoverCancel}</button>
          </div>
          <div class="form-message" id="flag-message-${complaint.tokenNumber}"></div>
        </div>
        ` : ""}
      </article>
    `;
  }).join("");

  bindHandoverEvents();
  bindReviewButtons();
}

function bindHandoverEvents() {
  document.querySelectorAll("[data-flag-token]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const form = document.getElementById(`flag-form-${btn.dataset.flagToken}`);
      if (form) form.classList.toggle("hidden");
    });
  });

  document.querySelectorAll("[data-cancel-flag]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const form = document.getElementById(`flag-form-${btn.dataset.cancelFlag}`);
      if (form) form.classList.add("hidden");
    });
  });

  document.querySelectorAll("[data-submit-flag]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tokenNumber = btn.dataset.submitFlag;
      const reason = document.getElementById(`flag-reason-${tokenNumber}`)?.value.trim();
      const messageNode = document.getElementById(`flag-message-${tokenNumber}`);

      if (!reason) {
        messageNode.className = "form-message error";
        messageNode.textContent = t().handoverFlagNeedsReason;
        return;
      }

      btn.disabled = true;
      messageNode.className = "form-message";
      messageNode.textContent = "";

      try {
        const response = await fetch(`${apiBase}/api/complaints/${tokenNumber}/handover-flag`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${departmentAuthToken}`,
          },
          body: JSON.stringify({ reason }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || t().actionFailed);

        messageNode.className = "form-message success";
        messageNode.textContent = t().handoverFlagSuccess;

        setTimeout(async () => {
          await loadDashboard();
          await renderAll();
        }, 1500);
      } catch (error) {
        messageNode.className = "form-message error";
        messageNode.textContent = error.message || t().actionFailed;
        btn.disabled = false;
      }
    });
  });
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

document.getElementById("review-status-select")?.addEventListener("change", syncActionGroups);
document.getElementById("review-forward-division-select")?.addEventListener("change", fillForwardDepartments);
document.getElementById("officer-review-submit-button")?.addEventListener("click", submitReview);
document.getElementById("download-weekly-report-button")?.addEventListener("click", downloadWeeklyReport);

document.getElementById("department-logout-button")?.addEventListener("click", async () => {
  try {
    await fetch(`${apiBase}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${departmentAuthToken}` },
    });
  } catch {}

  sessionStorage.removeItem("department_user");
  sessionStorage.removeItem("department_auth_token");
  window.location.replace(appRoutes.departmentLogin);
});

loadDashboard()
  .then(renderAll)
  .catch((error) => {
    const node = document.getElementById("officer-selected-complaint");
    if (node) {
      node.innerHTML = `<div class="detail-card"><p>${error.message || t().actionFailed}</p></div>`;
    }
  });
