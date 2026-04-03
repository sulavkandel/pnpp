"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { LanguageSwitch } from "./PublicShell.jsx";
import { ChatbotWidget } from "./ChatbotClient.jsx";

const translations = {
  ne: {
    title: "नागरिक लगइन",
    back: "गृहपृष्ठमा फर्कनुहोस्",
    subtitle: "इमेल वा नागरिक कोड प्रयोग गरेर आफ्नो नागरिक ड्यासबोर्डमा प्रवेश गर्नुहोस्।",
    badge: "नागरिक पहुँच",
    formTitle: "नागरिक लगइन",
    userLabel: "इमेल वा नागरिक कोड",
    userPlaceholder: "name@example.com वा CIT-1234",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "पासवर्ड प्रविष्ट गर्नुहोस्",
    button: "नागरिक पोर्टलमा लगइन",
    success: "लगइन सफल भयो। नागरिक पोर्टल खुल्दैछ।",
    failed: "इमेल/नागरिक कोड वा पासवर्ड मिलेन।",
    createNew: "नयाँ खाता बनाउनुहोस्",
    heroTitle: "पोखरा नागरिक प्रतिक्रिया प्रणाली",
    heroSub: "नागरिक पहुँच केन्द्र",
    heroFooter: "पोखरा महानगरपालिकाको आधिकारिक डिजिटल नागरिक सेवा पहल।",
  },
  en: {
    title: "Citizen Login",
    back: "Back to home",
    subtitle: "Use your email address or citizen ID to access your citizen dashboard.",
    badge: "Citizen Access",
    formTitle: "Citizen Login",
    userLabel: "Email or Citizen ID",
    userPlaceholder: "name@example.com or CIT-1234",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    button: "Login to citizen portal",
    success: "Login successful. Opening citizen portal.",
    failed: "Invalid email / citizen ID or password.",
    createNew: "Create new account",
    heroTitle: "Pokhara Citizen Response System",
    heroSub: "Citizen Response Chancery",
    heroFooter: "An official initiative of Pokhara Metropolitan City for sovereign digital governance.",
  },
};

export function CitizenLoginPageClient() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState({ identifier: "", password: "" });

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  async function handleCitizenLogin() {
    setMessage({ type: "", text: "" });
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: String(form.identifier || "").trim(),
          password: form.password,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: result.message || t.failed });
        return;
      }
      sessionStorage.setItem("citizen_user", JSON.stringify(result.user));
      sessionStorage.setItem("citizen_auth_token", result.token);
      setMessage({ type: "success", text: t.success });
      router.push(appRoutes.citizen);
    } catch {
      setMessage({ type: "error", text: t.failed });
    }
  }

  return (
    <>
      <BodyConfig className="pnpp-login-body" />
      <main className="stitch-login-shell">
        <section className="stitch-login-brand">
          <div className="stitch-login-brand-inner">
            <div className="stitch-login-brand-mark">
              <img src="/assets/images/nepal-gov-emblem.png" alt="Government of Nepal emblem" />
            </div>
            <div className="stitch-login-brand-copy">
              <h1>{t.heroTitle}</h1>
              <div className="stitch-login-divider"></div>
              <p>{t.heroSub}</p>
            </div>
          </div>
          <div className="stitch-login-brand-footer">
            <p>{t.heroFooter}</p>
          </div>
        </section>

        <section className="stitch-login-panel-wrap">
          <div className="stitch-login-toolbar">
            <a href={appRoutes.home} className="track-link">{t.back}</a>
            <LanguageSwitch currentLanguage={language} onChange={setLanguage} />
          </div>

          <div className="stitch-login-panel">
            <div className="stitch-login-header">
              <div className="stitch-login-badge">{t.badge}</div>
              <h2>{t.formTitle}</h2>
              <p>{t.subtitle}</p>
            </div>

            <form className="stitch-login-form" onSubmit={(event) => event.preventDefault()}>
              <label>
                <span>{t.userLabel}</span>
                <input
                  type="text"
                  value={form.identifier}
                  placeholder={t.userPlaceholder}
                  onChange={(event) => setForm((prev) => ({ ...prev, identifier: event.target.value }))}
                />
              </label>
              <label>
                <span>{t.passwordLabel}</span>
                <input
                  type="password"
                  value={form.password}
                  placeholder={t.passwordPlaceholder}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                />
              </label>
              <button type="button" className="button dark block" onClick={handleCitizenLogin}>
                {t.button}
              </button>
              <a href={appRoutes.register} className="button secondary-outline block">{t.createNew}</a>
            </form>

            {message.text ? <div className={`form-message ${message.type}`}>{message.text}</div> : null}
          </div>
        </section>
      </main>
      <ChatbotWidget initialLanguage={language} />
    </>
  );
}
