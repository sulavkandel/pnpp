const translations = {
  ne: {
    title: "पोखरा महानगरपालिका नागरिक पोर्टल",
    gov: "नेपाल सरकार",
    main: "नागरिक गुनासो फाराम",
    sub: "लगइनपछि मात्र पहुँच हुने नागरिक फाराम",
    logout: "लगआउट",
    welcome: "स्वागत छ, {name}. तपाईं अब सुरक्षित नागरिक पोर्टलमा हुनुहुन्छ।",
    wizardEyebrow: "गुनासो फाराम",
    wizardTitle: "चरणगत गुनासो विवरण",
    wizardStep: "चरण १ / ९",
    fieldCategory: "तपाईं कुन प्रकारको समस्या भोगिरहनुभएको छ?",
    road: "सडक",
    garbage: "फोहोर",
    water: "पानी",
    drainage: "ढल",
    light: "बत्ती",
    other: "अन्य",
    fieldSubcategory: "विशिष्ट समस्या",
    placeholderSubcategory: "उप-श्रेणी लेख्नुहोस्",
    fieldLocation: "स्थान",
    placeholderLocation: "GPS वा वडा, क्षेत्र, ल्यान्डमार्क",
    fieldMedia: "फोटो / भिडियो अपलोड",
    fieldDescription: "समस्याको विवरण",
    placeholderDescription: "समस्याको विस्तृत विवरण लेख्नुहोस्",
    fieldUrgency: "जरुरीपन",
    high: "उच्च",
    medium: "मध्यम",
    low: "न्यून",
    fieldContact: "सम्पर्क विवरण",
    placeholderContact: "नाम, फोन, इमेल",
    fieldAnonymous: "गोप्य रूपमा पठाउने?",
    no: "होइन",
    yes: "हो",
    submit: "पुष्टि गरेर पेश गर्नुहोस्",
    flowCards: [
      ["०१", "समस्याको प्रकार छान्नुहोस्", "सडक, फोहोर, पानीजस्ता मुख्य श्रेणी छान्नुहोस्।"],
      ["०२", "विशिष्ट समस्या छान्नुहोस्", "उप-श्रेणी प्रणालीलाई सही कार्यालय पहिचान गर्न मद्दत गर्छ।"],
      ["०३", "स्थान दिनुहोस्", "GPS वा वडा, क्षेत्र, र नजिकको ल्यान्डमार्क प्रयोग गर्नुहोस्।"],
      ["०४", "फोटो / भिडियो थप्नुहोस्", "अनेक प्रमाण फाइलहरू थप्न सकिन्छ।"],
      ["०५", "विस्तृत विवरण लेख्नुहोस्", "समस्याको स्पष्ट विवरण दिनुहोस्।"],
      ["०६", "जरुरीपन छान्नुहोस्", "उच्च, मध्यम, वा न्यून प्राथमिकता छान्नुहोस्।"],
      ["०७", "सम्पर्क विवरण थप्नुहोस्", "नाम, फोन, इमेल वैकल्पिक रूपमा राख्न सकिन्छ।"],
      ["०८", "गोप्य रूपमा पठाउने?", "हो / होइन रोज्नुहोस्।"],
      ["०९", "पुष्टि गरेर पेश गर्नुहोस्", "सबै विवरण जाँचेर अन्तिम रूपमा पठाउनुहोस्।"],
    ],
  },
  en: {
    title: "Pokhara Mahanagarpalika Citizen Portal",
    gov: "Government of Nepal",
    main: "Citizen Complaint Form",
    sub: "Protected complaint form available only after login",
    logout: "Logout",
    welcome: "Welcome, {name}. You are now inside the protected citizen portal.",
    wizardEyebrow: "Complaint Form",
    wizardTitle: "Step-by-step complaint details",
    wizardStep: "Step 1 / 9",
    fieldCategory: "What type of problem are you facing?",
    road: "Road",
    garbage: "Garbage",
    water: "Water",
    drainage: "Drainage",
    light: "Streetlight",
    other: "Other",
    fieldSubcategory: "Specific issue",
    placeholderSubcategory: "Write the sub-category",
    fieldLocation: "Location",
    placeholderLocation: "GPS or ward, area, landmark",
    fieldMedia: "Upload photo / video",
    fieldDescription: "Problem description",
    placeholderDescription: "Write a detailed description",
    fieldUrgency: "Urgency",
    high: "High",
    medium: "Medium",
    low: "Low",
    fieldContact: "Contact details",
    placeholderContact: "Name, phone, email",
    fieldAnonymous: "Submit anonymously?",
    no: "No",
    yes: "Yes",
    submit: "Confirm and submit",
    flowCards: [
      ["01", "Select the problem type", "Choose a main category such as road, garbage, or water."],
      ["02", "Choose the specific issue", "The sub-category helps identify the correct office."],
      ["03", "Provide location", "Use GPS or select ward, area, and landmark."],
      ["04", "Add photo / video", "Multiple media files can be attached."],
      ["05", "Write the details", "Describe the issue clearly."],
      ["06", "Select urgency", "Choose high, medium, or low priority."],
      ["07", "Add contact details", "Name, phone, and email are optional."],
      ["08", "Submit anonymously?", "Choose yes or no."],
      ["09", "Confirm and submit", "Review and submit the complaint."],
    ],
  },
};

let currentLanguage = "ne";
const storedUser = sessionStorage.getItem("citizen_user");

if (!storedUser) {
  window.location.replace("./index.html");
}

const user = storedUser ? JSON.parse(storedUser) : null;

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function setPlaceholder(id, value) {
  const node = document.getElementById(id);
  if (node) node.setAttribute("placeholder", value);
}

function renderFlowCards() {
  const flow = translations[currentLanguage].flowCards;
  const container = document.getElementById("flow-cards");
  if (!container) return;
  container.innerHTML = flow
    .map(
      ([step, title, body]) => `
        <article class="flow-card">
          <div class="flow-card-header">
            <div class="flow-step">${step}</div>
            <div>
              <h3>${title}</h3>
              <p>${body}</p>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderPage() {
  const t = translations[currentLanguage];
  document.documentElement.lang = currentLanguage;
  setText("portal-top-title", t.title);
  setText("portal-gov-label", t.gov);
  setText("portal-main-title", t.main);
  setText("portal-subtitle", t.sub);
  setText("logout-button", t.logout);
  setText("welcome-banner", t.welcome.replace("{name}", user?.name || ""));
  setText("wizard-eyebrow", t.wizardEyebrow);
  setText("wizard-title", t.wizardTitle);
  setText("wizard-step", t.wizardStep);
  setText("field-category", t.fieldCategory);
  setText("opt-road", t.road);
  setText("opt-garbage", t.garbage);
  setText("opt-water", t.water);
  setText("opt-drainage", t.drainage);
  setText("opt-light", t.light);
  setText("opt-other", t.other);
  setText("field-subcategory", t.fieldSubcategory);
  setPlaceholder("input-subcategory", t.placeholderSubcategory);
  setText("field-location", t.fieldLocation);
  setPlaceholder("input-location", t.placeholderLocation);
  setText("field-media", t.fieldMedia);
  setText("field-description", t.fieldDescription);
  setPlaceholder("input-description", t.placeholderDescription);
  setText("field-urgency", t.fieldUrgency);
  setText("urgency-high", t.high);
  setText("urgency-medium", t.medium);
  setText("urgency-low", t.low);
  setText("field-contact", t.fieldContact);
  setPlaceholder("input-contact", t.placeholderContact);
  setText("field-anonymous", t.fieldAnonymous);
  setText("anonymous-no", t.no);
  setText("anonymous-yes", t.yes);
  setText("submit-complaint-button", t.submit);
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });
  renderFlowCards();
}

renderPage();

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLanguage = button.dataset.lang;
    renderPage();
  });
});

document.getElementById("logout-button")?.addEventListener("click", () => {
  sessionStorage.removeItem("citizen_user");
  window.location.replace("./index.html");
});
