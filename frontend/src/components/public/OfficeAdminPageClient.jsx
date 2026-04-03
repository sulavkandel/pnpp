"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { ChatbotWidget } from "./ChatbotClient.jsx";
import { GovernmentHeader, LanguageSwitch, PublicTopbar } from "./PublicShell.jsx";

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

const translations = {
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
    authRequired: "पहिले एडमिन लगइन गर्नुहोस्।",
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
    authRequired: "Please sign in as admin first.",
  },
};

export function OfficeAdminPageClient() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [authToken, setAuthToken] = useState("");
  const [form, setForm] = useState({
    officeType: "department",
    divisionName: structure[0].division,
    sectionName: structure[0].sections[0],
    wardNumber: "1",
    name: "",
    loginId: "",
    password: "",
  });

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_auth_token") || "";
    const storedAdmin = sessionStorage.getItem("admin_user");
    if (!token || !storedAdmin) {
      router.replace(appRoutes.adminLogin);
      return;
    }
    setAuthToken(token);
  }, [router]);

  const selectedDivision = useMemo(
    () => structure.find((item) => item.division === form.divisionName) || structure[0],
    [form.divisionName],
  );

  useEffect(() => {
    if (!selectedDivision.sections.includes(form.sectionName)) {
      setForm((prev) => ({ ...prev, sectionName: selectedDivision.sections[0] }));
    }
  }, [selectedDivision, form.sectionName]);

  async function handleSubmit() {
    if (!authToken) {
      setMessage({ type: "error", text: t.authRequired });
      return;
    }

    setMessage({ type: "", text: "" });
    try {
      const payload = {
        officeType: form.officeType,
        divisionName: form.officeType === "department" ? form.divisionName : "",
        sectionName: form.officeType === "department" ? form.sectionName : "",
        wardNumber: form.officeType === "ward" ? form.wardNumber : "",
        name: form.name.trim(),
        loginId: form.loginId.trim(),
        password: form.password.trim(),
      };

      const response = await fetch(`${apiBase}/api/admin/office-accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message || t.failed });
        return;
      }

      setMessage({ type: "success", text: `${t.success} ${result.officeAdmin?.loginId || ""}` });
      setForm({
        officeType: "department",
        divisionName: structure[0].division,
        sectionName: structure[0].sections[0],
        wardNumber: "1",
        name: "",
        loginId: "",
        password: "",
      });
    } catch {
      setMessage({ type: "error", text: t.failed });
    }
  }

  return (
    <>
      <BodyConfig />
      <PublicTopbar title={t.title}>
        <a href={appRoutes.adminPanel} className="track-link">{t.back}</a>
        <LanguageSwitch currentLanguage={language} onChange={setLanguage} />
      </PublicTopbar>
      <GovernmentHeader govLabel={t.gov} title={t.main} subtitle={t.sub} />
      <main>
        <section className="section">
          <div className="container">
            <div className="panel auth-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow small">{t.eyebrow}</p>
                  <h3>{t.formTitle}</h3>
                </div>
              </div>

              <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
                <label>
                  <span>{t.officeType}</span>
                  <select
                    value={form.officeType}
                    onChange={(event) => setForm((prev) => ({ ...prev, officeType: event.target.value }))}
                  >
                    <option value="department">{t.department}</option>
                    <option value="ward">{t.ward}</option>
                  </select>
                </label>

                {form.officeType === "department" ? (
                  <>
                    <label>
                      <span>{t.division}</span>
                      <select
                        value={form.divisionName}
                        onChange={(event) => setForm((prev) => ({ ...prev, divisionName: event.target.value }))}
                      >
                        {structure.map((item) => (
                          <option key={item.division} value={item.division}>
                            {language === "ne" ? item.nepali : item.division}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>{t.section}</span>
                      <select
                        value={form.sectionName}
                        onChange={(event) => setForm((prev) => ({ ...prev, sectionName: event.target.value }))}
                      >
                        {selectedDivision.sections.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : (
                  <label>
                    <span>{t.wardNo}</span>
                    <select
                      value={form.wardNumber}
                      onChange={(event) => setForm((prev) => ({ ...prev, wardNumber: event.target.value }))}
                    >
                      {wards.map((ward) => (
                        <option key={ward} value={String(ward)}>
                          {language === "ne" ? `वडा ${ward}` : `Ward ${ward}`}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  <span>{t.name}</span>
                  <input
                    type="text"
                    value={form.name}
                    placeholder={t.namePlaceholder}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>

                <label>
                  <span>{t.login}</span>
                  <input
                    type="text"
                    value={form.loginId}
                    placeholder={t.loginPlaceholder}
                    onChange={(event) => setForm((prev) => ({ ...prev, loginId: event.target.value }))}
                  />
                </label>

                <label>
                  <span>{t.password}</span>
                  <input
                    type="password"
                    value={form.password}
                    placeholder={t.passwordPlaceholder}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  />
                </label>

                <button type="button" className="button block dark" onClick={handleSubmit}>
                  {t.create}
                </button>
              </form>
              <div className={`form-message ${message.type}`}>{message.text}</div>
            </div>
          </div>
        </section>
      </main>
      <ChatbotWidget initialLanguage={language} mode="officeAdmin" />
    </>
  );
}
