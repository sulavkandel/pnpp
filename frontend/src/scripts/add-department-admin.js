import { apiBase, appRoutes } from "./runtime-config.js";

const storedAdmin = sessionStorage.getItem("admin_user");
const adminAuthToken = sessionStorage.getItem("admin_auth_token");

if (!storedAdmin || !adminAuthToken) {
  window.location.replace(appRoutes.adminLogin);
}

let currentLanguage = "ne";

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

const t = {
  ne: {
    title: "विभाग / वडा एडमिन थप्नुहोस्",
    back: "एडमिन प्यानलमा फर्कनुहोस्",
    gov: "नेपाल सरकार",
    main: "विभाग तथा वडा एडमिन व्यवस्थापन",
    sub: "Create department and ward admin accounts",
    eyebrow: "खाता सिर्जना",
    formTitle: "विभाग वा वडा एडमिन खाता थप्नुहोस्",
    officeType: "कार्यालय प्रकार",
    department: "विभाग",
    ward: "वडा",
    division: "महाशाखा",
    section: "साखा / युनिट",
    wardNo: "वडा नम्बर",
    name: "नाम",
    namePlaceholder: "नाम लेख्नुहोस्",
    login: "लगइन आईडी",
    loginPlaceholder: "login id",
    password: "लगइन पासवर्ड",
    passwordPlaceholder: "password",
    create: "खाता सिर्जना गर्नुहोस्",
    success: "विभाग / वडा एडमिन खाता सफलतापूर्वक डाटाबेसमा सुरक्षित गरियो।",
    failed: "खाता सिर्जना गर्न सकिएन।",
  },
  en: {
    title: "Add Department / Ward Admin",
    back: "Back to admin panel",
    gov: "Government of Nepal",
    main: "Department and Ward Admin Management",
    sub: "Create department and ward admin accounts",
    eyebrow: "Account creation",
    formTitle: "Add a department or ward admin account",
    officeType: "Office type",
    department: "Department",
    ward: "Ward",
    division: "Division",
    section: "Section / Unit",
    wardNo: "Ward number",
    name: "Name",
    namePlaceholder: "Enter name",
    login: "Login ID",
    loginPlaceholder: "login id",
    password: "Login password",
    passwordPlaceholder: "password",
    create: "Create account",
    success: "Department / ward admin account stored successfully in the database.",
    failed: "Could not create account.",
  },
};

function renderOptions() {
  const divisionSelect = document.getElementById("division-select");
  const sectionSelect = document.getElementById("section-select");
  const wardSelect = document.getElementById("ward-select");
  const officeType = document.getElementById("office-type-select").value;
  const currentDivision = divisionSelect.value || structure[0].division;

  divisionSelect.innerHTML = structure
    .map((item) => `<option value="${item.division}" ${currentDivision === item.division ? "selected" : ""}>${currentLanguage === "ne" ? item.nepali : item.division}</option>`)
    .join("");

  const selected = structure.find((item) => item.division === divisionSelect.value) || structure[0];
  sectionSelect.innerHTML = selected.sections.map((item) => `<option value="${item}">${item}</option>`).join("");
  wardSelect.innerHTML = wards.map((ward) => `<option value="${ward}">${currentLanguage === "ne" ? `वडा ${ward}` : `Ward ${ward}`}</option>`).join("");

  document.getElementById("division-field").style.display = officeType === "department" ? "grid" : "none";
  document.getElementById("section-field").style.display = officeType === "department" ? "grid" : "none";
  document.getElementById("ward-field").style.display = officeType === "ward" ? "grid" : "none";
}

function render() {
  const dict = t[currentLanguage];
  document.documentElement.lang = currentLanguage;
  document.getElementById("office-admin-title").textContent = dict.title;
  document.getElementById("back-admin-panel").textContent = dict.back;
  document.getElementById("office-admin-gov").textContent = dict.gov;
  document.getElementById("office-admin-main").textContent = dict.main;
  document.getElementById("office-admin-sub").textContent = dict.sub;
  document.getElementById("office-admin-eyebrow").textContent = dict.eyebrow;
  document.getElementById("office-admin-form-title").textContent = dict.formTitle;
  document.getElementById("office-type-label").textContent = dict.officeType;
  document.getElementById("office-type-department").textContent = dict.department;
  document.getElementById("office-type-ward").textContent = dict.ward;
  document.getElementById("division-label").textContent = dict.division;
  document.getElementById("section-label").textContent = dict.section;
  document.getElementById("ward-label").textContent = dict.wardNo;
  document.getElementById("name-label").textContent = dict.name;
  document.getElementById("name-input").placeholder = dict.namePlaceholder;
  document.getElementById("login-label").textContent = dict.login;
  document.getElementById("login-input").placeholder = dict.loginPlaceholder;
  document.getElementById("password-label").textContent = dict.password;
  document.getElementById("password-input").placeholder = dict.passwordPlaceholder;
  document.getElementById("create-office-admin-button").textContent = dict.create;
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });
  renderOptions();
}

render();

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLanguage = button.dataset.lang;
    render();
  });
});

document.getElementById("office-type-select").addEventListener("change", renderOptions);
document.getElementById("division-select").addEventListener("change", renderOptions);

document.getElementById("create-office-admin-button").addEventListener("click", async () => {
  const officeType = document.getElementById("office-type-select").value;
  const payload = {
    officeType,
    divisionName: officeType === "department" ? document.getElementById("division-select").value : "",
    sectionName: officeType === "department" ? document.getElementById("section-select").value : "",
    wardNumber: officeType === "ward" ? document.getElementById("ward-select").value : "",
    name: document.getElementById("name-input").value.trim(),
    loginId: document.getElementById("login-input").value.trim(),
    password: document.getElementById("password-input").value.trim(),
  };

  const message = document.getElementById("office-admin-message");
  message.className = "form-message";
  message.textContent = "";

  try {
    const response = await fetch(`${apiBase}/api/admin/office-accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAuthToken}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      message.classList.add("error");
      message.textContent = result.message || t[currentLanguage].failed;
      return;
    }

    message.classList.add("success");
    message.textContent = `${t[currentLanguage].success} ${result.officeAdmin?.loginId || ""}`;
    document.getElementById("office-admin-form").reset();
    renderOptions();
  } catch (error) {
    message.classList.add("error");
    message.textContent = t[currentLanguage].failed;
  }
});
