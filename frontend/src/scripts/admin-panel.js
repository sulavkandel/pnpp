const storedAdmin = sessionStorage.getItem("admin_user");

if (!storedAdmin) {
  window.location.replace("./admin-login.html");
}

const adminUser = storedAdmin ? JSON.parse(storedAdmin) : null;

const structure = [
  { division: "Administration", nepali: "प्रशासन", sections: ["Admin Section", "Inspection (Security)", "Fire & Emergency"] },
  { division: "Finance & Revenue", nepali: "वित्त तथा राजश्व", sections: ["Internal Audit", "Procurement", "Revenue/Tax Units"] },
  { division: "Infrastructure Development", nepali: "पूर्वाधार विकास", sections: ["Road Section", "Bridge Section", "Buildings", "Water & Sewer"] },
  { division: "Urban Dev & Environment", nepali: "शहरी विकास तथा वातावरण", sections: ["Tourism", "Sanitation/Waste", "Greenery Units"] },
  { division: "Planning, Monitoring & IT", nepali: "योजना, अनुगमन तथा IT", sections: ["IT Section", "Data & Statistics", "Documentation"] },
  { division: "Social Development", nepali: "सामाजिक विकास", sections: ["Women/Child Program", "Social Security", "Community Development"] },
  { division: "Health", nepali: "स्वास्थ्य", sections: ["Health Services / Health Center Coordination"] },
  { division: "Education", nepali: "शिक्षा", sections: ["School Management / Education Programs"] },
  { division: "Economic Development", nepali: "आर्थिक विकास", sections: ["Business Promotion", "Employment", "Agri & Livestock"] },
  { division: "Legal", nepali: "कानुन", sections: ["Legal Advice / Dispute Management"] },
];

const wards = Array.from({ length: 33 }, (_, index) => index + 1);

let currentLanguage = "ne";
let selectedDivision = structure[0];

const translations = {
  ne: {
    title: "एडमिन प्यानल",
    gov: "नेपाल सरकार",
    main: "केन्द्रिय प्रशासन प्यानल",
    sub: "महाशाखा, साखा, र वडा व्यवस्थापन",
    welcome: `स्वागत छ, ${adminUser?.name || "Admin"}. तपाईं सबै विभाग र वडाको पहुँच व्यवस्थापन गर्न सक्नुहुन्छ।`,
    divisions: "महाशाखा",
    sections: "साखा / युनिट",
    wards: "वडा कार्यालय",
    divisionEyebrow: "विभागहरू",
    divisionTitle: "सबै महाशाखा र साखाहरू",
    formEyebrow: "विभाग खाता सिर्जना",
    formTitle: "छानिएको विभागका लागि लगइन सिर्जना गर्नुहोस्",
    selectedDivision: "छानिएको महाशाखा",
    selectedSection: "साखा / युनिट",
    departmentName: "अधिकृत / विभाग नाम",
    departmentNamePlaceholder: "नाम लेख्नुहोस्",
    loginId: "लगइन आईडी",
    loginIdPlaceholder: "login id",
    password: "लगइन पासवर्ड",
    passwordPlaceholder: "password",
    createAccount: "खाता सिर्जना गर्नुहोस्",
    createSuccess: "विभाग खाता सफलतापूर्वक डाटाबेसमा सुरक्षित गरियो।",
    createFailed: "विभाग खाता सिर्जना गर्न सकिएन।",
    wardEyebrow: "वडा कार्यालयहरू",
    wardTitle: "३३ वडा पहुँच सूची",
    logout: "लगआउट",
  },
  en: {
    title: "Admin Panel",
    gov: "Government of Nepal",
    main: "Central Admin Panel",
    sub: "Department, section, and ward management",
    welcome: `Welcome, ${adminUser?.name || "Admin"}. You can manage access for all departments and wards.`,
    divisions: "Divisions",
    sections: "Sections / Units",
    wards: "Ward Offices",
    divisionEyebrow: "Departments",
    divisionTitle: "All divisions and sections",
    formEyebrow: "Department account creation",
    formTitle: "Create login for the selected department",
    selectedDivision: "Selected division",
    selectedSection: "Section / Unit",
    departmentName: "Officer / Department name",
    departmentNamePlaceholder: "Enter name",
    loginId: "Login ID",
    loginIdPlaceholder: "login id",
    password: "Login password",
    passwordPlaceholder: "password",
    createAccount: "Create account",
    createSuccess: "Department account stored successfully in the database.",
    createFailed: "Could not create department account.",
    wardEyebrow: "Ward Offices",
    wardTitle: "33 ward access list",
    logout: "Logout",
  },
};

function fill(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function renderDivisionCards() {
  const grid = document.getElementById("division-grid");
  if (!grid) return;
  grid.innerHTML = structure
    .map(
      (item) => `
        <button type="button" class="management-card ${selectedDivision.division === item.division ? "active" : ""}" data-division="${item.division}">
          <h3>${currentLanguage === "ne" ? item.nepali : item.division}</h3>
          <p>${item.sections.join(", ")}</p>
        </button>
      `,
    )
    .join("");

  grid.querySelectorAll("[data-division]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedDivision = structure.find((item) => item.division === button.dataset.division) || structure[0];
      render();
    });
  });
}

function renderWardGrid() {
  const grid = document.getElementById("ward-grid");
  if (!grid) return;
  grid.innerHTML = wards
    .map((ward) => `<div class="ward-card">Ward ${ward}</div>`)
    .join("");
}

function renderSectionOptions() {
  const select = document.getElementById("selected-section-input");
  if (!select) return;
  select.innerHTML = selectedDivision.sections.map((section) => `<option>${section}</option>`).join("");
}

function render() {
  const t = translations[currentLanguage];
  document.documentElement.lang = currentLanguage;
  fill("admin-panel-title", t.title);
  fill("admin-gov-label", t.gov);
  fill("admin-main-title", t.main);
  fill("admin-subtitle", t.sub);
  fill("admin-welcome-banner", t.welcome);
  fill("summary-divisions", t.divisions);
  fill("summary-sections", t.sections);
  fill("summary-wards", t.wards);
  fill("division-eyebrow", t.divisionEyebrow);
  fill("division-title", t.divisionTitle);
  fill("form-eyebrow", t.formEyebrow);
  fill("form-title", t.formTitle);
  fill("selected-division-label", t.selectedDivision);
  fill("selected-section-label", t.selectedSection);
  fill("department-name-label", t.departmentName);
  fill("department-login-label", t.loginId);
  fill("department-password-label", t.password);
  fill("create-department-account-button", t.createAccount);
  fill("ward-eyebrow", t.wardEyebrow);
  fill("ward-title", t.wardTitle);
  fill("admin-logout-button", t.logout);
  document.getElementById("selected-division-input").value = currentLanguage === "ne" ? selectedDivision.nepali : selectedDivision.division;
  document.getElementById("department-name-input").placeholder = t.departmentNamePlaceholder;
  document.getElementById("department-login-input").placeholder = t.loginIdPlaceholder;
  document.getElementById("department-password-input").placeholder = t.passwordPlaceholder;
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });
  renderDivisionCards();
  renderSectionOptions();
  renderWardGrid();
}

render();

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLanguage = button.dataset.lang;
    render();
  });
});

document.getElementById("admin-logout-button")?.addEventListener("click", () => {
  sessionStorage.removeItem("admin_user");
  window.location.replace("./admin-login.html");
});

document.getElementById("create-department-account-button")?.addEventListener("click", async () => {
  const message = document.getElementById("department-account-message");
  const payload = {
    divisionName: selectedDivision.division,
    sectionName: document.getElementById("selected-section-input")?.value || "",
    name: document.getElementById("department-name-input")?.value.trim() || "",
    loginId: document.getElementById("department-login-input")?.value.trim() || "",
    password: document.getElementById("department-password-input")?.value.trim() || "",
  };

  message.className = "form-message";
  message.textContent = "";

  try {
    const response = await fetch("http://localhost:4000/api/admin/department-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      message.classList.add("error");
      message.textContent = result.message || translations[currentLanguage].createFailed;
      return;
    }

    message.classList.add("success");
    message.textContent = translations[currentLanguage].createSuccess;
  } catch (error) {
    message.classList.add("error");
    message.textContent = translations[currentLanguage].createFailed;
  }
});
