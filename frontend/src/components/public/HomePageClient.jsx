"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  Clock3,
  Droplets,
  FileText,
  GraduationCap,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  Route,
  Scale,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
  X,
} from "lucide-react";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { LanguageSwitch, PublicTopbar } from "./PublicShell.jsx";
import { ChatbotWidget } from "./ChatbotClient.jsx";

const translations = {
  ne: {
    topbarTitle: "पोखरा नागरिक प्रतिक्रिया",
    topbarRegister: "दर्ता",
    topbarCitizen: "नागरिक",
    topbarTransparency: "पारदर्शिता",
    topbarChatbot: "AI गुनासो",
    departmentLink: "विभाग लगइन",
    adminLink: "एडमिन लगइन",
    trackComplaint: "गुनासो ट्र्याक",
    heroKicker: "पोखरा महानगरपालिका • डिजिटल नागरिक सेवा",
    heroTitle: "तपाईंको आवाज, हाम्रो जिम्मेवारी",
    heroBody: "पोखरा महानगरपालिकासँग सम्बन्धित उजुरी दर्ता, स्थिति ट्र्याक, र समाधान प्रगति हेर्नका लागि एकीकृत नागरिक पोर्टल।",
    heroPrimary: "उजुरी दर्ता गर्नुहोस्",
    heroSecondary: "स्थिति ट्र्याक",
    complaintChoiceEyebrow: "उजुरी दर्ता विकल्प",
    complaintChoiceTitle: "कसरी अघि बढ्न चाहनुहुन्छ?",
    complaintChoiceBody: "तपाईं तुरुन्त गुमनाम रूपमा गुनासो दर्ता गर्न सक्नुहुन्छ, वा नागरिक खाता बनाएर लगइनपछि गुनासो पेश गर्न सक्नुहुन्छ।",
    complaintChoiceAnonymousTitle: "गुमनाम रूपमा पेश गर्नुहोस्",
    complaintChoiceAnonymousBody: "मानक गुनासो फाराम तुरुन्त भरें, विभागमा पठाउनुहोस्, र ट्र्याकिङ टोकन तुरुन्त पाउनुहोस्।",
    complaintChoiceAnonymousAction: "गुमनाम फाराम खोल्नुहोस्",
    complaintChoiceRegisterTitle: "दर्ता गरी पेश गर्नुहोस्",
    complaintChoiceRegisterBody: "नागरिक खाता खोल्नुहोस् र त्यसपछि सीधै लगइन भएको गुनासो फाराममा जारी राख्नुहोस्।",
    complaintChoiceRegisterAction: "दर्ता जारी राख्नुहोस्",
    complaintChoiceClose: "बन्द गर्नुहोस्",
    statReports: "कुल दर्ता",
    statResolved: "समाधान दर",
    statTime: "औसत समय",
    statWards: "सक्रिय वडा",
    processTitle: "कार्यप्रवाह",
    processBody: "नागरिकको गुनासो दर्तादेखि विभागीय समाधानसम्मको स्पष्ट, पारदर्शी, र समयबद्ध प्रक्रिया।",
    processOneTitle: "१. दर्ता",
    processOneBody: "समस्या, स्थान, र प्रमाणसहित उजुरी सुरक्षित रूपमा दर्ता गर्नुहोस्।",
    processTwoTitle: "२. ट्र्याकिङ",
    processTwoBody: "युनिक ट्र्याकिङ नम्बरबाट स्थिति र विभागीय टिप्पणी हेर्नुहोस्।",
    processThreeTitle: "३. समाधान",
    processThreeBody: "सम्बन्धित निकायबाट समाधान, पुष्टि, र अन्तिम प्रतिक्रिया प्राप्त गर्नुहोस्।",
    citizenLoginTitle: "नागरिक लगइन",
    citizenLoginBody: "इमेल वा नागरिक कोडबाट लगइन गर्नुहोस्। नयाँ प्रयोगकर्ताले खाता बनाउन सक्छन्।",
    citizenLoginEyebrow: "नागरिक पहुँच",
    citizenLoginButton: "लगइन",
    signupEyebrow: "नयाँ दर्ता",
    signupTitle: "खाता बनाउनुहोस्",
    signupBody: "खाता, गुमनाम कोड, र प्रोफाइल सेटअप गर्नुहोस्।",
    signupButton: "दर्ता",
    trackEyebrow: "स्थिति पोर्टल",
    trackTitle: "स्थिति ट्र्याक",
    trackBody: "गुनासो नम्बर, गोप्य कोड, इमेल, वा मोबाइल नम्बर प्रयोग गर्नुहोस्।",
    trackNow: "ट्र्याक",
    authorityTitle: "विषयगत विभागहरू",
    authorityBody: "सडक, सरसफाई, पानी, स्वास्थ्य, शिक्षा, कानुन र अन्य नगर सेवा सम्बन्धी विभागहरूमा गुनासो पुग्ने संरचना।",
    authorityMore: "सम्पूर्ण निर्देशिका",
    livePulse: "प्रत्यक्ष सञ्चालन संकेत",
    livePulseBody: "हालको गुनासो प्रणालीबाट अद्यावधिक गरिएको सेवा गतिविधि।",
    liveCompleted: "यस हप्ता समाधान",
    liveReview: "समीक्षाधीन",
    liveResponse: "२४ घण्टा पहिलो प्रतिक्रिया",
    liveDepartments: "सक्रिय विभाग",
    registerFeatureOne: "इमेल लगइन र नागरिक कोड",
    registerFeatureTwo: "गुमनाम कोड, इतिहास, र रिवार्ड",
    registerFeatureThree: "मोबाइल पहुँच र प्रतिक्रिया अभिलेख",
    trackFeatureOne: "पहिलो समीक्षा: {count}",
    trackFeatureTwo: "प्रगतिमा: {count}",
    trackFeatureThree: "आज सक्रिय: {count}",
    progressFiled: "दर्ता",
    progressAssigned: "तोकियो",
    progressResolved: "समाधान",
    serviceLoad: "हालको विभागीय भार",
    adminCardTitle: "प्रशासनिक पहुँच",
    adminCardBody: "विभागीय तथा केन्द्रीय एडमिनका लागि छुट्टै सुरक्षित लगइन उपलब्ध छ।",
    adminCardPrimary: "विभाग लगइन",
    adminCardSecondary: "एडमिन लगइन",
    footerHome: "गृहपृष्ठ",
    footerCitizenLogin: "नागरिक लगइन",
    footerRegister: "दर्ता",
    footerTrack: "गुनासो ट्र्याक",
    footerTransparency: "पारदर्शिता",
    footerDepartment: "विभाग लगइन",
    footerAdmin: "एडमिन लगइन",
    placeholderCitizenIdentifier: "98XXXXXXXX वा CIT-1234",
    placeholderPassword: "पासवर्ड प्रविष्ट गर्नुहोस्",
    placeholderName: "नागरिकको नाम",
    placeholderMobile: "98XXXXXXXX",
    placeholderEmail: "example@email.com",
    placeholderCreatePassword: "पासवर्ड बनाउनुहोस्",
    placeholderTrack: "PNPP-2082-04721, गोप्य कोड वा 98XXXXXXXX",
    footerText: "पोखरा महानगरपालिकाको आधिकारिक गुनासो तथा नागरिक प्रतिक्रिया प्लेटफर्म।",
  },
  en: {
    topbarTitle: "Pokhara Civic Response",
    topbarRegister: "Register",
    topbarCitizen: "Citizen",
    topbarTransparency: "Transparency",
    topbarChatbot: "AI Assistant",
    departmentLink: "Department Login",
    adminLink: "Admin Login",
    trackComplaint: "Track Complaint",
    heroKicker: "Pokhara Metropolitan City • Sovereign Digital Governance",
    heroTitle: "Your voice, our responsibility",
    heroBody: "A unified citizen portal for submitting municipal complaints, tracking progress, and viewing department resolution updates.",
    heroPrimary: "Submit Complaint",
    heroSecondary: "Track Status",
    complaintChoiceEyebrow: "Complaint Options",
    complaintChoiceTitle: "How would you like to continue?",
    complaintChoiceBody: "You can file the complaint immediately as an anonymous citizen, or register first and continue into the logged-in complaint form.",
    complaintChoiceAnonymousTitle: "Submit anonymously",
    complaintChoiceAnonymousBody: "Open the standard complaint form now, send it directly to the municipality, and receive a tracking token immediately.",
    complaintChoiceAnonymousAction: "Open anonymous form",
    complaintChoiceRegisterTitle: "Register and submit",
    complaintChoiceRegisterBody: "Create a citizen account first, then continue straight into the logged-in complaint filing flow.",
    complaintChoiceRegisterAction: "Continue to registration",
    complaintChoiceClose: "Close",
    statReports: "Total Reports",
    statResolved: "Resolution Rate",
    statTime: "Average Time",
    statWards: "Active Wards",
    processTitle: "Process Lifecycle",
    processBody: "A clear, transparent, and time-bound path from citizen complaint submission to departmental resolution.",
    processOneTitle: "1. Submission",
    processOneBody: "Register the issue securely with location, details, and visual proof.",
    processTwoTitle: "2. Tracking",
    processTwoBody: "Follow real-time status and department notes using your unique tracking ID.",
    processThreeTitle: "3. Resolution",
    processThreeBody: "Receive formal closure, verification, and final response from the assigned authority.",
    citizenLoginTitle: "Citizen Login",
    citizenLoginBody: "Log in with your email or citizen ID. New users can create an account.",
    citizenLoginEyebrow: "Citizen Access",
    citizenLoginButton: "Log in",
    signupEyebrow: "New Registration",
    signupTitle: "Create account",
    signupBody: "Set up your account, anonymous code, and profile.",
    signupButton: "Register",
    trackEyebrow: "Status Portal",
    trackTitle: "Track Status",
    trackBody: "Use a complaint ID, anonymous code, email, or mobile number.",
    trackNow: "Track",
    authorityTitle: "Authority Departments",
    authorityBody: "Complaints are routed through departments for roads, sanitation, water, health, education, legal affairs, and other civic services.",
    authorityMore: "View full directory",
    livePulse: "Live operations",
    livePulseBody: "Updated directly from the current complaint pipeline.",
    liveCompleted: "Completed this week",
    liveReview: "Under review",
    liveResponse: "24h first response",
    liveDepartments: "Active departments",
    registerFeatureOne: "Email login and citizen ID",
    registerFeatureTwo: "Anonymous code, history, rewards",
    registerFeatureThree: "Mobile access and feedback history",
    trackFeatureOne: "First review: {count}",
    trackFeatureTwo: "In progress: {count}",
    trackFeatureThree: "Active today: {count}",
    progressFiled: "Filed",
    progressAssigned: "Assigned",
    progressResolved: "Resolved",
    serviceLoad: "Current department load",
    adminCardTitle: "Administrative Access",
    adminCardBody: "Secure department and central admin logins are available separately for official users.",
    adminCardPrimary: "Department Login",
    adminCardSecondary: "Admin Login",
    footerHome: "Home",
    footerCitizenLogin: "Citizen Login",
    footerRegister: "Register",
    footerTrack: "Track Complaint",
    footerTransparency: "Transparency",
    footerDepartment: "Department Login",
    footerAdmin: "Admin Login",
    footerText: "Pokhara Metropolitan City official complaint and citizen response platform.",
  },
};

const authorityDepartments = [
  { ne: "सडक तथा पूर्वाधार", en: "Road & Infrastructure" },
  { ne: "सरसफाई तथा वातावरण", en: "Sanitation & Environment" },
  { ne: "खानेपानी तथा ढल", en: "Water & Sewer" },
  { ne: "स्वास्थ्य सेवा", en: "Health Services" },
  { ne: "शिक्षा तथा समुदाय", en: "Education & Community" },
  { ne: "कानुनी तथा प्रशासन", en: "Legal & Administration" },
];

const authorityIcons = [
  Building2,
  Trash2,
  Droplets,
  HeartPulse,
  GraduationCap,
  Scale,
];

const defaultOverview = {
  totals: {
    complaints: 0,
    resolutionRate: 0,
    averageResolutionDays: 0,
    activeWards: 0,
    activeDepartments: 0,
    activeOfficers: 0,
  },
  liveQueue: {
    completedThisWeek: 0,
    inProgress: 0,
    underReview: 0,
    escalated: 0,
    pendingFirstReview: 0,
    firstResponseRate: 0,
  },
  departmentLoad: [],
};

export function HomePageClient() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [overview, setOverview] = useState(defaultOverview);
  const [showComplaintChoice, setShowComplaintChoice] = useState(false);

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!showComplaintChoice) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowComplaintChoice(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showComplaintChoice]);

  useEffect(() => {
    let ignore = false;

    async function fetchOverview() {
      try {
        const response = await fetch(`${apiBase}/api/public/overview`);
        const result = await response.json();
        if (!response.ok || ignore) return;
        setOverview(result.overview || defaultOverview);
      } catch {
        if (!ignore) {
          setOverview(defaultOverview);
        }
      }
    }

    fetchOverview();
    return () => {
      ignore = true;
    };
  }, []);

  const metricCards = [
    { value: overview.totals.complaints.toLocaleString(), label: t.statReports, Icon: BarChart3 },
    { value: `${overview.totals.resolutionRate}%`, label: t.statResolved, Icon: Activity },
    { value: `${overview.totals.averageResolutionDays || 0} days`, label: t.statTime, Icon: Clock3 },
    { value: `${overview.totals.activeWards || 0}`, label: t.statWards, Icon: Landmark },
  ];

  const liveSignals = [
    { label: t.liveCompleted, value: overview.liveQueue.completedThisWeek, Icon: Activity },
    { label: t.liveReview, value: overview.liveQueue.underReview, Icon: Route },
    { label: t.liveResponse, value: `${overview.liveQueue.firstResponseRate}%`, Icon: Clock3 },
    { label: t.liveDepartments, value: overview.totals.activeDepartments || 0, Icon: Building2 },
  ];

  const registerFeatures = [
    { Icon: ShieldCheck, label: t.registerFeatureOne },
    { Icon: LayoutDashboard, label: t.registerFeatureTwo },
    { Icon: UserRoundPlus, label: t.registerFeatureThree },
  ];

  const trackFeatures = [
    { Icon: Clock3, label: t.trackFeatureOne.replace("{count}", overview.liveQueue.pendingFirstReview) },
    { Icon: Activity, label: t.trackFeatureTwo.replace("{count}", overview.liveQueue.inProgress) },
    { Icon: Building2, label: t.trackFeatureThree.replace("{count}", overview.totals.activeDepartments || 0) },
  ];

  const authoritySignals = (overview.departmentLoad.length
    ? overview.departmentLoad.map((item) => ({ label: item.label, count: item.count }))
    : authorityDepartments.map((item) => ({ label: language === "ne" ? item.ne : item.en, count: null })))
    .slice(0, 6);

  return (
    <>
      <BodyConfig />
      <div className="pnpp-public-page">
        <PublicTopbar title={t.topbarTitle}>
          <nav className="pnpp-home-nav" aria-label="Primary">
            <a href={appRoutes.citizenLogin} className="pnpp-home-nav-link">
              <LayoutDashboard size={16} />
              <span>{t.topbarCitizen}</span>
            </a>
            <a href={appRoutes.register} className="pnpp-home-nav-link">
              <UserRoundPlus size={16} />
              <span>{t.topbarRegister}</span>
            </a>
            <a href={appRoutes.transparency} className="pnpp-home-nav-link">
              <BarChart3 size={16} />
              <span>{t.topbarTransparency}</span>
            </a>
            <a href={appRoutes.departmentLogin} className="pnpp-home-nav-link">
              <Building2 size={16} />
              <span>{t.departmentLink}</span>
            </a>
            <a href={appRoutes.adminLogin} className="pnpp-home-nav-link">
              <ShieldCheck size={16} />
              <span>{t.adminLink}</span>
            </a>
            <a href={appRoutes.track} className="pnpp-home-nav-link">
              <Search size={16} />
              <span>{t.trackComplaint}</span>
            </a>
            <a href={appRoutes.chatbot} className="pnpp-home-nav-link">
              <Bot size={16} />
              <span>{t.topbarChatbot}</span>
            </a>
          </nav>
          <LanguageSwitch currentLanguage={language} onChange={setLanguage} />
        </PublicTopbar>

        <main>
          <section className="stitch-hero">
            <div className="container stitch-hero-grid">
              <div className="stitch-hero-copy">
                <div className="stitch-hero-kicker">{t.heroKicker}</div>
                <h1>{t.heroTitle}</h1>
                <p>{t.heroBody}</p>
                <div className="stitch-hero-actions">
                  <button type="button" className="button light" onClick={() => setShowComplaintChoice(true)}>{t.heroPrimary}</button>
                  <a href={appRoutes.track} className="button ghost-light">{t.heroSecondary}</a>
                </div>
                <div className="stitch-hero-signals">
                  {liveSignals.map(({ Icon, label, value }) => (
                    <div className="stitch-hero-signal" key={label}>
                      <span className="stitch-hero-signal-icon"><Icon size={16} /></span>
                      <div>
                        <strong>{value}</strong>
                        <span>{label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="stitch-hero-emblem">
                <div className="stitch-hero-seal">
                  <img src="/assets/images/nepal-gov-emblem.png" alt="Government of Nepal emblem" />
                </div>
              </div>
            </div>
          </section>

          <section className="stitch-metric-band">
            <div className="container">
              <div className="stitch-metric-strip">
                {metricCards.map(({ Icon, value, label }) => (
                  <article key={label}>
                    <div className="stitch-metric-head">
                      <span className="stitch-metric-icon"><Icon size={16} /></span>
                    </div>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="stitch-section">
            <div className="container stitch-process-layout">
              <div className="stitch-process-copy">
                <h2>{t.processTitle}</h2>
                <p>{t.processBody}</p>
                <div className="stitch-process-list">
                  <article>
                    <div className="stitch-process-icon">01</div>
                    <div>
                      <h3>{t.processOneTitle}</h3>
                      <p>{t.processOneBody}</p>
                    </div>
                  </article>
                  <article>
                    <div className="stitch-process-icon">02</div>
                    <div>
                      <h3>{t.processTwoTitle}</h3>
                      <p>{t.processTwoBody}</p>
                    </div>
                  </article>
                  <article>
                    <div className="stitch-process-icon">03</div>
                    <div>
                      <h3>{t.processThreeTitle}</h3>
                      <p>{t.processThreeBody}</p>
                    </div>
                  </article>
                </div>
              </div>

              <div className="stitch-action-grid" id="citizen-access">
                <article className="stitch-action-card stitch-action-primary">
                  <div className="stitch-action-copy">
                    <p className="eyebrow small light">{t.citizenLoginEyebrow}</p>
                    <h3>{t.citizenLoginTitle}</h3>
                    <p>{t.citizenLoginBody}</p>
                    <div className="stitch-public-feature-list light">
                      {registerFeatures.slice(0, 2).map(({ Icon, label }) => (
                        <div className="stitch-public-feature" key={label}>
                          <span><Icon size={16} /></span>
                          <p>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="stitch-action-foot stitch-cta-stack">
                    <button type="button" className="button light block" onClick={() => router.push(appRoutes.citizenLogin)}>
                      {t.citizenLoginButton}
                    </button>
                    <a href={appRoutes.register} className="button ghost-light block">{t.signupButton}</a>
                  </div>
                </article>

                <article className="stitch-action-card stitch-action-surface">
                  <div className="stitch-action-copy">
                    <p className="eyebrow small">{t.trackEyebrow}</p>
                    <h3>{t.trackTitle}</h3>
                    <p>{t.trackBody}</p>
                  </div>
                  <div className="stitch-action-foot stitch-track-preview">
                    <div className="track-pill">PNPP-2082-04721</div>
                    <div className="stitch-track-mini-panel">
                      <div className="stitch-mini-steps">
                        <div className="stitch-mini-step is-done"><span>1</span><strong>{t.progressFiled}</strong></div>
                        <div className="stitch-mini-step is-done"><span>2</span><strong>{t.progressAssigned}</strong></div>
                        <div className="stitch-mini-step"><span>3</span><strong>{t.progressResolved}</strong></div>
                      </div>
                      <div className="stitch-public-feature-list compact">
                        {trackFeatures.map(({ Icon, label }) => (
                          <div className="stitch-public-feature" key={label}>
                            <span><Icon size={16} /></span>
                            <p>{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <a href={appRoutes.track} className="button primary block">{t.trackNow}</a>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section className="stitch-section stitch-section-soft">
            <div className="container stitch-public-grid">
              <article className="stitch-surface-card">
                <p className="eyebrow small">{t.signupEyebrow}</p>
                <h3>{t.signupTitle}</h3>
                <p className="stitch-card-copy">{t.signupBody}</p>
                <div className="stitch-home-callout">
                  <div className="stitch-public-feature-list stacked">
                    {registerFeatures.map(({ Icon, label }) => (
                      <div className="stitch-public-feature" key={label}>
                        <span><Icon size={16} /></span>
                        <p>{label}</p>
                      </div>
                    ))}
                  </div>
                  <a href={appRoutes.register} className="button secondary block">{t.signupButton}</a>
                </div>
              </article>

              <article className="stitch-surface-card">
                <p className="eyebrow small">{t.livePulse}</p>
                <h3>{t.authorityTitle}</h3>
                <p className="stitch-card-copy">{t.authorityBody}</p>
                <div className="stitch-live-grid">
                  {liveSignals.map(({ Icon, label, value }) => (
                    <div className="stitch-live-card" key={label}>
                      <span><Icon size={18} /></span>
                      <strong>{value}</strong>
                      <p>{label}</p>
                    </div>
                  ))}
                </div>
                <p className="eyebrow small top-gap">{t.serviceLoad}</p>
                <div className="stitch-department-grid">
                  {authoritySignals.map((department, index) => {
                    const Icon = authorityIcons[index % authorityIcons.length];
                    return (
                    <div className="stitch-department-tile" key={`${department.label}-${index}`}>
                      <div className="stitch-department-dot"><Icon size={16} /></div>
                      <div className="stitch-department-copy">
                        <strong>{department.label}</strong>
                        <span className="stitch-department-count">
                          {department.count === null ? (language === "ne" ? "सेवा विवरण" : "Service desk") : `${department.count} ${language === "ne" ? "गुनासो" : "complaints"}`}
                        </span>
                        <span className="stitch-department-link">{t.authorityMore}</span>
                      </div>
                    </div>
                  );})}
                </div>
                <div className="stitch-admin-card">
                  <div>
                    <p className="eyebrow small">{t.adminCardTitle}</p>
                    <h4>{t.adminCardTitle}</h4>
                    <p>{t.adminCardBody}</p>
                  </div>
                  <div className="stitch-admin-actions">
                    <a href={appRoutes.departmentLogin} className="button dark">{t.adminCardPrimary}</a>
                    <a href={appRoutes.adminLogin} className="button secondary-outline">{t.adminCardSecondary}</a>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </main>

        <footer className="stitch-footer">
          <div className="container stitch-footer-inner">
            <div className="stitch-footer-brand">
              <img src="/assets/images/nepal-gov-emblem.png" alt="Government of Nepal emblem" />
              <div>
                <strong>PNPP</strong>
                <p>{t.footerText}</p>
              </div>
            </div>
            <div className="stitch-footer-links">
              <a href={appRoutes.home}>{t.footerHome}</a>
              <a href={appRoutes.citizenLogin}>{t.footerCitizenLogin}</a>
              <a href={appRoutes.register}>{t.footerRegister}</a>
              <a href={appRoutes.track}>{t.footerTrack}</a>
              <a href={appRoutes.transparency}>{t.footerTransparency}</a>
              <a href={appRoutes.departmentLogin}>{t.footerDepartment}</a>
              <a href={appRoutes.adminLogin}>{t.footerAdmin}</a>
            </div>
          </div>
        </footer>
        {showComplaintChoice ? (
          <div className="stitch-choice-overlay" role="presentation" onClick={() => setShowComplaintChoice(false)}>
            <div
              className="stitch-choice-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="complaint-choice-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="stitch-choice-close"
                onClick={() => setShowComplaintChoice(false)}
                aria-label={t.complaintChoiceClose}
              >
                <X size={18} />
              </button>
              <div className="stitch-choice-head">
                <p className="eyebrow small">{t.complaintChoiceEyebrow}</p>
                <h3 id="complaint-choice-title">{t.complaintChoiceTitle}</h3>
                <p>{t.complaintChoiceBody}</p>
              </div>
              <div className="stitch-choice-grid">
                <article className="stitch-choice-card">
                  <span className="stitch-choice-icon"><FileText size={18} /></span>
                  <h4>{t.complaintChoiceAnonymousTitle}</h4>
                  <p>{t.complaintChoiceAnonymousBody}</p>
                  <button
                    type="button"
                    className="button primary block"
                    onClick={() => router.push(appRoutes.submitComplaint)}
                  >
                    {t.complaintChoiceAnonymousAction}
                  </button>
                </article>
                <article className="stitch-choice-card">
                  <span className="stitch-choice-icon"><UserRoundPlus size={18} /></span>
                  <h4>{t.complaintChoiceRegisterTitle}</h4>
                  <p>{t.complaintChoiceRegisterBody}</p>
                  <button
                    type="button"
                    className="button secondary block"
                    onClick={() => router.push(`${appRoutes.register}?next=complaint`)}
                  >
                    {t.complaintChoiceRegisterAction}
                  </button>
                </article>
              </div>
            </div>
          </div>
        ) : null}
        <ChatbotWidget initialLanguage={language} />
      </div>
    </>
  );
}
