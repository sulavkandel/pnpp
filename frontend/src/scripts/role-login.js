const pageRole = document.body.dataset.rolePage;

const translations = {
  department: {
    ne: {
      title: "विभाग / वडा लगइन",
      back: "नागरिक लगइनमा फर्कनुहोस्",
      gov: "नेपाल सरकार",
      heading: "विभाग तथा वडा कार्यालय लगइन",
      subtitle: "Department and ward access page",
      eyebrow: "कार्यालय लगइन",
      formTitle: "विभाग / वडा पोर्टल पहुँच",
      portalLabel: "पोर्टल छान्नुहोस्",
      divisionLabel: "महाशाखा छान्नुहोस्",
      sectionLabel: "साखा / युनिट छान्नुहोस्",
      wardLabel: "वडा छान्नुहोस्",
      wardOption: "वडा कार्यालय",
      departmentOption: "विभाग",
      userLabel: "कार्यालय आईडी / युजरनेम",
      userPlaceholder: "कार्यालय लगइन",
      passwordLabel: "पासवर्ड",
      passwordPlaceholder: "पासवर्ड प्रविष्ट गर्नुहोस्",
      button: "विभाग / वडामा लगइन",
      success: "विभाग लगइन सफल भयो।",
      failed: "विभाग लगइन विवरण मिलेन।",
    },
    en: {
      title: "Department / Ward Login",
      back: "Back to citizen login",
      gov: "Government of Nepal",
      heading: "Department and Ward Office Login",
      subtitle: "Department and ward access page",
      eyebrow: "Official login",
      formTitle: "Department / Ward portal access",
      portalLabel: "Select portal",
      divisionLabel: "Select division",
      sectionLabel: "Select section / unit",
      wardLabel: "Select ward",
      wardOption: "Ward Office",
      departmentOption: "Department",
      userLabel: "Office ID / username",
      userPlaceholder: "Office login",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter password",
      button: "Login to department / ward",
      success: "Department login successful.",
      failed: "Invalid department login details.",
    },
  },
  admin: {
    ne: {
      title: "एडमिन लगइन",
      back: "नागरिक लगइनमा फर्कनुहोस्",
      gov: "नेपाल सरकार",
      heading: "केन्द्रिय एडमिन लगइन",
      subtitle: "Administrator access page",
      eyebrow: "एडमिन पहुँच",
      formTitle: "एडमिन प्यानलमा लगइन",
      userLabel: "एडमिन युजरनेम",
      userPlaceholder: "Admin username",
      passwordLabel: "पासवर्ड",
      passwordPlaceholder: "पासवर्ड प्रविष्ट गर्नुहोस्",
      button: "एडमिन प्यानलमा लगइन",
      success: "एडमिन लगइन सफल भयो।",
      failed: "एडमिन लगइन विवरण मिलेन।",
    },
    en: {
      title: "Admin Login",
      back: "Back to citizen login",
      gov: "Government of Nepal",
      heading: "Central Admin Login",
      subtitle: "Administrator access page",
      eyebrow: "Admin access",
      formTitle: "Login to admin panel",
      userLabel: "Admin username",
      userPlaceholder: "Admin username",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter password",
      button: "Login to admin panel",
      success: "Admin login successful.",
      failed: "Invalid admin login details.",
    },
  },
};

let currentLanguage = "ne";

const departmentStructure = [
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

function renderDepartmentSelectors() {
  if (pageRole !== "department") return;

  const divisionSelect = document.getElementById("division-select");
  const sectionSelect = document.getElementById("section-select");
  const wardSelect = document.getElementById("ward-select");
  const portalSelect = document.getElementById("portal-select");

  if (!divisionSelect || !sectionSelect || !wardSelect || !portalSelect) return;

  const selectedDivision = departmentStructure.find((item) => item.division === divisionSelect.value) || departmentStructure[0];

  if (!divisionSelect.options.length) {
    divisionSelect.innerHTML = departmentStructure
      .map((item) => `<option value="${item.division}">${currentLanguage === "ne" ? item.nepali : item.division}</option>`)
      .join("");
  } else {
    const currentValue = divisionSelect.value;
    divisionSelect.innerHTML = departmentStructure
      .map((item) => `<option value="${item.division}" ${currentValue === item.division ? "selected" : ""}>${currentLanguage === "ne" ? item.nepali : item.division}</option>`)
      .join("");
  }

  const activeDivision = departmentStructure.find((item) => item.division === divisionSelect.value) || departmentStructure[0];
  sectionSelect.innerHTML = activeDivision.sections.map((section) => `<option value="${section}">${section}</option>`).join("");
  wardSelect.innerHTML = wards.map((ward) => `<option value="Ward ${ward}">${currentLanguage === "ne" ? `वडा ${ward}` : `Ward ${ward}`}</option>`).join("");

  const wardOnly = portalSelect.selectedIndex === 0;
  divisionSelect.disabled = wardOnly;
  sectionSelect.disabled = wardOnly;
}

function render() {
  const dict = translations[pageRole]?.[currentLanguage];
  if (!dict) return;

  document.documentElement.lang = currentLanguage;

  document.querySelectorAll("[data-role-text]").forEach((node) => {
    const key = node.dataset.roleText;
    if (dict[key]) node.textContent = dict[key];
  });

  document.querySelectorAll("[data-role-placeholder]").forEach((node) => {
    const key = node.dataset.rolePlaceholder;
    if (dict[key]) node.setAttribute("placeholder", dict[key]);
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });

  renderDepartmentSelectors();
}

render();

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLanguage = button.dataset.lang;
    render();
  });
});

if (pageRole === "department") {
  document.getElementById("portal-select")?.addEventListener("change", () => {
    renderDepartmentSelectors();
  });

  document.getElementById("division-select")?.addEventListener("change", () => {
    renderDepartmentSelectors();
  });
}

const loginForm = document.getElementById("role-login-form");
const loginMessage = document.getElementById("role-login-message");

if (loginForm && loginMessage) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  const loginButton = loginForm.querySelector("button");
  loginButton?.addEventListener("click", async () => {
    const formData = new FormData(loginForm);
    const payload = {
      loginId: String(formData.get("loginId") || "").trim(),
      password: String(formData.get("password") || "").trim(),
    };

    loginMessage.className = "form-message";
    loginMessage.textContent = "";

    const endpoint = pageRole === "admin" ? "http://localhost:4000/api/auth/admin-login" : "http://localhost:4000/api/auth/department-login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        loginMessage.classList.add("error");
        loginMessage.textContent = result.message || translations[pageRole][currentLanguage].failed;
        return;
      }

      loginMessage.classList.add("success");
      loginMessage.textContent = translations[pageRole][currentLanguage].success;

      if (pageRole === "admin") {
        sessionStorage.setItem("admin_user", JSON.stringify(result.user));
        window.location.href = "./admin-panel.html";
        return;
      }

      sessionStorage.setItem("department_user", JSON.stringify(result.user));
      window.location.href = "./department-portal.html";
    } catch (error) {
      loginMessage.classList.add("error");
      loginMessage.textContent = translations[pageRole][currentLanguage].failed;
    }
  });
}
