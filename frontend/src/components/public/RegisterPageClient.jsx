"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { LanguageSwitch, PublicTopbar } from "./PublicShell.jsx";
import { ChatbotWidget } from "./ChatbotClient.jsx";

const translations = {
  ne: {
    topbarTitle: "नागरिक दर्ता",
    back: "गृहपृष्ठमा फर्कनुहोस्",
    title: "उजुरी दर्ता र नागरिक खाता खोल्नुहोस्",
    subtitle: "पहिलो पटक प्रयोग गर्दै हुनुहुन्छ भने यहाँबाट आफ्नो नागरिक खाता सुरक्षित रूपमा सिर्जना गर्नुहोस्। लगइन इमेल वा नागरिक कोडबाट गर्न सकिन्छ।",
    breadcrumb: "दर्ता",
    secureOne: "सुरक्षित अभिलेख",
    secureTwo: "नागरिक पहिचान",
    trackLink: "गुनासो ट्र्याक",
    stepOne: "खाता",
    stepTwo: "सम्पर्क",
    stepThree: "सुरक्षा",
    stepFour: "समाप्त",
    formEyebrow: "नागरिक दर्ता",
    formTitle: "नयाँ नागरिक खाता",
    formBody: "खाता खुलेपछि तपाईंले गुनासो दर्ता, स्थिति ट्र्याक, र आफ्नै नागरिक ड्यासबोर्ड प्रयोग गर्न सक्नुहुन्छ।",
    actionHint: "दर्ता भएपछि इमेल वा नागरिक कोड प्रयोग गरेर लगइन गर्न सकिन्छ।",
    identityHint: "दर्ता पूरा भएपछि एक अद्वितीय नागरिक कोड स्वचालित रूपमा प्रदान गरिन्छ।",
    benefitEyebrow: "सेवा विशेषता",
    panelBody: "आधिकारिक नागरिक पहुँच, सुरक्षित पहिचान, र समाधानसम्मको पारदर्शी ट्र्याकिङ एउटै स्थानमा उपलब्ध छ।",
    trustOne: "२४ घण्टा प्रारम्भिक समीक्षा",
    trustTwo: "फोटो वा कागजात प्रमाण",
    trustThree: "आवश्यक परे गोप्य पहिचान",
    name: "पूरा नाम",
    mobile: "मोबाइल नम्बर",
    email: "इमेल ठेगाना",
    password: "पासवर्ड",
    anonymous: "गुमनाम नागरिक कोड पनि सिर्जना गर्ने",
    create: "खाता सिर्जना गर्नुहोस्",
    success: "दर्ता सफल भयो। तपाईंलाई ड्यासबोर्डमा लगइन गरियो।",
    exists: "यो इमेल वा मोबाइल नम्बरबाट पहिले नै प्रयोगकर्ता दर्ता भइसकेको छ।",
    failed: "दर्ता गर्न सकिएन। फेरि प्रयास गर्नुहोस्।",
    codeNotice: "तपाईंको गुमनाम नागरिक कोड: {code}",
    placeholderName: "नागरिकको नाम",
    placeholderMobile: "98XXXXXXXX",
    placeholderEmail: "example@email.com",
    placeholderPassword: "पासवर्ड बनाउनुहोस्",
    panelTitle: "दर्ता भएपछि तपाईंले के पाउनुहुन्छ",
    benefitOne: "नागरिक कोडसहित निजी नागरिक ड्यासबोर्ड",
    benefitTwo: "गुनासो ट्र्याकिङ इतिहास र समाधान स्थिति",
    benefitThree: "समाधान भएपछि प्रतिक्रिया दिने सुविधा",
    benefitFour: "आवश्यक परे गुमनाम पहिचान",
    continueNotice: "दर्ता पूरा भएपछि तपाईं सीधै गुनासो फाराममा जानुहुनेछ।",
  },
  en: {
    topbarTitle: "Citizen Registration",
    back: "Back to home",
    title: "Create your citizen account",
    subtitle: "If this is your first time using the system, securely register your citizen account here. You will sign in later with your email or citizen ID.",
    breadcrumb: "Register",
    secureOne: "Secure Ledger",
    secureTwo: "Citizen Identity",
    trackLink: "Track Complaint",
    stepOne: "Account",
    stepTwo: "Contact",
    stepThree: "Security",
    stepFour: "Done",
    formEyebrow: "Citizen Registration",
    formTitle: "New citizen account",
    formBody: "Once your account is created, you can submit complaints, track progress, and use your citizen dashboard.",
    actionHint: "After registration, you can sign in later using your email address or citizen ID.",
    identityHint: "A unique citizen ID is generated automatically after registration.",
    benefitEyebrow: "Service Highlights",
    panelBody: "Official civic access, secure identity, and transparent complaint follow-up in one modern municipal portal.",
    trustOne: "24-hour first review",
    trustTwo: "Photo or document proof",
    trustThree: "Private identity when needed",
    name: "Full name",
    mobile: "Mobile number",
    email: "Email address",
    password: "Password",
    anonymous: "Also generate an anonymous citizen code",
    create: "Create account",
    success: "Registration successful. You are now logged in and redirected to the dashboard.",
    exists: "A user with this email or mobile number already exists.",
    failed: "Registration failed. Please try again.",
    codeNotice: "Your anonymous citizen ID: {code}",
    placeholderName: "Citizen name",
    placeholderMobile: "98XXXXXXXX",
    placeholderEmail: "example@email.com",
    placeholderPassword: "Create password",
    panelTitle: "What you get after registration",
    benefitOne: "A personal dashboard with a citizen ID",
    benefitTwo: "Complaint tracking history and status updates",
    benefitThree: "Resolution feedback tools",
    benefitFour: "Anonymous identity when needed",
    continueNotice: "After registration, you will continue directly to the complaint form.",
  },
};

export function RegisterPageClient() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [continueToComplaint, setContinueToComplaint] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobileNumber: "",
    email: "",
    password: "",
    registerAnonymously: false,
  });

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    try {
      setContinueToComplaint(new URLSearchParams(window.location.search).get("next") === "complaint");
    } catch {
      setContinueToComplaint(false);
    }
  }, []);

  async function handleSignup() {
    setMessage({ type: "", text: "" });
    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (response.ok) {
        sessionStorage.setItem("citizen_user", JSON.stringify(result.user));
        sessionStorage.setItem("citizen_auth_token", result.token);
        const registrationCode = result.user?.citizenCode || result.anonymousCitizenCode || "";
        if (registrationCode) {
          sessionStorage.setItem("citizen_registration_notice", registrationCode);
        }
        const anonymousCodeText = result.anonymousCitizenCode
          ? ` ${t.codeNotice.replace("{code}", result.anonymousCitizenCode)}`
          : "";
        setMessage({ type: "success", text: `${t.success}${anonymousCodeText}` });
        router.push(continueToComplaint ? appRoutes.citizenSections.file : appRoutes.citizen);
        return;
      }
      setMessage({
        type: "error",
        text: response.status === 409 ? (result.message || t.exists) : (result.message || t.failed),
      });
    } catch {
      setMessage({ type: "error", text: t.failed });
    }
  }

  return (
    <>
      <BodyConfig />
      <PublicTopbar title={t.topbarTitle}>
        <a href={appRoutes.home} className="track-link">{t.back}</a>
        <a href={appRoutes.track} className="track-link">{t.trackLink}</a>
        <LanguageSwitch currentLanguage={language} onChange={setLanguage} />
      </PublicTopbar>

      <main className="stitch-form-page">
        <section className="stitch-form-hero">
          <div className="container stitch-form-hero-inner">
            <div className="stitch-form-header">
              <div className="stitch-breadcrumb">{t.breadcrumb}</div>
              <h1>{t.title}</h1>
              <p>{t.subtitle}</p>
              <div className="stitch-security-pills">
                <span>{t.secureOne}</span>
                <span>{t.secureTwo}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="stitch-section stitch-register-section">
          <div className="container stitch-register-layout">
            <div className="stitch-stepper-wrap">
              <div className="stitch-stepper">
                <div className="stitch-step is-active"><span>1</span><strong>{t.stepOne}</strong></div>
                <div className="stitch-step is-active"><span>2</span><strong>{t.stepTwo}</strong></div>
                <div className="stitch-step"><span>3</span><strong>{t.stepThree}</strong></div>
                <div className="stitch-step"><span>4</span><strong>{t.stepFour}</strong></div>
              </div>
            </div>

            <div className="stitch-register-grid">
              <article className="stitch-surface-card stitch-register-form-card">
                <div className="stitch-register-card-header">
                  <div>
                    <p className="eyebrow small">{t.formEyebrow}</p>
                    <h3>{t.formTitle}</h3>
                  </div>
                  <div className="stitch-register-card-stamp" aria-hidden="true">
                    <span>PMC</span>
                  </div>
                </div>
                <p className="stitch-card-copy">{t.formBody}</p>
                {continueToComplaint ? (
                  <div className="login-banner">{t.continueNotice}</div>
                ) : null}
                <form className="auth-form stitch-auth-form" onSubmit={(event) => event.preventDefault()}>
                  <div className="stitch-register-form-grid">
                    <label>
                      <span>{t.name}</span>
                      <input
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        placeholder={t.placeholderName}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span>{t.email}</span>
                      <input
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        placeholder={t.placeholderEmail}
                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span>{t.mobile}</span>
                      <input
                        type="text"
                        autoComplete="tel"
                        value={form.mobileNumber}
                        placeholder={t.placeholderMobile}
                        onChange={(event) => setForm((prev) => ({ ...prev, mobileNumber: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span>{t.password}</span>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={form.password}
                        placeholder={t.placeholderPassword}
                        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      />
                    </label>
                  </div>
                  <p className="stitch-register-footnote">{t.actionHint}</p>
                  <div className="stitch-register-identity-note">{t.identityHint}</div>
                  <div className="stitch-register-submit-row">
                    <label className="citizen-check-row stitch-check-row stitch-register-check">
                      <input
                        type="checkbox"
                        checked={form.registerAnonymously}
                        onChange={(event) => setForm((prev) => ({ ...prev, registerAnonymously: event.target.checked }))}
                      />
                      <span>{t.anonymous}</span>
                    </label>
                    <button type="button" className="button primary stitch-register-submit" onClick={handleSignup}>
                      {t.create}
                    </button>
                  </div>
                </form>
                {message.text ? <div className={`form-message ${message.type}`}>{message.text}</div> : null}
              </article>

              <article className="stitch-register-benefits">
                <div className="stitch-surface-card stitch-register-benefit-card">
                  <div className="stitch-register-benefit-top">
                    <div className="stitch-register-seal">
                      <img src="/assets/images/nepal-gov-emblem.png" alt="Government of Nepal emblem" />
                    </div>
                    <div>
                      <p className="eyebrow small">{t.benefitEyebrow}</p>
                      <h3>{t.panelTitle}</h3>
                      <p className="stitch-card-copy">{t.panelBody}</p>
                    </div>
                  </div>
                  <div className="stitch-register-benefit-pills">
                    <span>{t.trustOne}</span>
                    <span>{t.trustTwo}</span>
                    <span>{t.trustThree}</span>
                  </div>
                  <div className="stitch-benefit-list">
                    <div><span>01</span><p>{t.benefitOne}</p></div>
                    <div><span>02</span><p>{t.benefitTwo}</p></div>
                    <div><span>03</span><p>{t.benefitThree}</p></div>
                    <div><span>04</span><p>{t.benefitFour}</p></div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
      <ChatbotWidget initialLanguage={language} />
    </>
  );
}
