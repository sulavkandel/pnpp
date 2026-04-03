"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { ChatbotWidget } from "./ChatbotClient.jsx";
import { LanguageSwitch } from "./PublicShell.jsx";

const translations = {
  department: {
    ne: {
      title: "अधिकृत लगइन",
      back: "नागरिक पृष्ठमा फर्कनुहोस्",
      heading: "विभागीय अधिकृत लगइन",
      subtitle: "साप्ताहिक ड्युटीमा रहेका अधिकृतका लागि सुरक्षित पहुँच",
      badge: "सुरक्षित पहुँच",
      formTitle: "अधिकृत लगइन",
      hint: "सक्रिय साप्ताहिक रोटेसन भएका अधिकृतले मात्र यहाँबाट लगइन गर्न सक्नुहुन्छ।",
      userLabel: "कार्यालय आईडी / युजरनेम",
      userPlaceholder: "office_login",
      passwordLabel: "पासवर्ड",
      passwordPlaceholder: "पासवर्ड प्रविष्ट गर्नुहोस्",
      forgot: "पासवर्ड बिर्सनुभयो?",
      button: "अधिकृत पोर्टलमा लगइन",
      success: "अधिकृत लगइन सफल भयो।",
      failed: "अधिकृत लगइन विवरण मिलेन।",
      forgotMessage: "पासवर्ड रिसेटका लागि केन्द्रीय एडमिनलाई सम्पर्क गर्नुहोस्।",
      heroTitle: "पोखरा नागरिक प्रतिक्रिया प्रणाली",
      heroSub: "विभागीय पहुँच केन्द्र",
      heroFooter: "पोखरा महानगरपालिकाको आधिकारिक डिजिटल नागरिक सेवा पहल।",
    },
    en: {
      title: "Officer Login",
      back: "Back to citizen portal",
      heading: "Department Officer Login",
      subtitle: "Secure access for officers on active weekly duty",
      badge: "Secure Portal Access",
      formTitle: "Officer Login",
      hint: "Only officers assigned to the active weekly rotation can sign in here.",
      userLabel: "Office ID / username",
      userPlaceholder: "office_login",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter password",
      forgot: "Forgot password?",
      button: "Login to officer portal",
      success: "Officer login successful.",
      failed: "Invalid officer login details.",
      forgotMessage: "Please contact the central admin to reset your password.",
      heroTitle: "Pokhara Citizen Response System",
      heroSub: "Department Access Chancery",
      heroFooter: "An official initiative of Pokhara Metropolitan City for sovereign digital governance.",
    },
  },
  admin: {
    ne: {
      title: "एडमिन लगइन",
      back: "नागरिक पृष्ठमा फर्कनुहोस्",
      heading: "केन्द्रीय प्रशासन लगइन",
      subtitle: "अधिकृत प्रशासनिक प्रयोगकर्ताका लागि सुरक्षित पहुँच",
      badge: "सुरक्षित पहुँच",
      formTitle: "प्रशासन लगइन",
      hint: "केन्द्रीय प्रशासन, निगरानी, र विश्लेषण सम्बन्धी पहुँच यहाँबाट उपलब्ध छ।",
      userLabel: "प्रयोगकर्ता नाम / इमेल",
      userPlaceholder: "admin@pokharamun.gov.np",
      passwordLabel: "पासवर्ड",
      passwordPlaceholder: "पासवर्ड प्रविष्ट गर्नुहोस्",
      button: "Dashboard मा लगइन गर्नुहोस्",
      success: "एडमिन लगइन सफल भयो।",
      failed: "एडमिन लगइन विवरण मिलेन।",
      heroTitle: "पोखरा नागरिक प्रतिक्रिया प्रणाली",
      heroSub: "प्रशासनिक पहुँच केन्द्र",
      heroFooter: "पोखरा महानगरपालिकाको आधिकारिक डिजिटल नागरिक सेवा पहल।",
    },
    en: {
      title: "Admin Login",
      back: "Back to citizen portal",
      heading: "Central Admin Login",
      subtitle: "Secure access for authorized administrative personnel",
      badge: "Secure Portal Access",
      formTitle: "Admin Login",
      hint: "Central administration, oversight, and analytics access are available from here.",
      userLabel: "Username / email",
      userPlaceholder: "admin@pokharamun.gov.np",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter password",
      button: "Login to Dashboard",
      success: "Admin login successful.",
      failed: "Invalid admin login details.",
      heroTitle: "Pokhara Citizen Response System",
      heroSub: "Administrative Chancery",
      heroFooter: "An official initiative of Pokhara Metropolitan City for sovereign digital governance.",
    },
  },
};

export function RoleLoginPageClient({ role }) {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState({ loginId: "", password: "" });

  const t = translations[role][language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  async function handleSubmit() {
    setMessage({ type: "", text: "" });
    const endpoint = role === "admin" ? `${apiBase}/api/auth/admin-login` : `${apiBase}/api/auth/department-login`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: form.loginId.trim(),
          password: form.password.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: result.message || t.failed });
        return;
      }
      if (role === "admin") {
        sessionStorage.setItem("admin_user", JSON.stringify(result.user));
        sessionStorage.setItem("admin_auth_token", result.token);
        setMessage({ type: "success", text: t.success });
        router.push(appRoutes.adminPanel);
        return;
      }
      sessionStorage.setItem("department_user", JSON.stringify(result.user));
      sessionStorage.setItem("department_auth_token", result.token);
      setMessage({ type: "success", text: t.success });
      router.push(appRoutes.departmentPortal);
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
              <div className="login-banner">{t.hint}</div>
              <label>
                <span>{t.userLabel}</span>
                <input
                  type="text"
                  value={form.loginId}
                  placeholder={t.userPlaceholder}
                  onChange={(event) => setForm((prev) => ({ ...prev, loginId: event.target.value }))}
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
              {role === "department" ? (
                <button
                  type="button"
                  className="track-link stitch-forgot-link"
                  onClick={() => setMessage({ type: "success", text: t.forgotMessage })}
                >
                  {t.forgot}
                </button>
              ) : null}
              <button type="button" className="button dark block" onClick={handleSubmit}>
                {t.button}
              </button>
            </form>

            {message.text ? <div className={`form-message ${message.type}`}>{message.text}</div> : null}
          </div>
        </section>
      </main>
      <ChatbotWidget initialLanguage={language} mode={role === "admin" ? "admin" : "officer"} />
    </>
  );
}
