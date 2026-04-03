"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Building2, Clock3, FileText, MapPinned, Route } from "lucide-react";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { LanguageSwitch, PublicTopbar } from "./PublicShell.jsx";
import { ChatbotWidget } from "./ChatbotClient.jsx";
import { LocationMapCard } from "../shared/LocationMapCard.jsx";

const translations = {
  ne: {
    topbarTitle: "गुनासो ट्र्याक",
    back: "गृहपृष्ठमा फर्कनुहोस्",
    transparency: "पारदर्शिता",
    pageTitle: "गुनासो ट्र्याक गर्नुहोस्",
    pageSubtitle: "ट्र्याकिङ नम्बर, गोप्य कोड, इमेल, वा मोबाइल नम्बर प्रयोग गरेर वर्तमान प्रगति हेर्नुहोस्।",
    queryLabel: "गुनासो नम्बर, गोप्य कोड, इमेल वा मोबाइल",
    search: "खोज्नुहोस्",
    statusPrefix: "हालको स्थिति",
    notFound: "गुनासो भेटिएन।",
    details: "गुनासो विवरण",
    updates: "स्थिति अपडेट",
    location: "स्थान",
    ward: "वडा",
    currentOffice: "कार्यालय",
    citizen: "नागरिक",
    attachments: "संलग्न फाइलहरू",
    lastUpdated: "अन्तिम अद्यावधिक",
    progressTitle: "प्रगति मार्ग",
    resolutionTarget: "अपेक्षित समाधान",
    attachmentsCount: "संलग्न संख्या",
    registerLink: "दर्ता",
    placeholder: "PNPP-2082-04721, गोप्य कोड, name@example.com वा 98XXXXXXXX",
  },
  en: {
    topbarTitle: "Track Complaint",
    back: "Back to home",
    transparency: "Transparency",
    pageTitle: "Track Your Complaint",
    pageSubtitle: "Use a tracking ID, anonymous code, email, or mobile number to view the current complaint progress.",
    queryLabel: "Complaint ID, anonymous code, email, or mobile",
    search: "Search",
    statusPrefix: "Current status",
    notFound: "Complaint not found.",
    details: "Complaint Details",
    updates: "Status Updates",
    location: "Location",
    ward: "Ward",
    currentOffice: "Current Office",
    citizen: "Citizen",
    attachments: "Attachments",
    lastUpdated: "Last Updated",
    progressTitle: "Progress Path",
    resolutionTarget: "Resolution Target",
    attachmentsCount: "Attachments",
    registerLink: "Register",
    placeholder: "PNPP-2082-04721, anonymous code, name@example.com, or 98XXXXXXXX",
  },
};

const defaultTimeline = {
  ne: [
    ["दर्ता भयो", "गुनासो प्रणालीमा दर्ता गरियो।"],
    ["स्वीकृत", "सम्बन्धित कार्यालयले गुनासो प्राप्त गर्यो।"],
    ["कार्यमा", "समाधानको कार्य अगाडि बढिरहेको छ।"],
  ],
  en: [
    ["Submitted", "The complaint was registered in the system."],
    ["Acknowledged", "The responsible office received the complaint."],
    ["In Progress", "Resolution work is currently underway."],
  ],
};

function getComplaintProgress(status, language) {
  const labels = language === "ne"
    ? ["दर्ता", "कार्यालयमा पुग्यो", "समाधान"]
    : ["Submitted", "Assigned", "Resolved"];
  const indexMap = {
    pending: 0,
    forwarded: 1,
    escalated: 1,
    in_progress: 1,
    delayed: 1,
    solved: 2,
    closed_invalid: 2,
    cannot_solve: 2,
  };
  const activeIndex = indexMap[status] ?? 0;
  return labels.map((label, index) => ({
    label,
    done: index < activeIndex,
    current: index === activeIndex,
  }));
}

function getComplaintProgressValue(status) {
  if (status === "solved" || status === "closed_invalid" || status === "cannot_solve") return 100;
  if (status === "in_progress" || status === "forwarded" || status === "escalated" || status === "delayed") return 68;
  return 28;
}

function formatStatusLabel(status) {
  return String(status || "pending").replaceAll("_", " ");
}

export function TrackPageClient({ initialQuery = "" }) {
  const [language, setLanguage] = useState("en");
  const [trackQuery, setTrackQuery] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [complaint, setComplaint] = useState(null);

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const timeline = useMemo(() => {
    if (!complaint?.history?.length) return defaultTimeline[language];
    return complaint.history.map((entry) => [entry.action, entry.note || entry.message || ""]);
  }, [complaint, language]);
  const progressSteps = useMemo(
    () => getComplaintProgress(complaint?.status, language),
    [complaint?.status, language],
  );
  const progressValue = useMemo(
    () => getComplaintProgressValue(complaint?.status),
    [complaint?.status],
  );
  const presetQuery = String(initialQuery || "").trim();

  useEffect(() => {
    if (!presetQuery) return;
    setTrackQuery(presetQuery);
    void handleTrack(presetQuery);
  }, [presetQuery]);

  async function handleTrack(nextQuery = trackQuery) {
    setMessage({ type: "", text: "" });
    const query = String(nextQuery || "").trim();
    if (!query) {
      setMessage({ type: "error", text: t.notFound });
      setComplaint(null);
      return;
    }
    try {
      const response = await fetch(`${apiBase}/api/complaints/track?query=${encodeURIComponent(query)}`);
      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: result.message || t.notFound });
        setComplaint(null);
        return;
      }
      setComplaint(result.complaint);
      setMessage({ type: "success", text: result.complaint?.tokenNumber || "" });
    } catch {
      setMessage({ type: "error", text: t.notFound });
      setComplaint(null);
    }
  }

  return (
    <>
      <BodyConfig />
      <PublicTopbar title={t.topbarTitle}>
        <a href={appRoutes.home} className="track-link">{t.back}</a>
        <a href={appRoutes.transparency} className="track-link">{t.transparency}</a>
        <a href={appRoutes.register} className="track-link">{t.registerLink}</a>
        <LanguageSwitch currentLanguage={language} onChange={setLanguage} />
      </PublicTopbar>

      <main className="stitch-track-page">
        <section className="stitch-track-hero">
          <div className="container stitch-track-hero-inner">
            <h1>{t.pageTitle}</h1>
            <p>{t.pageSubtitle}</p>
            <div className="stitch-track-searchbar">
              <input
                type="text"
                value={trackQuery}
                placeholder={t.placeholder}
                onChange={(event) => setTrackQuery(event.target.value)}
              />
              <button type="button" className="button dark" onClick={handleTrack}>{t.search}</button>
            </div>
            {message.text ? <div className={`form-message ${message.type}`}>{message.text}</div> : null}
          </div>
        </section>

        <section className="stitch-section">
          <div className="container stitch-track-layout">
            <div className="stitch-track-sidebar">
              <div className="stitch-surface-card track-status-card">
                <p className="eyebrow small">{t.progressTitle}</p>
                <div className="track-pill">
                  {t.statusPrefix}: {formatStatusLabel(complaint?.status || "pending")}
                </div>
                <div className="complaint-progress-bar">
                  <div className="complaint-progress-fill" style={{ width: `${progressValue}%` }} />
                </div>
                <div className="complaint-stage-strip compact">
                  {progressSteps.map((step, index) => (
                    <div className={`complaint-stage ${step.done ? "is-done" : ""} ${step.current ? "is-current" : ""}`} key={`${step.label}-${index}`}>
                      <span>{index + 1}</span>
                      <strong>{step.label}</strong>
                    </div>
                  ))}
                </div>
                <div className="status-mini-grid top-gap">
                  <div className="status-mini-card">
                    <span><Building2 size={16} /></span>
                    <strong>{complaint?.assignedOfficeLabel || "-"}</strong>
                    <p>{t.currentOffice}</p>
                  </div>
                  <div className="status-mini-card">
                    <span><Clock3 size={16} /></span>
                    <strong>{complaint?.estimatedCompletionAt ? new Date(complaint.estimatedCompletionAt).toLocaleDateString(language === "ne" ? "ne-NP" : "en-US") : "-"}</strong>
                    <p>{t.resolutionTarget}</p>
                  </div>
                  <div className="status-mini-card">
                    <span><Activity size={16} /></span>
                    <strong>{complaint?.updatedAt ? new Date(complaint.updatedAt).toLocaleDateString(language === "ne" ? "ne-NP" : "en-US") : "-"}</strong>
                    <p>{t.lastUpdated}</p>
                  </div>
                  <div className="status-mini-card">
                    <span><FileText size={16} /></span>
                    <strong>{complaint?.attachments?.length || 0}</strong>
                    <p>{t.attachmentsCount}</p>
                  </div>
                </div>
              </div>
              <div className="stitch-track-timeline-card">
                <h3>{t.updates}</h3>
                <div className="timeline">
                  {timeline.map(([title, copy], index) => (
                    <article className="timeline-item" key={`${title}-${index}`}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-copy">
                        <strong>{title}</strong>
                        <p>{copy}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="stitch-track-detail">
              <article className="stitch-surface-card">
                <p className="eyebrow small">{t.details}</p>
                <h3>{complaint?.title || complaint?.subcategory || complaint?.category || t.details}</h3>
                <p className="stitch-card-copy">{complaint?.description || t.pageSubtitle}</p>
                <div className="stitch-detail-grid">
                  <div>
                    <span>{t.location}</span>
                    <strong>{complaint?.locationText || "-"}</strong>
                  </div>
                  <div>
                    <span>{t.ward}</span>
                    <strong>{complaint?.wardNumber || "-"}</strong>
                  </div>
                  <div>
                    <span>{t.currentOffice}</span>
                    <strong>{complaint?.assignedOfficeLabel || "-"}</strong>
                  </div>
                  <div>
                    <span>{t.citizen}</span>
                    <strong>{complaint?.citizenName || "-"}</strong>
                  </div>
                </div>
                {complaint?.locationText ? (
                  <LocationMapCard
                    className="top-gap"
                    language={language}
                    locationText={complaint.locationText}
                    locationCoordinates={complaint.locationCoordinates}
                    wardNumber={complaint.wardNumber}
                  />
                ) : null}
                <div className="stitch-public-feature-list stacked top-gap">
                  <div className="stitch-public-feature">
                    <span><MapPinned size={16} /></span>
                    <p>{complaint?.locationText || "-"}</p>
                  </div>
                  <div className="stitch-public-feature">
                    <span><Route size={16} /></span>
                    <p>{complaint?.assignedOfficeLabel || "-"}</p>
                  </div>
                </div>

                <div className="stitch-track-attachments">
                  <p className="eyebrow small">{t.attachments}</p>
                  {complaint?.attachments?.length ? (
                    <div className="stitch-attachment-grid">
                      {complaint.attachments.map((file) => (
                        <a className="stitch-attachment-card" href={file.dataUrl} download={file.name} key={file.name}>
                          <strong>{file.name}</strong>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-list-card"><p>-</p></div>
                  )}
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
