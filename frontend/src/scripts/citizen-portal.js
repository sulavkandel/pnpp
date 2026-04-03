import { apiBase, appRoutes } from "./runtime-config.js";
const storedUser = sessionStorage.getItem("citizen_user");
const authToken = sessionStorage.getItem("citizen_auth_token");

if (!storedUser || !authToken) {
  window.location.replace(appRoutes.home);
}

const user = storedUser ? JSON.parse(storedUser) : null;
const registrationNoticeCode = sessionStorage.getItem("citizen_registration_notice") || "";
let currentLanguage = "ne";
let activeSection = "dashboard";
let dashboardData = null;
let complaints = [];
let selectedComplaintToken = "";
let attachmentPayloads = [];

const wards = Array.from({ length: 33 }, (_, index) => String(index + 1));

const categories = {
  ne: [
    ["road", "Road Maintenance"],
    ["garbage", "Waste Management"],
    ["water", "Water Supply"],
    ["drainage", "Drainage / Sewer"],
    ["light", "Streetlight / Public Safety"],
    ["health", "Health Services"],
    ["education", "Education"],
    ["legal", "Legal / Dispute"],
    ["other", "Other Municipal Service"],
  ],
  en: [
    ["road", "Road Maintenance"],
    ["garbage", "Waste Management"],
    ["water", "Water Supply"],
    ["drainage", "Drainage / Sewer"],
    ["light", "Streetlight / Public Safety"],
    ["health", "Health Services"],
    ["education", "Education"],
    ["legal", "Legal / Dispute"],
    ["other", "Other Municipal Service"],
  ],
};

const translations = {
  ne: {
    topTitle: "पोखरा महानगरपालिका नागरिक ड्यासबोर्ड",
    gov: "नेपाल सरकार",
    main: "नागरिक ड्यासबोर्ड",
    sub: "गुनासो दर्ता, ट्र्याकिङ र प्रोफाइल व्यवस्थापन",
    logout: "लगआउट",
    welcome: "स्वागत छ, {name}. यहाँबाट तपाईं नयाँ गुनासो दर्ता गर्न, स्थिति ट्र्याक गर्न, र आफ्नो प्रोफाइल हेर्न सक्नुहुन्छ।",
    registrationNotice: "तपाईंको गुमनाम नागरिक कोड सुरक्षित राख्नुहोस्: {code}",
    navDashboard: "ड्यासबोर्ड",
    navFile: "नयाँ गुनासो",
    navComplaints: "मेरो गुनासोहरू",
    navProfile: "प्रोफाइल सेटिङ",
    pointsEyebrow: "पुरस्कार अंक",
    pointsCopy: "वैध र समाधान भएका गुनासोबाट प्राप्त अंक",
    recentComplaintsEyebrow: "हालका गुनासो",
    recentComplaintsTitle: "पछिल्ला ५ गुनासो",
    fileButton: "File a Complaint",
    dashboardPointsEyebrow: "Reward history",
    dashboardPointsTitle: "अंक इतिहास",
    dashboardTotal: "कुल दर्ता",
    dashboardResolved: "समाधान",
    dashboardProgress: "प्रगतिमा",
    dashboardReview: "समीक्षाधीन",
    noRecent: "हाल कुनै हालको गुनासो छैन।",
    noPoints: "अहिलेसम्म अंक इतिहास छैन।",
    wizardEyebrow: "गुनासो दर्ता",
    wizardTitle: "चरणगत रूपमा गुनासो पेश गर्नुहोस्",
    wizardStep: "चरण १ / ४",
    stepAccount: "खाता",
    stepDetails: "विवरण",
    stepReview: "पुनरावलोकन",
    anonymousBannerTitle: "गुमनाम रूपमा दर्ता गर्नुहोस्",
    anonymousBannerCopy: "अन गर्दा अधिकारीलाई तपाईंको नाम र सम्पर्क विवरण देखाइँदैन।",
    complainantEyebrow: "व्यक्तिगत विवरण",
    complainantTitle: "आधारभूत नागरिक जानकारी",
    complaintInfoEyebrow: "गुनासोको विवरण",
    complaintInfoTitle: "समस्या दर्ता जानकारी",
    fieldContactName: "पूरा नाम",
    fieldContactPhone: "सम्पर्क नम्बर",
    fieldContactEmail: "इमेल ठेगाना",
    fieldCategory: "गुनासोको विभाग/वर्ग",
    fieldTitle: "गुनासोको शीर्षक",
    fieldWard: "वडा नम्बर",
    fieldLocation: "स्थान / ल्यान्डमार्क",
    fieldSubcategory: "विशिष्ट समस्या",
    fieldArea: "क्षेत्र / टोल",
    fieldDescription: "गुनासोको पूर्ण विवरण",
    fieldLandmark: "नजिकको ल्यान्डमार्क",
    fieldUrgency: "जरुरीपन",
    fieldContactOptIn: "अपडेटका लागि सम्पर्क राख्ने?",
    fieldMedia: "फोटो / कागजात संलग्न गर्नुहोस्",
    urgencyHigh: "उच्च",
    urgencyMedium: "मध्यम",
    urgencyLow: "न्यून",
    yes: "हो",
    no: "होइन",
    captureGps: "GPS लिनुहोस्",
    submit: "गुनासो पेश गर्नुहोस्",
    submitSuccess: "गुनासो सफलतापूर्वक दर्ता भयो।",
    submitFailed: "गुनासो दर्ता गर्न सकिएन।",
    resultTitle: "गुनासो दर्ता पुष्टिकरण",
    resultToken: "गुनासो आईडी",
    resultAssigned: "तोकिएको विभाग",
    resultStatus: "हालको स्थिति",
    anonTokenTitle: "गोप्य ट्र्याकिङ कोड",
    anonTokenHint: "यो कोड सुरक्षित राख्नुहोस् — लगइन बिना गुनासो ट्र्याक गर्न प्रयोग गर्नुहोस्।",
    resultPendingPoints: "अंक अहिले थपिँदैन। अधिकारीले वैधता पुष्टि गरेपछि मात्र अंक दिइन्छ।",
    myComplaintsEyebrow: "मेरो गुनासोहरू",
    myComplaintsTitle: "फिल्टर, हेर्नुहोस्, र समयरेखा जाँच गर्नुहोस्",
    filterStatusLabel: "स्थिति",
    filterDepartmentLabel: "विभाग",
    filterFromLabel: "मिति देखि",
    filterToLabel: "मिति सम्म",
    allStatuses: "सबै स्थिति",
    allDepartments: "सबै विभाग",
    complaintDetailEyebrow: "विस्तृत दृश्य",
    complaintDetailTitle: "चयन गरिएको गुनासो",
    noComplaints: "हालसम्म कुनै गुनासो दर्ता गरिएको छैन।",
    noComplaintSelected: "विस्तृत दृश्य हेर्न गुनासो छान्नुहोस्।",
    status: "स्थिति",
    department: "विभाग",
    lastUpdated: "अन्तिम अद्यावधिक",
    createdAt: "दर्ता मिति",
    eta: "समाप्ति अनुमान",
    currentOfficer: "हालको अधिकारी",
    rewardPoints: "प्राप्त अंक",
    timeline: "समयरेखा",
    comments: "अधिकारी टिप्पणीहरू",
    attachments: "संलग्न फाइलहरू",
    rateTitle: "समाधान मूल्याङ्कन",
    rateLabel: "समाधानलाई कति अंक दिनुहुन्छ?",
    confirmClose: "समाधान पुष्टि गर्नुहोस्",
    feedbackPlaceholder: "इच्छा भए छोटो प्रतिक्रिया लेख्नुहोस्",
    feedbackSaved: "समाधान प्रतिक्रिया सुरक्षित गरियो।",
    profileEyebrow: "प्रोफाइल सेटिङ",
    profileTitle: "दर्ता विवरण",
    profileCitizenCode: "नागरिक कोड",
    profileAnonymous: "गुमनाम दर्ता",
    profileMobile: "मोबाइल नम्बर",
    profileEmail: "इमेल",
    profilePoints: "कुल पुरस्कार अंक",
    gpsSuccess: "GPS स्थान प्राप्त भयो।",
    gpsFailed: "GPS प्राप्त गर्न सकिएन।",
    loadFailed: "डाटा लोड गर्न सकिएन।",
    pending: "Pending Review",
    in_progress: "In Progress",
    solved: "Resolved",
    delayed: "Delayed",
    forwarded: "Forwarded",
    escalated: "Under Review",
    anonymousRegisteredYes: "हो",
    anonymousRegisteredNo: "होइन",
    citizenIdLabel: "नागरिक कोड",
    pointsHoverPrefix: "अंक इतिहास",
  },
  en: {
    topTitle: "Pokhara Mahanagarpalika Citizen Dashboard",
    gov: "Government of Nepal",
    main: "Citizen Dashboard",
    sub: "Complaint filing, tracking, and profile management",
    logout: "Logout",
    welcome: "Welcome, {name}. From here you can file complaints, track status, and manage your profile.",
    registrationNotice: "Save your anonymous citizen ID for future login: {code}",
    navDashboard: "Dashboard",
    navFile: "File Complaint",
    navComplaints: "My Complaints",
    navProfile: "Profile Settings",
    pointsEyebrow: "Reward Points",
    pointsCopy: "Points earned from valid resolved complaints",
    recentComplaintsEyebrow: "Recent complaints",
    recentComplaintsTitle: "Last 5 complaints",
    fileButton: "File a Complaint",
    dashboardPointsEyebrow: "Reward history",
    dashboardPointsTitle: "Points history",
    dashboardTotal: "Total filed",
    dashboardResolved: "Resolved",
    dashboardProgress: "In progress",
    dashboardReview: "Under review",
    noRecent: "No recent complaints yet.",
    noPoints: "No points history yet.",
    wizardEyebrow: "Complaint filing",
    wizardTitle: "Submit your complaint step by step",
    wizardStep: "Step 1 / 4",
    stepAccount: "Account",
    stepDetails: "Details",
    stepReview: "Review",
    anonymousBannerTitle: "Register this complaint anonymously",
    anonymousBannerCopy: "When enabled, your name and contact details are hidden from officers.",
    complainantEyebrow: "Personal details",
    complainantTitle: "Basic citizen information",
    complaintInfoEyebrow: "Complaint details",
    complaintInfoTitle: "Problem registration details",
    fieldContactName: "Full name",
    fieldContactPhone: "Contact number",
    fieldContactEmail: "Email address",
    fieldCategory: "Complaint department/category",
    fieldTitle: "Complaint title",
    fieldWard: "Ward number",
    fieldLocation: "Location / landmark",
    fieldSubcategory: "Specific issue",
    fieldArea: "Area / locality",
    fieldDescription: "Full complaint description",
    fieldLandmark: "Nearest landmark",
    fieldUrgency: "Urgency",
    fieldContactOptIn: "Keep contact details for updates?",
    fieldMedia: "Attach photos / documents",
    urgencyHigh: "High",
    urgencyMedium: "Medium",
    urgencyLow: "Low",
    yes: "Yes",
    no: "No",
    captureGps: "Capture GPS",
    submit: "Submit Complaint",
    submitSuccess: "Complaint submitted successfully.",
    submitFailed: "Could not submit the complaint.",
    resultTitle: "Complaint confirmation",
    resultToken: "Complaint ID",
    resultAssigned: "Assigned department",
    resultStatus: "Current status",
    anonTokenTitle: "Anonymous Tracking Code",
    anonTokenHint: "Keep this safe — use it to track your complaint without logging in.",
    resultPendingPoints: "Points are not awarded yet. They are added only after an officer verifies the complaint as valid.",
    myComplaintsEyebrow: "My complaints",
    myComplaintsTitle: "Filter, inspect, and review your complaint timeline",
    filterStatusLabel: "Status",
    filterDepartmentLabel: "Department",
    filterFromLabel: "Date from",
    filterToLabel: "Date to",
    allStatuses: "All statuses",
    allDepartments: "All departments",
    complaintDetailEyebrow: "Detail view",
    complaintDetailTitle: "Selected complaint",
    noComplaints: "No complaints have been filed yet.",
    noComplaintSelected: "Select a complaint to view its details.",
    status: "Status",
    department: "Department",
    lastUpdated: "Last updated",
    createdAt: "Created at",
    eta: "Estimated completion",
    currentOfficer: "Current officer",
    rewardPoints: "Reward points",
    timeline: "Timeline",
    comments: "Officer comments",
    attachments: "Attachments",
    rateTitle: "Resolution rating",
    rateLabel: "How would you rate the resolution?",
    confirmClose: "Confirm closure",
    feedbackPlaceholder: "Optional short feedback",
    feedbackSaved: "Resolution feedback saved.",
    profileEyebrow: "Profile settings",
    profileTitle: "Registration details",
    profileCitizenCode: "Citizen ID",
    profileAnonymous: "Anonymous registration",
    profileMobile: "Mobile number",
    profileEmail: "Email",
    profilePoints: "Total reward points",
    gpsSuccess: "GPS location captured.",
    gpsFailed: "Could not access GPS.",
    loadFailed: "Could not load data.",
    pending: "Pending Review",
    in_progress: "In Progress",
    solved: "Resolved",
    delayed: "Delayed",
    forwarded: "Forwarded",
    escalated: "Under Review",
    anonymousRegisteredYes: "Yes",
    anonymousRegisteredNo: "No",
    citizenIdLabel: "Citizen ID",
    pointsHoverPrefix: "Points history",
  },
};

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };
}

function t() {
  return translations[currentLanguage];
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function setPlaceholder(id, value) {
  const node = document.getElementById(id);
  if (node) node.setAttribute("placeholder", value);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString(currentLanguage === "ne" ? "ne-NP" : "en-US");
}

function safeInitials(name) {
  return String(name || "Citizen")
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusLabel(status) {
  return t()[status] || status || "-";
}

function statusClass(status) {
  if (status === "solved") return "department-badge-green";
  if (status === "delayed") return "department-badge-red";
  if (status === "in_progress") return "department-badge-amber";
  return "department-badge-blue";
}

function categoryOptionsMarkup() {
  return categories[currentLanguage]
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
}

function renderWardOptions() {
  const select = document.getElementById("input-ward");
  if (!select) return;
  select.innerHTML = wards
    .map((ward) => `<option value="${ward}">${currentLanguage === "ne" ? `वडा ${ward}` : `Ward ${ward}`}</option>`)
    .join("");
}

function renderFilterOptions() {
  const statusSelect = document.getElementById("complaint-filter-status");
  if (statusSelect) {
    const options = ["", "pending", "in_progress", "solved", "delayed", "forwarded", "escalated"];
    statusSelect.innerHTML = options
      .map((value) => `<option value="${value}">${value ? statusLabel(value) : t().allStatuses}</option>`)
      .join("");
  }

  const departmentSelect = document.getElementById("complaint-filter-department");
  if (departmentSelect) {
    const departments = [...new Set(complaints.map((item) => item.assignedOfficeLabel).filter(Boolean))];
    departmentSelect.innerHTML = [`<option value="">${t().allDepartments}</option>`]
      .concat(departments.map((label) => `<option value="${label}">${label}</option>`))
      .join("");
  }
}

function renderStatic() {
  document.documentElement.lang = currentLanguage;
  setText("portal-top-title", t().topTitle);
  setText("portal-gov-label", t().gov);
  setText("portal-main-title", t().main);
  setText("portal-subtitle", t().sub);
  setText("logout-button", t().logout);
  setText("nav-dashboard", t().navDashboard);
  setText("nav-file", t().navFile);
  setText("nav-complaints", t().navComplaints);
  setText("nav-profile", t().navProfile);
  setText("points-eyebrow", t().pointsEyebrow);
  setText("points-copy", t().pointsCopy);
  setText("recent-complaints-eyebrow", t().recentComplaintsEyebrow);
  setText("recent-complaints-title", t().recentComplaintsTitle);
  setText("dashboard-file-button", t().fileButton);
  setText("dashboard-points-eyebrow", t().dashboardPointsEyebrow);
  setText("dashboard-points-title", t().dashboardPointsTitle);
  setText("wizard-eyebrow", t().wizardEyebrow);
  setText("wizard-title", t().wizardTitle);
  setText("wizard-step", t().wizardStep);
  setText("step-account-label", t().stepAccount);
  setText("step-details-label", t().stepDetails);
  setText("step-review-label", t().stepReview);
  setText("anonymous-banner-title", t().anonymousBannerTitle);
  setText("anonymous-banner-copy", t().anonymousBannerCopy);
  setText("complainant-eyebrow", t().complainantEyebrow);
  setText("complainant-title", t().complainantTitle);
  setText("complaint-info-eyebrow", t().complaintInfoEyebrow);
  setText("complaint-info-title", t().complaintInfoTitle);
  setText("field-contact-name", t().fieldContactName);
  setText("field-contact-phone", t().fieldContactPhone);
  setText("field-contact-email", t().fieldContactEmail);
  setText("field-category", t().fieldCategory);
  setText("field-title", t().fieldTitle);
  setText("field-ward", t().fieldWard);
  setText("field-location", t().fieldLocation);
  setText("field-subcategory", t().fieldSubcategory);
  setText("field-area", t().fieldArea);
  setText("field-description", t().fieldDescription);
  setText("field-landmark", t().fieldLandmark);
  setText("field-urgency", t().fieldUrgency);
  setText("field-contact-optin", t().fieldContactOptIn);
  setText("field-media", t().fieldMedia);
  setText("urgency-high", t().urgencyHigh);
  setText("urgency-medium", t().urgencyMedium);
  setText("urgency-low", t().urgencyLow);
  setText("contact-optin-yes", t().yes);
  setText("contact-optin-no", t().no);
  setText("capture-gps-button", t().captureGps);
  setText("submit-complaint-button", t().submit);
  setText("my-complaints-eyebrow", t().myComplaintsEyebrow);
  setText("my-complaints-title", t().myComplaintsTitle);
  setText("filter-status-label", t().filterStatusLabel);
  setText("filter-department-label", t().filterDepartmentLabel);
  setText("filter-from-label", t().filterFromLabel);
  setText("filter-to-label", t().filterToLabel);
  setText("complaint-detail-eyebrow", t().complaintDetailEyebrow);
  setText("complaint-detail-title", t().complaintDetailTitle);
  setText("profile-eyebrow", t().profileEyebrow);
  setText("profile-title", t().profileTitle);
  setPlaceholder("input-contact-name", currentLanguage === "ne" ? "उदाहरण: राजन शर्मा" : "Example: Rajan Sharma");
  setPlaceholder("input-contact-phone", "98XXXXXXXX");
  setPlaceholder("input-contact-email", "example@email.com");
  setPlaceholder("input-title", currentLanguage === "ne" ? "छोटो शीर्षक दिनुहोस्" : "Give a short title");
  setPlaceholder("input-location", currentLanguage === "ne" ? "GPS वा स्थान विवरण" : "GPS or location detail");
  setPlaceholder("input-subcategory", currentLanguage === "ne" ? "जस्तै: खाल्डो, ढल अवरोध" : "For example: pothole, blocked drain");
  setPlaceholder("input-area", currentLanguage === "ne" ? "क्षेत्र वा टोल" : "Area or locality");
  setPlaceholder("input-description", currentLanguage === "ne" ? "समस्याको विस्तृत विवरण लेख्नुहोस्" : "Write the full problem description");
  setPlaceholder("input-landmark", currentLanguage === "ne" ? "नजिकको चिनारी" : "Nearby landmark");
  document.getElementById("complaint-category").innerHTML = categoryOptionsMarkup();
  renderWardOptions();
  renderFilterOptions();
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });
  document.querySelectorAll(".citizen-nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === activeSection);
  });
}

function setActiveSection(section) {
  activeSection = section;
  document.querySelectorAll(".citizen-section").forEach((node) => {
    node.classList.toggle("active", node.id === `section-${section}`);
  });
  document.querySelectorAll(".citizen-nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });
}

function showMessage(type, message) {
  const node = document.getElementById("complaint-message");
  if (!node) return;
  node.className = `form-message ${type}`;
  node.textContent = message;
}

function fillProfile() {
  const currentUser = dashboardData?.user || user;
  setText("citizen-display-name", currentUser?.name || "Citizen");
  setText("citizen-display-meta", `${t().citizenIdLabel}: ${currentUser?.citizenCode || "-"}`);
  setText("citizen-avatar", safeInitials(currentUser?.name));
  const notice = registrationNoticeCode ? ` ${t().registrationNotice.replace("{code}", registrationNoticeCode)}` : "";
  setText("welcome-banner", `${t().welcome.replace("{name}", currentUser?.name || "Citizen")}${notice}`);

  document.getElementById("profile-settings-panel").innerHTML = `
    <div class="detail-card">
      <p><strong>${t().profileCitizenCode}:</strong> ${currentUser?.citizenCode || "-"}</p>
      <p><strong>${t().profileAnonymous}:</strong> ${currentUser?.isAnonymousRegistered ? t().anonymousRegisteredYes : t().anonymousRegisteredNo}</p>
      <p><strong>${t().profileMobile}:</strong> ${currentUser?.mobileNumber || "-"}</p>
      <p><strong>${t().profileEmail}:</strong> ${currentUser?.email || "-"}</p>
      <p><strong>${t().profilePoints}:</strong> ${dashboardData?.user?.rewardPoints || 0}</p>
    </div>
  `;
}

function renderPoints() {
  const total = dashboardData?.user?.rewardPoints || 0;
  const history = dashboardData?.pointsHistory || [];
  setText("points-total", String(total));
  document.getElementById("points-history").innerHTML = history.length
    ? history
        .slice(0, 3)
        .map((entry) => `<div class="citizen-points-entry"><strong>+${entry.points}</strong><span>${entry.title}</span></div>`)
        .join("")
    : `<p class="citizen-muted-copy">${t().noPoints}</p>`;
  document.getElementById("dashboard-points-history").innerHTML = history.length
    ? history
        .map(
          (entry) => `
            <article class="admin-list-card">
              <strong>+${entry.points}</strong>
              <p>${entry.title}</p>
              <p>${formatDate(entry.awardedAt)}</p>
            </article>
          `,
        )
        .join("")
    : `<div class="admin-list-card"><p>${t().noPoints}</p></div>`;

  document.getElementById("points-card").title = history.length
    ? `${t().pointsHoverPrefix}: ${history.map((entry) => `+${entry.points} ${entry.title}`).join(" | ")}`
    : t().noPoints;
}

function renderDashboardStats() {
  const stats = dashboardData?.stats || { total: 0, resolved: 0, inProgress: 0, underReview: 0 };
  document.getElementById("dashboard-stats").innerHTML = [
    [t().dashboardTotal, stats.total, ""],
    [t().dashboardResolved, stats.resolved, "is-green"],
    [t().dashboardProgress, stats.inProgress, "is-amber"],
    [t().dashboardReview, stats.underReview, "is-blue"],
  ]
    .map(
      ([label, value, className]) => `
        <article class="department-kpi-card citizen-stat-card">
          <div class="department-kpi-num ${className}">${value}</div>
          <div class="department-kpi-lbl">${label}</div>
        </article>
      `,
    )
    .join("");
}

function renderRecentComplaints() {
  const recent = dashboardData?.recentComplaints || [];
  document.getElementById("recent-complaints-list").innerHTML = recent.length
    ? recent
        .map(
          (complaint) => `
            <article class="citizen-complaint-card">
              <div class="citizen-complaint-card-head">
                <div>
                  <strong>${complaint.title}</strong>
                  <p>${complaint.tokenNumber} • ${complaint.assignedOfficeLabel || "-"}</p>
                </div>
                <span class="department-badge ${statusClass(complaint.status)}">${statusLabel(complaint.status)}</span>
              </div>
              <button type="button" class="department-mini-btn" data-open-complaint="${complaint.tokenNumber}">${currentLanguage === "ne" ? "विस्तृत हेर्नुहोस्" : "View details"}</button>
            </article>
          `,
        )
        .join("")
    : `<div class="admin-list-card"><p>${t().noRecent}</p></div>`;
}

function filteredComplaints() {
  const status = document.getElementById("complaint-filter-status")?.value || "";
  const department = document.getElementById("complaint-filter-department")?.value || "";
  const from = document.getElementById("complaint-filter-from")?.value || "";
  const to = document.getElementById("complaint-filter-to")?.value || "";

  return complaints.filter((complaint) => {
    if (status && complaint.status !== status) return false;
    if (department && complaint.assignedOfficeLabel !== department) return false;
    if (from && new Date(complaint.createdAt).getTime() < new Date(from).getTime()) return false;
    if (to && new Date(complaint.createdAt).getTime() > new Date(`${to}T23:59:59`).getTime()) return false;
    return true;
  });
}

function renderComplaintTable() {
  const rows = filteredComplaints();
  const node = document.getElementById("my-complaints-list");

  if (!rows.length) {
    node.innerHTML = `<div class="detail-card"><p>${t().noComplaints}</p></div>`;
    return;
  }

  node.innerHTML = `
    <table class="department-work-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>${t().fieldTitle}</th>
          <th>${t().department}</th>
          <th>${t().status}</th>
          <th>${t().lastUpdated}</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (complaint) => `
              <tr class="${complaint.tokenNumber === selectedComplaintToken ? "selected-row" : ""}">
                <td class="department-tid">${complaint.tokenNumber}</td>
                <td><strong class="department-issue-title">${complaint.title || complaint.subcategory || complaint.category}</strong></td>
                <td>${complaint.assignedOfficeLabel || "-"}</td>
                <td><span class="department-badge ${statusClass(complaint.status)}">${statusLabel(complaint.status)}</span></td>
                <td>${formatDate(complaint.updatedAt || complaint.createdAt)}</td>
                <td><button type="button" class="department-mini-btn" data-open-complaint="${complaint.tokenNumber}">${currentLanguage === "ne" ? "खोल्नुहोस्" : "Open"}</button></td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
  bindComplaintOpenButtons();
}

function bindComplaintOpenButtons() {
  document.querySelectorAll("[data-open-complaint]").forEach((button) => {
    button.onclick = async () => {
      setActiveSection("complaints");
      await selectComplaint(button.dataset.openComplaint);
    };
  });
}

async function loadComplaintDetail(tokenNumber) {
  const response = await fetch(`${apiBase}/api/complaints/${tokenNumber}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || t().loadFailed);
  return result.complaint;
}

async function selectComplaint(tokenNumber) {
  selectedComplaintToken = tokenNumber;
  renderComplaintTable();
  try {
    const detail = await loadComplaintDetail(tokenNumber);
    complaints = complaints.map((item) => (item.tokenNumber === tokenNumber ? { ...item, ...detail } : item));
    renderComplaintDetail();
  } catch {
    renderComplaintDetail();
  }
}

function renderComplaintDetail() {
  const complaint = complaints.find((item) => item.tokenNumber === selectedComplaintToken);
  const node = document.getElementById("complaint-detail-panel");

  if (!complaint) {
    node.innerHTML = `<div class="detail-card"><p>${t().noComplaintSelected}</p></div>`;
    return;
  }

  const comments = (complaint.comments || []).length
    ? complaint.comments
        .map((comment) => `<div class="department-detail-line"><strong>${comment.actorName}</strong><span>${comment.message}</span><small>${formatDate(comment.createdAt)}</small></div>`)
        .join("")
    : `<p>${currentLanguage === "ne" ? "कुनै टिप्पणी छैन।" : "No comments yet."}</p>`;

  const history = (complaint.history || []).length
    ? complaint.history
        .map((entry) => `<div class="department-detail-line"><strong>${entry.action}</strong><span>${entry.note || "-"}</span><small>${formatDate(entry.timestamp || entry.createdAt)}</small></div>`)
        .join("")
    : `<p>${currentLanguage === "ne" ? "कुनै समयरेखा छैन।" : "No timeline yet."}</p>`;

  const attachments = (complaint.attachments || []).length
    ? complaint.attachments
        .map((file) => `<a class="track-link" href="${file.dataUrl}" download="${file.name}">${file.name}</a>`)
        .join("<br />")
    : "-";

  node.innerHTML = `
    <div class="details-list department-detail-grid citizen-detail-grid">
      <div class="detail-card">
        <h3>${complaint.title || complaint.subcategory || complaint.category}</h3>
        <p><strong>${complaint.tokenNumber}</strong></p>
        <p>${complaint.description || "-"}</p>
        <p><strong>${t().department}:</strong> ${complaint.assignedOfficeLabel || "-"}</p>
        <p><strong>${t().status}:</strong> <span class="department-badge ${statusClass(complaint.status)}">${statusLabel(complaint.status)}</span></p>
        <p><strong>${t().createdAt}:</strong> ${formatDate(complaint.createdAt)}</p>
        <p><strong>${t().lastUpdated}:</strong> ${formatDate(complaint.updatedAt || complaint.createdAt)}</p>
        <p><strong>${t().currentOfficer}:</strong> ${complaint.assignedOfficerName || "-"}</p>
        <p><strong>${t().eta}:</strong> ${formatDate(complaint.estimatedCompletionAt)}</p>
        <p><strong>${t().rewardPoints}:</strong> ${complaint.pointsAwarded || 0}</p>
        <p><strong>${t().attachments}:</strong><br />${attachments}</p>
      </div>
      <div class="detail-card">
        <h3>${t().comments}</h3>
        ${comments}
      </div>
      <div class="detail-card">
        <h3>${t().timeline}</h3>
        ${history}
      </div>
      ${complaint.proofImage && complaint.proofImage.dataUrl ? `
      <div class="detail-card">
        <h3>${currentLanguage === "ne" ? "प्रमाण फोटो" : "Proof Image"}</h3>
        <img src="${complaint.proofImage.dataUrl}" alt="${complaint.proofImage.name || 'Proof'}" style="max-width:100%;border-radius:8px;margin-top:8px" />
      </div>` : ""}
    </div>
    ${complaint.status === "solved" ? `
      <div class="detail-card top-gap">
        <h3>${t().rateTitle}</h3>
        <label class="top-gap">
          <span>${t().rateLabel}</span>
          <select id="resolution-rating-select">
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
        <label class="top-gap">
          <span>${t().rateTitle}</span>
          <textarea id="resolution-feedback-input" placeholder="${t().feedbackPlaceholder}"></textarea>
        </label>
        <div class="action-strip top-gap">
          <button type="button" class="button primary" id="confirm-closure-button">${t().confirmClose}</button>
        </div>
      </div>
    ` : ""}
  `;

  if (complaint.status === "solved") {
    document.getElementById("resolution-rating-select").value = String(complaint.citizenRating || 0);
    document.getElementById("confirm-closure-button")?.addEventListener("click", async () => {
      try {
        const response = await fetch(`${apiBase}/api/complaints/${complaint.tokenNumber}/feedback`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            rating: document.getElementById("resolution-rating-select").value,
            comment: document.getElementById("resolution-feedback-input").value.trim(),
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || t().loadFailed);
        await refreshCitizenData();
        renderComplaintDetail();
      } catch (error) {
        alert(error.message || t().loadFailed);
      }
    });
  }
}

function renderResultCard(complaint, anonymousTrackingToken) {
  const card = document.getElementById("complaint-result-card");
  card.classList.add("visible");
  const anonSection = anonymousTrackingToken ? `
    <div style="background:#fff8e1;border:1px solid #c9a227;border-radius:8px;padding:12px;margin-top:12px">
      <strong style="color:#c9a227">🔒 ${t().anonTokenTitle}</strong>
      <p style="font-family:monospace;font-size:1.1rem;letter-spacing:2px;margin:6px 0">${anonymousTrackingToken}</p>
      <small>${t().anonTokenHint}</small>
    </div>
  ` : "";
  card.innerHTML = `
    <h3>${t().resultTitle}</h3>
    <p><strong>${t().resultToken}:</strong> ${complaint.tokenNumber}</p>
    <p><strong>${t().resultAssigned}:</strong> ${complaint.assignedOfficeLabel || "-"}</p>
    <p><strong>${t().resultStatus}:</strong> ${statusLabel(complaint.status)}</p>
    <p>${t().resultPendingPoints}</p>
    ${anonSection}
  `;
}

async function refreshCitizenData() {
  const [dashboardResponse, complaintsResponse] = await Promise.all([
    fetch(`${apiBase}/api/citizen/dashboard`, { headers: { Authorization: `Bearer ${authToken}` } }),
    fetch(`${apiBase}/api/complaints/mine`, { headers: { Authorization: `Bearer ${authToken}` } }),
  ]);

  const dashboardResult = await dashboardResponse.json();
  const complaintsResult = await complaintsResponse.json();

  if (!dashboardResponse.ok || !complaintsResponse.ok) {
    throw new Error(t().loadFailed);
  }

  dashboardData = dashboardResult.dashboard;
  complaints = complaintsResult.complaints || [];
  if (!selectedComplaintToken && complaints.length) {
    selectedComplaintToken = complaints[0].tokenNumber;
  }
}

async function renderApp() {
  renderStatic();
  fillProfile();
  renderDashboardStats();
  renderPoints();
  renderRecentComplaints();
  renderComplaintTable();
  renderComplaintDetail();
  bindComplaintOpenButtons();

  if (selectedComplaintToken) {
    const selected = complaints.find((item) => item.tokenNumber === selectedComplaintToken);
    if (selected && !selected.history) {
      await selectComplaint(selectedComplaintToken);
    }
  }
}

document.querySelectorAll(".citizen-nav-btn").forEach((button) => {
  button.addEventListener("click", () => setActiveSection(button.dataset.section));
});

document.getElementById("dashboard-file-button")?.addEventListener("click", () => {
  setActiveSection("file");
});

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", async () => {
    currentLanguage = button.dataset.lang;
    await renderApp();
  });
});

document.getElementById("input-anonymous")?.addEventListener("change", (event) => {
  document.getElementById("complainant-card").classList.toggle("is-dimmed", event.target.checked);
});

document.getElementById("input-proof-files")?.addEventListener("change", async (event) => {
  const files = [...(event.target.files || [])].slice(0, 5);
  attachmentPayloads = await Promise.all(
    files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              mimeType: file.type || "application/octet-stream",
              dataUrl: String(reader.result || ""),
            });
          };
          reader.readAsDataURL(file);
        }),
    ),
  );

  document.getElementById("attachment-preview-list").innerHTML = attachmentPayloads
    .map((file) => `<span class="department-guidance-chip">${file.name}</span>`)
    .join("");
});

document.getElementById("capture-gps-button")?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showMessage("error", t().gpsFailed);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      document.getElementById("input-location").value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      showMessage("success", t().gpsSuccess);
    },
    () => {
      showMessage("error", t().gpsFailed);
    },
  );
});

document.getElementById("submit-complaint-button")?.addEventListener("click", async () => {
  const form = document.getElementById("complaint-form");
  const formData = new FormData(form);
  const payload = {
    title: String(formData.get("title") || "").trim(),
    category: String(formData.get("category") || ""),
    subcategory: String(formData.get("subcategory") || "").trim(),
    locationText: String(formData.get("locationText") || "").trim(),
    wardNumber: String(formData.get("wardNumber") || "").trim(),
    areaName: String(formData.get("areaName") || "").trim(),
    nearestLandmark: String(formData.get("nearestLandmark") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    priority: String(formData.get("priority") || "medium"),
    contactName: String(formData.get("contactName") || "").trim(),
    contactPhone: String(formData.get("contactPhone") || "").trim(),
    contactEmail: String(formData.get("contactEmail") || "").trim(),
    contactOptIn: String(formData.get("contactOptIn") || "yes") === "yes",
    anonymous: document.getElementById("input-anonymous").checked,
    proofImage: attachmentPayloads.find((file) => file.mimeType.startsWith("image/")) || null,
    attachments: attachmentPayloads,
  };

  showMessage("", "");

  try {
    const response = await fetch(`${apiBase}/api/complaints`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      showMessage("error", result.message || t().submitFailed);
      return;
    }

    showMessage("success", t().submitSuccess);
    renderResultCard(result.complaint, result.anonymousTrackingToken || null);
    form.reset();
    attachmentPayloads = [];
    document.getElementById("attachment-preview-list").innerHTML = "";
    await refreshCitizenData();
    await renderApp();
    setActiveSection("dashboard");
  } catch {
    showMessage("error", t().submitFailed);
  }
});

["complaint-filter-status", "complaint-filter-department", "complaint-filter-from", "complaint-filter-to"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", () => {
    renderComplaintTable();
  });
});

document.getElementById("logout-button")?.addEventListener("click", async () => {
  try {
    await fetch(`${apiBase}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch {}

  sessionStorage.removeItem("citizen_user");
  sessionStorage.removeItem("citizen_auth_token");
  window.location.replace(appRoutes.home);
});

refreshCitizenData()
  .then(renderApp)
  .catch(() => {
    renderStatic();
    fillProfile();
    document.getElementById("recent-complaints-list").innerHTML = `<div class="admin-list-card"><p>${t().loadFailed}</p></div>`;
    document.getElementById("dashboard-points-history").innerHTML = `<div class="admin-list-card"><p>${t().loadFailed}</p></div>`;
    document.getElementById("my-complaints-list").innerHTML = `<div class="detail-card"><p>${t().loadFailed}</p></div>`;
    document.getElementById("complaint-detail-panel").innerHTML = `<div class="detail-card"><p>${t().loadFailed}</p></div>`;
  });
