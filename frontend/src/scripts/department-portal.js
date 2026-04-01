const storedDepartment = sessionStorage.getItem("department_user");

if (!storedDepartment) {
  window.location.replace("./department-login.html");
}

const departmentUser = storedDepartment ? JSON.parse(storedDepartment) : null;
let currentLanguage = "ne";

const translations = {
  ne: {
    title: "विभाग पोर्टल",
    gov: "नेपाल सरकार",
    main: "विभागीय ड्यासबोर्ड",
    sub: "सफल लगइनपछि विभागीय पहुँच",
    welcome: `स्वागत छ, ${departmentUser?.name || ""}. तपाईंको विभागीय पोर्टल खुल्यो।`,
    eyebrow: "विभाग विवरण",
    detailsTitle: "लगइन गरिएको विभाग जानकारी",
    logout: "लगआउट",
    items: [
      ["लगइन आईडी", departmentUser?.loginId || ""],
      ["महाशाखा", departmentUser?.divisionName || ""],
      ["साखा / युनिट", departmentUser?.sectionName || ""],
      ["नाम", departmentUser?.name || ""],
    ],
  },
  en: {
    title: "Department Portal",
    gov: "Government of Nepal",
    main: "Department Dashboard",
    sub: "Department access after successful login",
    welcome: `Welcome, ${departmentUser?.name || ""}. Your department portal is now open.`,
    eyebrow: "Department details",
    detailsTitle: "Logged in department information",
    logout: "Logout",
    items: [
      ["Login ID", departmentUser?.loginId || ""],
      ["Division", departmentUser?.divisionName || ""],
      ["Section / Unit", departmentUser?.sectionName || ""],
      ["Name", departmentUser?.name || ""],
    ],
  },
};

function render() {
  const t = translations[currentLanguage];
  document.documentElement.lang = currentLanguage;
  document.getElementById("dept-portal-title").textContent = t.title;
  document.getElementById("dept-gov-label").textContent = t.gov;
  document.getElementById("dept-main-title").textContent = t.main;
  document.getElementById("dept-subtitle").textContent = t.sub;
  document.getElementById("department-welcome-banner").textContent = t.welcome;
  document.getElementById("dept-details-eyebrow").textContent = t.eyebrow;
  document.getElementById("dept-details-title").textContent = t.detailsTitle;
  document.getElementById("department-logout-button").textContent = t.logout;
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });

  const list = document.getElementById("department-details-list");
  list.innerHTML = t.items
    .map(
      ([label, value]) => `
        <div class="detail-card">
          <h3>${label}</h3>
          <p>${value}</p>
        </div>
      `,
    )
    .join("");
}

render();

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLanguage = button.dataset.lang;
    render();
  });
});

document.getElementById("department-logout-button")?.addEventListener("click", () => {
  sessionStorage.removeItem("department_user");
  window.location.replace("./department-login.html");
});
