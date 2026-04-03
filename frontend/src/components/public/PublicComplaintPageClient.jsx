"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileText,
  MapPinned,
  Search,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { LanguageSwitch, PublicTopbar } from "./PublicShell.jsx";
import { ChatbotWidget } from "./ChatbotClient.jsx";
import { LocationMapCard } from "../shared/LocationMapCard.jsx";

const wards = Array.from({ length: 33 }, (_, index) => String(index + 1));

const categories = {
  ne: [
    ["road", "Road Maintenance"],
    ["garbage", "Waste Management"],
    ["water", "Water Supply"],
    ["drainage", "Drainage / Sewer"],
    ["light", "Streetlight / Public Safety"],
    ["health", "Health Services"],
    ["education", "Education"],
    ["legal", "Legal / Dispute"],
    ["other", "Other Municipal Service"],
  ],
  en: [
    ["road", "Road Maintenance"],
    ["garbage", "Waste Management"],
    ["water", "Water Supply"],
    ["drainage", "Drainage / Sewer"],
    ["light", "Streetlight / Public Safety"],
    ["health", "Health Services"],
    ["education", "Education"],
    ["legal", "Legal / Dispute"],
    ["other", "Other Municipal Service"],
  ],
};

const translations = {
  ne: {
    topbarTitle: "गुमनाम गुनासो दर्ता",
    back: "गृहपृष्ठमा फर्कनुहोस्",
    registerLink: "दर्ता गरी पेश गर्नुहोस्",
    trackLink: "गुनासो ट्र्याक",
    title: "गुमनाम रूपमा गुनासो दर्ता गर्नुहोस्",
    subtitle: "खाता बिना पनि महानगरपालिकामा गुनासो दर्ता गर्न सकिन्छ। मानक विवरण, स्थान, र प्रमाण राखेपछि तपाईंले तुरुन्तै ट्र्याकिङ टोकन प्राप्त गर्नुहुन्छ।",
    breadcrumb: "गुमनाम गुनासो",
    secureOne: "खाता बिना",
    secureTwo: "ट्र्याकिङ टोकन",
    stepOne: "विवरण",
    stepTwo: "स्थान",
    stepThree: "प्रमाण",
    stepFour: "ट्र्याक",
    formEyebrow: "प्रत्यक्ष गुनासो दर्ता",
    formTitle: "मानक गुनासो फाराम",
    formBody: "तलको विवरण पूरा भरेपछि गुनासो सम्बन्धित विभाग वा वडामा पठाइन्छ। गुमनाम गुनासोमा तपाईंको नाम वा इमेल दर्ता हुँदैन।",
    anonymousBannerTitle: "पहिचान सुरक्षित रहनेछ",
    anonymousBannerCopy: "यो पृष्ठबाट पठाइने गुनासोमा व्यक्तिगत पहिचान जोडिँदैन। पछि स्थिति हेर्न ट्र्याकिङ टोकन सुरक्षित राख्नुहोस्।",
    fieldCategory: "गुनासोको विभाग/वर्ग",
    fieldTitle: "गुनासोको शीर्षक",
    fieldWard: "वडा नम्बर",
    fieldLocation: "स्थान / ल्यान्डमार्क",
    fieldSubcategory: "विशिष्ट समस्या",
    fieldArea: "क्षेत्र / टोल",
    fieldDescription: "गुनासोको पूर्ण विवरण",
    fieldLandmark: "नजिकको ल्यान्डमार्क",
    fieldUrgency: "जरुरीपन",
    fieldMedia: "फोटो / कागजात संलग्न गर्नुहोस्",
    urgencyHigh: "उच्च",
    urgencyMedium: "मध्यम",
    urgencyLow: "न्यून",
    captureGps: "GPS लिनुहोस्",
    submit: "गुमनाम गुनासो दर्ता गर्नुहोस्",
    submitting: "दर्ता हुँदैछ...",
    requiredError: "शीर्षक, विभाग, स्थान, र विवरण आवश्यक छन्।",
    submitSuccess: "गुमनाम गुनासो सफलतापूर्वक दर्ता भयो।",
    submitFailed: "गुनासो दर्ता गर्न सकिएन।",
    gpsSuccess: "GPS स्थान प्राप्त भयो।",
    gpsFailed: "GPS प्राप्त गर्न सकिएन।",
    mapPreviewTitle: "स्थान पूर्वावलोकन",
    sideEyebrow: "नागरिक विकल्प",
    sideTitle: "खाता दर्ता गर्न चाहनुहुन्छ?",
    sideBody: "यदि तपाईं आफ्नै ड्यासबोर्ड, इतिहास, र भविष्यका गुनासोहरू प्रोफाइलसँग जोड्न चाहनुहुन्छ भने नागरिक खाता बनाउनुहोस्।",
    sideBenefitOne: "गुमनाम टोकन पनि छुट्टै बनाउन सकिने",
    sideBenefitTwo: "समाधान इतिहास र प्रोफाइल पहुँच",
    sideBenefitThree: "लगइनपछि नयाँ गुनासो फाराममा सीधा प्रवेश",
    sideRegister: "दर्ता गरी जारी राख्नुहोस्",
    sideTrack: "अवस्थित गुनासो ट्र्याक",
    resultEyebrow: "गुनासो दर्ता भयो",
    resultTitle: "ट्र्याकिङ टोकन सुरक्षित राख्नुहोस्",
    resultBody: "यो टोकन वा गुनासो नम्बर प्रयोग गरेर तपाईंले लगइन बिना पनि स्थिति हेर्न सक्नुहुन्छ।",
    resultPrimaryToken: "गोप्य ट्र्याकिङ टोकन",
    resultComplaintId: "गुनासो नम्बर",
    resultAssigned: "तोकिएको कार्यालय",
    resultStatus: "हालको स्थिति",
    resultTrack: "स्थिति ट्र्याक",
    resultAgain: "अर्को गुनासो दर्ता",
  },
  en: {
    topbarTitle: "Anonymous Complaint Filing",
    back: "Back to home",
    registerLink: "Register & Submit",
    trackLink: "Track Complaint",
    title: "Submit a complaint anonymously",
    subtitle: "You can register a municipal complaint without creating an account. Once the standard details, location, and evidence are added, you receive a tracking token immediately.",
    breadcrumb: "Anonymous Filing",
    secureOne: "No account required",
    secureTwo: "Tracking token issued",
    stepOne: "Details",
    stepTwo: "Location",
    stepThree: "Evidence",
    stepFour: "Tracking",
    formEyebrow: "Direct complaint filing",
    formTitle: "Standard complaint form",
    formBody: "Complete the standard complaint details below and the system will route the case to the relevant department or ward. This anonymous flow does not store your name or email.",
    anonymousBannerTitle: "Your identity stays private",
    anonymousBannerCopy: "Complaints filed from this page are not linked to a citizen profile. Save the tracking token carefully to follow progress later.",
    fieldCategory: "Complaint department/category",
    fieldTitle: "Complaint title",
    fieldWard: "Ward number",
    fieldLocation: "Location / landmark",
    fieldSubcategory: "Specific issue",
    fieldArea: "Area / locality",
    fieldDescription: "Full complaint description",
    fieldLandmark: "Nearest landmark",
    fieldUrgency: "Urgency",
    fieldMedia: "Attach photos / documents",
    urgencyHigh: "High",
    urgencyMedium: "Medium",
    urgencyLow: "Low",
    captureGps: "Capture GPS",
    submit: "Register Anonymous Complaint",
    submitting: "Registering...",
    requiredError: "Title, category, location, and description are required.",
    submitSuccess: "Anonymous complaint registered successfully.",
    submitFailed: "Could not register the complaint.",
    gpsSuccess: "GPS location captured.",
    gpsFailed: "Could not access GPS.",
    mapPreviewTitle: "Location Preview",
    sideEyebrow: "Citizen option",
    sideTitle: "Prefer to register first?",
    sideBody: "Create a citizen account if you want a personal dashboard, history, and future complaints linked to your profile.",
    sideBenefitOne: "Optional anonymous citizen code",
    sideBenefitTwo: "Complaint history and profile access",
    sideBenefitThree: "Direct access to the logged-in complaint form after signup",
    sideRegister: "Register and continue",
    sideTrack: "Track an existing complaint",
    resultEyebrow: "Complaint registered",
    resultTitle: "Keep this tracking token safe",
    resultBody: "Use this token or the complaint number to follow progress later without signing in.",
    resultPrimaryToken: "Anonymous Tracking Token",
    resultComplaintId: "Complaint ID",
    resultAssigned: "Assigned office",
    resultStatus: "Current status",
    resultTrack: "Track Status",
    resultAgain: "Submit Another",
  },
};

function createInitialForm() {
  return {
    category: categories.en[0][0],
    title: "",
    wardNumber: "1",
    locationText: "",
    locationCoordinates: null,
    subcategory: "",
    areaName: "",
    description: "",
    nearestLandmark: "",
    priority: "high",
  };
}

function readAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: String(reader.result || ""),
      });
    };
    reader.readAsDataURL(file);
  });
}

function formatStatusLabel(status) {
  return String(status || "pending").replaceAll("_", " ");
}

export function PublicComplaintPageClient() {
  const [language, setLanguage] = useState("en");
  const [form, setForm] = useState(createInitialForm);
  const [attachments, setAttachments] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [resultCard, setResultCard] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  async function handleFilesChange(event) {
    const files = [...(event.target.files || [])].slice(0, 5);
    const payloads = await Promise.all(files.map(readAsDataUrl));
    setAttachments(payloads);
  }

  function handleCaptureGps() {
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: t.gpsFailed });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((prev) => ({
          ...prev,
          locationText: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          locationCoordinates: {
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6)),
          },
        }));
        setMessage({ type: "success", text: t.gpsSuccess });
      },
      () => {
        setMessage({ type: "error", text: t.gpsFailed });
      },
    );
  }

  async function handleSubmitComplaint() {
    if (isSubmitting) return;

    const payload = {
      title: form.title.trim(),
      category: form.category,
      wardNumber: form.wardNumber,
      ward_number: form.wardNumber,
      locationText: form.locationText.trim(),
      location: form.locationText.trim(),
      subcategory: form.subcategory.trim(),
      areaName: form.areaName.trim(),
      description: form.description.trim(),
      nearestLandmark: form.nearestLandmark.trim(),
      priority: form.priority,
      locationCoordinates: form.locationCoordinates,
      proofImage: attachments.find((file) => file.mimeType.startsWith("image/")) || null,
      attachments,
    };

    if (!payload.title || !payload.category || !payload.locationText || !payload.description) {
      setMessage({ type: "error", text: t.requiredError });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${apiBase}/api/complaints/anonymous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.message || t.submitFailed });
        return;
      }

      setMessage({ type: "success", text: t.submitSuccess });
      setResultCard({
        complaint: result.complaint,
        anonymousTrackingToken: result.anonymousTrackingToken || null,
      });
      setForm(createInitialForm());
      setAttachments([]);
    } catch {
      setMessage({ type: "error", text: t.submitFailed });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setResultCard(null);
    setMessage({ type: "", text: "" });
    setForm(createInitialForm());
    setAttachments([]);
  }

  const primaryTrackingId = resultCard?.anonymousTrackingToken || resultCard?.complaint?.tokenNumber || "";

  return (
    <>
      <BodyConfig />
      <PublicTopbar title={t.topbarTitle}>
        <a href={appRoutes.home} className="track-link">{t.back}</a>
        <a href={`${appRoutes.register}?next=complaint`} className="track-link">{t.registerLink}</a>
        <a href={appRoutes.track} className="track-link">{t.trackLink}</a>
        <LanguageSwitch currentLanguage={language} onChange={setLanguage} />
      </PublicTopbar>

      <main className="stitch-form-page stitch-complaint-page">
        <section className="stitch-form-hero stitch-complaint-hero">
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

            <div className="stitch-register-grid stitch-complaint-grid">
              <article className="stitch-surface-card stitch-register-form-card stitch-complaint-form-card">
                {resultCard ? (
                  <div className="stitch-complaint-success">
                    <div className="stitch-complaint-success-icon" aria-hidden="true">
                      <CheckCircle2 size={36} />
                    </div>
                    <p className="eyebrow small">{t.resultEyebrow}</p>
                    <h3>{t.resultTitle}</h3>
                    <p className="stitch-card-copy">{t.resultBody}</p>
                    <div className="stitch-complaint-token-card">
                      <span>{t.resultPrimaryToken}</span>
                      <strong>{primaryTrackingId}</strong>
                    </div>
                    <div className="stitch-complaint-result-meta">
                      <p><strong>{t.resultComplaintId}:</strong> {resultCard.complaint?.tokenNumber || "-"}</p>
                      <p><strong>{t.resultAssigned}:</strong> {resultCard.complaint?.assignedOfficeLabel || "-"}</p>
                      <p><strong>{t.resultStatus}:</strong> {formatStatusLabel(resultCard.complaint?.status)}</p>
                    </div>
                    <div className="stitch-complaint-success-actions">
                      <a href={`${appRoutes.track}?query=${encodeURIComponent(primaryTrackingId)}`} className="button primary">
                        {t.resultTrack}
                      </a>
                      <button type="button" className="button secondary-outline" onClick={handleReset}>
                        {t.resultAgain}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                    <div className="citizen-inline-banner stitch-complaint-inline-banner">
                      <div>
                        <strong>{t.anonymousBannerTitle}</strong>
                        <p>{t.anonymousBannerCopy}</p>
                      </div>
                    </div>
                    <form className="auth-form complaint-form-grid citizen-complaint-form" onSubmit={(event) => event.preventDefault()}>
                      <div className="citizen-form-card">
                        <div className="grid two-col citizen-form-grid">
                          <label>
                            <span>{t.fieldCategory}</span>
                            <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
                              {categories[language].map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>{t.fieldTitle}</span>
                            <input
                              type="text"
                              value={form.title}
                              placeholder={language === "ne" ? "छोटो शीर्षक दिनुहोस्" : "Give a short title"}
                              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                            />
                          </label>
                        </div>

                        <div className="grid two-col citizen-form-grid">
                          <label>
                            <span>{t.fieldWard}</span>
                            <select value={form.wardNumber} onChange={(event) => setForm((prev) => ({ ...prev, wardNumber: event.target.value }))}>
                              {wards.map((ward) => (
                                <option key={ward} value={ward}>{language === "ne" ? `वडा ${ward}` : `Ward ${ward}`}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>{t.fieldLocation}</span>
                            <input
                              type="text"
                              value={form.locationText}
                              placeholder={language === "ne" ? "GPS वा स्थान विवरण" : "GPS or location detail"}
                              onChange={(event) => setForm((prev) => ({
                                ...prev,
                                locationText: event.target.value,
                                locationCoordinates: null,
                              }))}
                            />
                          </label>
                        </div>

                        <div className="grid two-col citizen-form-grid">
                          <label>
                            <span>{t.fieldSubcategory}</span>
                            <input
                              type="text"
                              value={form.subcategory}
                              placeholder={language === "ne" ? "जस्तै: खाल्डो, ढल अवरोध" : "For example: pothole, blocked drain"}
                              onChange={(event) => setForm((prev) => ({ ...prev, subcategory: event.target.value }))}
                            />
                          </label>
                          <label>
                            <span>{t.fieldArea}</span>
                            <input
                              type="text"
                              value={form.areaName}
                              placeholder={language === "ne" ? "क्षेत्र वा टोल" : "Area or locality"}
                              onChange={(event) => setForm((prev) => ({ ...prev, areaName: event.target.value }))}
                            />
                          </label>
                        </div>

                        <label>
                          <span>{t.fieldDescription}</span>
                          <textarea
                            value={form.description}
                            placeholder={language === "ne" ? "समस्याको विस्तृत विवरण लेख्नुहोस्" : "Write the full problem description"}
                            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                          ></textarea>
                        </label>

                        <div className="grid two-col citizen-form-grid">
                          <label>
                            <span>{t.fieldLandmark}</span>
                            <input
                              type="text"
                              value={form.nearestLandmark}
                              placeholder={language === "ne" ? "नजिकको चिनारी" : "Nearby landmark"}
                              onChange={(event) => setForm((prev) => ({ ...prev, nearestLandmark: event.target.value }))}
                            />
                          </label>
                          <label>
                            <span>{t.fieldUrgency}</span>
                            <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
                              <option value="high">{t.urgencyHigh}</option>
                              <option value="medium">{t.urgencyMedium}</option>
                              <option value="low">{t.urgencyLow}</option>
                            </select>
                          </label>
                        </div>

                        <div className="grid two-col citizen-form-grid">
                          <button type="button" className="button secondary" onClick={handleCaptureGps}>{t.captureGps}</button>
                          <div className="stitch-complaint-placeholder-card">
                            <FileText size={16} />
                            <span>{language === "ne" ? "प्रमाण र स्थानको विवरणले दर्ता छिटो हुन्छ।" : "Evidence and clear location details speed up registration."}</span>
                          </div>
                        </div>

                        {form.locationText ? (
                          <LocationMapCard
                            className="top-gap"
                            title={t.mapPreviewTitle}
                            language={language}
                            locationText={form.locationText}
                            locationCoordinates={form.locationCoordinates}
                            wardNumber={form.wardNumber}
                          />
                        ) : null}

                        <label className="citizen-file-input-wrap">
                          <span>{t.fieldMedia}</span>
                          <input className="citizen-file-input" type="file" accept="image/*,.pdf" multiple onChange={handleFilesChange} />
                        </label>
                        <div className="attachment-preview-list">
                          {attachments.map((file) => (
                            <span className="department-guidance-chip" key={file.name}>{file.name}</span>
                          ))}
                        </div>
                      </div>

                      <div className="action-strip citizen-form-actions">
                        <button type="button" className="button dark" onClick={handleSubmitComplaint} disabled={isSubmitting}>
                          {isSubmitting ? t.submitting : t.submit}
                        </button>
                      </div>
                    </form>
                    {message.text ? <div className={`form-message ${message.type}`}>{message.text}</div> : null}
                  </>
                )}
              </article>

              <article className="stitch-register-benefits">
                <div className="stitch-surface-card stitch-register-benefit-card stitch-complaint-benefit-card">
                  <div className="stitch-register-benefit-top">
                    <div className="stitch-register-seal government-emblem">
                      <img src="/assets/images/nepal-gov-emblem.png" alt="Government of Nepal emblem" />
                    </div>
                    <div>
                      <p className="eyebrow small">{t.sideEyebrow}</p>
                      <h3>{t.sideTitle}</h3>
                      <p className="stitch-card-copy">{t.sideBody}</p>
                    </div>
                  </div>

                  <div className="stitch-register-benefit-pills">
                    <span>{t.secureOne}</span>
                    <span>{t.secureTwo}</span>
                  </div>

                  <div className="stitch-benefit-list">
                    <div>
                      <span><ShieldCheck size={14} /></span>
                      <p>{t.sideBenefitOne}</p>
                    </div>
                    <div>
                      <span><MapPinned size={14} /></span>
                      <p>{t.sideBenefitTwo}</p>
                    </div>
                    <div>
                      <span><FileText size={14} /></span>
                      <p>{t.sideBenefitThree}</p>
                    </div>
                  </div>

                  <div className="stitch-complaint-side-actions">
                    <a href={`${appRoutes.register}?next=complaint`} className="button primary block">
                      <UserRoundPlus size={16} />
                      {t.sideRegister}
                    </a>
                    <a href={appRoutes.track} className="button secondary-outline block">
                      <Search size={16} />
                      {t.sideTrack}
                    </a>
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
