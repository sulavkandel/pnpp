import { apiBase, appRoutes } from "./runtime-config.js";

const translations = {
  ne: {
    topbarTitle: "पोखरा महानगरपालिका नागरिक सेवा पोर्टल",
    departmentLink: "विभाग लगइन",
    adminLink: "एडमिन लगइन",
    trackComplaint: "गुनासो ट्र्याक गर्नुहोस्",
    govLabel: "नेपाल सरकार",
    siteTitle: "पोखरा महानगरपालिका नागरिक गुनासो पोर्टल",
    siteSubtitle: "Citizen, Ward, Department and Admin Access",
    heroPill: "सजिलो गुनासो दर्ता तथा ट्र्याकिङ",
    heroTitle: "लगइन गर्नुहोस्, गुनासो दर्ता गर्नुहोस्, र स्थिति ट्र्याक गर्नुहोस्।",
    heroBody:
      "नागरिकका लागि मोबाइल नम्बर र पासवर्ड, नयाँ प्रयोगकर्ताका लागि साइन अप, विभाग/वडा लगइन, र एडमिन लगइन एउटै पृष्ठमा उपलब्ध छ।",
    loginHubEyebrow: "लगइन",
    loginHubTitle: "पहिलो पृष्ठमा सबै प्रकारका लगइन विकल्पहरू।",
    citizenLoginEyebrow: "नागरिक लगइन",
    citizenLoginTitle: "मोबाइल नम्बर र पासवर्ड",
    citizenLoginSuccess: "लगइन सफल भयो। नागरिक पोर्टल खुल्यो।",
    citizenLoginFailed: "मोबाइल नम्बर/नागरिक कोड वा पासवर्ड मिलेन।",
    citizenIdentifierHint: "मोबाइल नम्बर वा CIT कोड प्रयोग गर्नुहोस्।",
    citizenCodeNotice: "तपाईंको गुमनाम नागरिक कोड: {code}",
    fieldMobile: "मोबाइल नम्बर",
    fieldCitizenIdentifier: "मोबाइल नम्बर वा नागरिक कोड",
    fieldPassword: "पासवर्ड",
    fieldName: "पूरा नाम",
    fieldEmail: "इमेल",
    fieldRegisterAnonymous: "गुमनाम रूपमा दर्ता गर्ने",
    fieldSelectPortal: "पोर्टल छान्नुहोस्",
    fieldOfficeLogin: "कार्यालय आईडी / युजरनेम",
    fieldAdminUsername: "एडमिन युजरनेम",
    citizenLoginButton: "नागरिक पोर्टलमा लगइन",
    signupEyebrow: "साइन अप",
    signupTitle: "नयाँ प्रयोगकर्ता दर्ता",
    signupButton: "दर्ता गर्नुहोस्",
    signupSuccess: "दर्ता सफल भयो। तपाईंलाई ड्यासबोर्डमा लगइन गरियो।",
    signupExists: "यो मोबाइल नम्बरबाट पहिले नै प्रयोगकर्ता दर्ता भइसकेको छ।",
    signupFailed: "दर्ता गर्न सकिएन। फेरि प्रयास गर्नुहोस्।",
    trackEyebrow: "ट्र्याकिङ",
    trackTitle: "गुनासोको स्थिति हेर्नुहोस्",
    trackField: "गुनासो नम्बर, गोप्य कोड वा मोबाइल",
    trackNow: "ट्र्याक गर्नुहोस्",
    trackStatus: "हालको स्थिति: कार्य प्रगतिमा",
    trackNotFound: "गुनासो भेटिएन।",
    timelineEyebrow: "समयरेखा",
    portalEyebrow: "नागरिक पोर्टल",
    portalTitle: "लगइनपछि चरणगत गुनासो प्रवाह",
    portalBody:
      "प्रयोगकर्ताले समस्या प्रकार, उप-श्रेणी, स्थान, फोटो/भिडियो, विवरण, प्राथमिकता, सम्पर्क, गोपनीयता, र पुष्टि सहित गुनासो पठाउँछन्।",
    portalWelcome: "स्वागत छ, {name}. तपाईं अब नागरिक पोर्टलमा हुनुहुन्छ।",
    wizardEyebrow: "गुनासो विजार्ड",
    wizardTitle: "गुनासो पेश गर्ने प्रक्रिया",
    wizardStep: "चरण १ / ९",
    currentQuestionLabel: "हालको प्रश्न",
    currentQuestionTitle: "तपाईं कुन प्रकारको समस्या भोगिरहनुभएको छ?",
    choiceRoad: "सडक",
    choiceGarbage: "फोहोर",
    choiceWater: "पानी",
    choiceDrainage: "ढल",
    choiceStreetlight: "बत्ती",
    choiceOther: "अन्य",
    placeholderMobile: "98XXXXXXXX",
    placeholderCitizenIdentifier: "98XXXXXXXX वा CIT-1234",
    placeholderPassword: "पासवर्ड प्रविष्ट गर्नुहोस्",
    placeholderName: "नागरिकको नाम",
    placeholderEmail: "example@email.com",
    placeholderCreatePassword: "पासवर्ड बनाउनुहोस्",
    placeholderOfficeLogin: "कार्यालय लगइन",
    placeholderAdmin: "Admin username",
    placeholderTrack: "PMC-2026-001245, गोप्य कोड वा 98XXXXXXXX",
  },
  en: {
    topbarTitle: "Pokhara Mahanagarpalika Citizen Service Portal",
    departmentLink: "Department Login",
    adminLink: "Admin Login",
    trackComplaint: "Track Complaint",
    govLabel: "Government of Nepal",
    siteTitle: "Pokhara Mahanagarpalika Citizen Grievance Portal",
    siteSubtitle: "Citizen, Ward, Department and Admin Access",
    heroPill: "Simple complaint registration and tracking",
    heroTitle: "Log in, submit a complaint, and track its status.",
    heroBody:
      "Citizen mobile login, sign up for new users, department/ward login, and admin login are all available on the same first page.",
    loginHubEyebrow: "Login",
    loginHubTitle: "All login options on the first page.",
    citizenLoginEyebrow: "Citizen Login",
    citizenLoginTitle: "Mobile number and password",
    citizenLoginSuccess: "Login successful. The citizen portal is now open.",
    citizenLoginFailed: "Invalid mobile number / citizen ID or password.",
    citizenIdentifierHint: "Use your mobile number or CIT code.",
    citizenCodeNotice: "Your anonymous citizen ID: {code}",
    fieldMobile: "Mobile number",
    fieldCitizenIdentifier: "Mobile number or Citizen ID",
    fieldPassword: "Password",
    fieldName: "Full name",
    fieldEmail: "Email",
    fieldRegisterAnonymous: "Register anonymously",
    fieldSelectPortal: "Select portal",
    fieldOfficeLogin: "Office ID / username",
    fieldAdminUsername: "Admin username",
    citizenLoginButton: "Login to citizen portal",
    signupEyebrow: "Sign Up",
    signupTitle: "New user registration",
    signupButton: "Register",
    signupSuccess: "Registration successful. You are now logged in and redirected to the dashboard.",
    signupExists: "A user with this mobile number already exists.",
    signupFailed: "Registration failed. Please try again.",
    trackEyebrow: "Tracking",
    trackTitle: "Check complaint status",
    trackField: "Complaint ID, anonymous code, or mobile",
    trackNow: "Track now",
    trackStatus: "Current status: In Progress",
    trackNotFound: "Complaint not found.",
    timelineEyebrow: "Timeline",
    portalEyebrow: "Citizen Portal",
    portalTitle: "Question flow after login",
    portalBody:
      "Users submit complaints through category, sub-category, location, media upload, description, urgency, contact details, anonymity, and confirmation.",
    portalWelcome: "Welcome, {name}. You are now inside the citizen portal.",
    wizardEyebrow: "Complaint Wizard",
    wizardTitle: "Complaint submission process",
    wizardStep: "Step 1 / 9",
    currentQuestionLabel: "Current question",
    currentQuestionTitle: "What type of problem are you facing?",
    choiceRoad: "Road",
    choiceGarbage: "Garbage",
    choiceWater: "Water",
    choiceDrainage: "Drainage",
    choiceStreetlight: "Streetlight",
    choiceOther: "Other",
    placeholderMobile: "98XXXXXXXX",
    placeholderCitizenIdentifier: "98XXXXXXXX or CIT-1234",
    placeholderPassword: "Enter password",
    placeholderName: "Citizen name",
    placeholderEmail: "example@email.com",
    placeholderCreatePassword: "Create password",
    placeholderOfficeLogin: "Office login",
    placeholderAdmin: "Admin username",
    placeholderTrack: "PMC-2026-001245, anonymous code, or 98XXXXXXXX",
  },
};

const content = {
  ne: {
    timeline: [
      ["Submitted", "The complaint has been registered successfully."],
      ["Received", "The responsible office received the complaint."],
      ["In Progress", "Work is ongoing on the complaint."],
      ["Resolved", "The complaint has been resolved."],
    ],
  },
  en: {
    timeline: [
      ["Submitted", "The complaint has been registered successfully."],
      ["Received", "The responsible office received the complaint."],
      ["In Progress", "Work is ongoing on the complaint."],
      ["Resolved", "The complaint has been resolved."],
    ],
  },
};

let currentLanguage = "ne";

function translateStatic() {
  const dict = translations[currentLanguage];
  document.documentElement.lang = currentLanguage;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (dict[key]) node.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (dict[key]) node.setAttribute("placeholder", dict[key]);
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });
}

function fillGrid(id, items, render) {
  const node = document.getElementById(id);
  if (!node) return;
  node.innerHTML = items.map(render).join("");
}

function renderDynamic() {
  const data = content[currentLanguage];

  fillGrid(
    "tracking-timeline",
    data.timeline,
    ([title, copy]) => `
      <article class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-copy">
          <strong>${title}</strong>
          <p>${copy}</p>
        </div>
      </article>
    `,
  );
}

function renderTrackingTimeline(entries = content[currentLanguage].timeline) {
  fillGrid(
    "tracking-timeline",
    entries,
    ([title, copy]) => `
      <article class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-copy">
          <strong>${title}</strong>
          <p>${copy}</p>
        </div>
      </article>
    `,
  );
}

function renderAll() {
  translateStatic();
  renderDynamic();
}

renderAll();

const citizenLoginForm = document.getElementById("citizen-login-form");
const citizenLoginMessage = document.getElementById("citizen-login-message");
const signupForm = document.getElementById("signup-form");
const signupMessage = document.getElementById("signup-message");

if (citizenLoginForm && citizenLoginMessage) {
  citizenLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
  });

  const loginButton = citizenLoginForm.querySelector("button");
  loginButton?.addEventListener("click", async () => {
    const formData = new FormData(citizenLoginForm);
    const payload = {
      identifier: String(formData.get("identifier") || "").trim(),
      password: String(formData.get("password") || "").trim(),
    };

    citizenLoginMessage.className = "form-message";
    citizenLoginMessage.textContent = "";

    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        citizenLoginMessage.classList.add("error");
        citizenLoginMessage.textContent = result.message || translations[currentLanguage].citizenLoginFailed;
        return;
      }

      sessionStorage.setItem("citizen_user", JSON.stringify(result.user));
      sessionStorage.setItem("citizen_auth_token", result.token);
      citizenLoginMessage.classList.add("success");
      citizenLoginMessage.textContent = translations[currentLanguage].citizenLoginSuccess;
      window.location.href = appRoutes.citizen;
    } catch (error) {
      citizenLoginMessage.classList.add("error");
      citizenLoginMessage.textContent = translations[currentLanguage].citizenLoginFailed;
    }
  });
}

if (signupForm && signupMessage) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
  });

  const signupButton = signupForm.querySelector("button");
  signupButton?.addEventListener("click", async () => {
    const formData = new FormData(signupForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      mobileNumber: String(formData.get("mobileNumber") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || "").trim(),
      registerAnonymously: formData.get("registerAnonymously") === "on",
    };

    signupMessage.className = "form-message";
    signupMessage.textContent = "";

    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        signupMessage.classList.add("success");
        sessionStorage.setItem("citizen_user", JSON.stringify(result.user));
        sessionStorage.setItem("citizen_auth_token", result.token);
        const anonymousCodeText = result.anonymousCitizenCode
          ? ` ${translations[currentLanguage].citizenCodeNotice.replace("{code}", result.anonymousCitizenCode)}`
          : "";
        if (result.anonymousCitizenCode) {
          sessionStorage.setItem("citizen_registration_notice", result.anonymousCitizenCode);
        }
        signupMessage.textContent = `${translations[currentLanguage].signupSuccess}${anonymousCodeText}`;
        signupForm.reset();
        window.location.href = appRoutes.citizen;
        return;
      }

      signupMessage.classList.add("error");
      signupMessage.textContent =
        response.status === 409 ? translations[currentLanguage].signupExists : result.message || translations[currentLanguage].signupFailed;
    } catch (error) {
      signupMessage.classList.add("error");
      signupMessage.textContent = translations[currentLanguage].signupFailed;
    }
  });
}

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLanguage = button.dataset.lang;
    renderAll();
  });
});

const trackButton = document.getElementById("track-complaint-button");
const trackInput = document.getElementById("track-query-input");
const trackMessage = document.getElementById("track-message");
const trackStatusPill = document.getElementById("track-status-pill");

trackButton?.addEventListener("click", async () => {
  const query = String(trackInput?.value || "").trim();
  trackMessage.className = "form-message";
  trackMessage.textContent = "";

  if (!query) {
    trackMessage.classList.add("error");
    trackMessage.textContent = translations[currentLanguage].trackNotFound;
    return;
  }

  try {
    const response = await fetch(`${apiBase}/api/complaints/track?query=${encodeURIComponent(query)}`);
    const result = await response.json();

    if (!response.ok) {
      trackMessage.classList.add("error");
      trackMessage.textContent = result.message || translations[currentLanguage].trackNotFound;
      renderTrackingTimeline();
      return;
    }

    const complaint = result.complaint;
    if (trackStatusPill) {
      trackStatusPill.textContent = `${translations[currentLanguage].trackStatus.split(":")[0]}: ${complaint.status}`;
    }

    const historyEntries = (complaint.history || []).map((entry) => [entry.action, entry.note || entry.message || ""]);
    renderTrackingTimeline(historyEntries.length ? historyEntries : content[currentLanguage].timeline);
    trackMessage.classList.add("success");
    trackMessage.textContent = complaint.tokenNumber;
  } catch (error) {
    trackMessage.classList.add("error");
    trackMessage.textContent = translations[currentLanguage].trackNotFound;
  }
});

document.querySelectorAll(".role-switch").forEach((button) => {
  button.addEventListener("click", () => {
    const role = button.dataset.role;
    if (role !== "citizen") return;
  });
});
