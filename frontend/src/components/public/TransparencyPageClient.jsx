"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Route,
  Search,
  ShieldCheck,
} from "lucide-react";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { LanguageSwitch, PublicTopbar } from "./PublicShell.jsx";
import { ChatbotWidget } from "./ChatbotClient.jsx";
import { LocationMapCard } from "../shared/LocationMapCard.jsx";

const translations = {
  ne: {
    topbarTitle: "सार्वजनिक पारदर्शिता",
    home: "गृहपृष्ठ",
    track: "गुनासो ट्र्याक",
    register: "दर्ता",
    pageTitle: "सार्वजनिक पारदर्शिता ड्यासबोर्ड",
    pageSubtitle: "पोखरा महानगरपालिकाभरि गुनासो कसरी सम्हालिँदैछन् भन्ने कुरा वास्तविक समयमै देखाउने सार्वजनिक उत्तरदायित्व स्क्रिन।",
    trackingHelp: "गुनासो नम्बर वा गोप्य टोकन राखेर विस्तृत प्रगति खोल्नुहोस्।",
    trackingPlaceholder: "PNPP-2082-04721 वा गोप्य टोकन",
    trackingButton: "प्रगति खोल्नुहोस्",
    trackingError: "गुनासो नम्बर वा गोप्य टोकन प्रविष्ट गर्नुहोस्।",
    autoRefresh: "हरेक ४५ सेकेन्डमा अद्यावधिक हुन्छ",
    lastUpdated: "अन्तिम अद्यावधिक",
    summaryEyebrow: "प्रमुख सूचक",
    totalComplaints: "कुल गुनासो",
    resolved: "समाधान",
    inProgress: "प्रगतिमा",
    pending: "पेन्डिङ",
    overdue: "ढिलो भएका",
    performanceEyebrow: "तुलनात्मक कार्यसम्पादन",
    wardPerformanceTitle: "वडा कार्यसम्पादन",
    wardPerformanceBody: "कुन वडा छिटो समाधान गर्दैछ र कुन वडा पछि छ भन्ने कुरा स्पष्ट देखिने गरी।",
    departmentPerformanceTitle: "विभाग कार्यसम्पादन",
    departmentPerformanceBody: "विभागगत समाधान दर, औसत समय, र ढिलो भएका गुनासोको तुलना।",
    leading: "अगाडि रहेका",
    lagging: "सुधार चाहिने",
    totalShort: "कुल",
    avgShort: "औसत",
    overdueShort: "ढिलो",
    daysSuffix: "दिन",
    feedEyebrow: "लाइभ गुनासो फिड",
    feedTitle: "हालैका सार्वजनिक गुनासो",
    feedBody: "व्यक्तिगत विवरण लुकाइएका छन्, तर काम भइरहेको छ भन्ने देखिने गरी पर्याप्त प्रगति देखाइन्छ।",
    feedEmpty: "हाल सार्वजनिक फिडका लागि गुनासो उपलब्ध छैन।",
    privacyNote: "यो फिडले व्यक्तिगत र संवेदनशील विवरण प्रदर्शन गर्दैन।",
    hotspotEyebrow: "हटस्पट नक्सा",
    hotspotTitle: "क्षेत्रगत गुनासो घनत्व",
    hotspotBody: "धेरै गुनासो आएका वडा र क्षेत्र पहिचान गरी सफाइ, पूर्वाधार, वा सेवा समस्याका हटस्पट देखाइन्छ।",
    hotspotListTitle: "शीर्ष हटस्पट",
    slaEyebrow: "SLA निगरानी",
    slaTitle: "दृश्य विलम्ब र उत्तरदायित्व",
    slaBody: "समयमै प्रतिक्रिया, समयसीमाभित्र समाधान, र ढिलाइका कारण बढेका मुद्दा सार्वजनिक रूपमा देखाइन्छ।",
    firstResponseRate: "समयमै पहिलो प्रतिक्रिया",
    resolvedWithinTarget: "समयसीमाभित्र समाधान",
    escalatedDelayed: "ढिलाइ वा एस्केलेट",
    overdueOpen: "खुला ओभरड्यु",
    trackedCases: "ट्र्याक भएका मुद्दा",
    wardLabel: "वडा",
    submittedLabel: "दर्ता भएको",
    noPerformance: "अहिलेसम्म कार्यसम्पादन डेटा छैन।",
  },
  en: {
    topbarTitle: "Public Transparency",
    home: "Home",
    track: "Track Complaint",
    register: "Register",
    pageTitle: "Public Transparency Dashboard",
    pageSubtitle: "A real-time public accountability screen showing how complaints are being handled across Pokhara Metropolitan City.",
    trackingHelp: "Enter a complaint ID or anonymous token to open full progress details.",
    trackingPlaceholder: "PNPP-2082-04721 or anonymous token",
    trackingButton: "Open progress",
    trackingError: "Enter a complaint ID or anonymous token.",
    autoRefresh: "Refreshes every 45 seconds",
    lastUpdated: "Last updated",
    summaryEyebrow: "Key Summary Metrics",
    totalComplaints: "Total complaints",
    resolved: "Resolved",
    inProgress: "In progress",
    pending: "Pending",
    overdue: "Overdue",
    performanceEyebrow: "Visible Comparison",
    wardPerformanceTitle: "Ward performance",
    wardPerformanceBody: "See which wards are resolving quickly and which ones are falling behind.",
    departmentPerformanceTitle: "Department performance",
    departmentPerformanceBody: "Compare department resolution rates, average time, and overdue workload.",
    leading: "Leading",
    lagging: "Needs attention",
    totalShort: "Total",
    avgShort: "Avg",
    overdueShort: "Overdue",
    daysSuffix: "days",
    feedEyebrow: "Live Complaint Feed",
    feedTitle: "Recent public complaints",
    feedBody: "Personal details stay hidden, but the flow remains visible so citizens can see that complaints are being processed.",
    feedEmpty: "No public complaints are available right now.",
    privacyNote: "This feed hides personal and sensitive details.",
    hotspotEyebrow: "Hotspot Map",
    hotspotTitle: "Complaint density by area",
    hotspotBody: "See which wards and local areas are drawing repeated sanitation, infrastructure, and service complaints.",
    hotspotListTitle: "Top hotspots",
    slaEyebrow: "SLA Compliance",
    slaTitle: "Visible delays and escalation",
    slaBody: "On-time response, on-target resolution, and delay-driven escalation stay measurable and public.",
    firstResponseRate: "On-time first response",
    resolvedWithinTarget: "Resolved within target",
    escalatedDelayed: "Escalated or delayed",
    overdueOpen: "Open overdue",
    trackedCases: "tracked cases",
    wardLabel: "Ward",
    submittedLabel: "Submitted",
    noPerformance: "No performance data is available yet.",
  },
};

const defaultOverview = {
  totals: {
    complaints: 0,
    resolved: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
  },
  sla: {
    firstResponseRate: 0,
    resolvedWithinTarget: 0,
    resolvedWithinTargetRate: 0,
    trackedResolvedCount: 0,
    escalatedOrDelayed: 0,
    overdueOpen: 0,
  },
  performance: {
    wards: [],
    departments: [],
  },
  recentComplaints: [],
  hotspots: {
    wards: [],
    focus: null,
  },
};

const statusLabels = {
  pending: { en: "Pending", ne: "पेन्डिङ" },
  in_progress: { en: "In Progress", ne: "प्रगतिमा" },
  delayed: { en: "Delayed", ne: "ढिलाइ" },
  forwarded: { en: "Forwarded", ne: "फर्वार्ड गरिएको" },
  escalated: { en: "Escalated", ne: "एस्केलेट" },
  solved: { en: "Resolved", ne: "समाधान" },
  pending_admin_verification: { en: "Admin Review", ne: "एडमिन समीक्षा" },
  closed_invalid: { en: "Closed Invalid", ne: "अमान्य बन्द" },
  cannot_solve: { en: "Cannot Solve", ne: "समाधान गर्न सकिएन" },
};

const categoryLabels = {
  road: { en: "Road", ne: "सडक" },
  drainage: { en: "Drainage", ne: "ढल" },
  water: { en: "Water", ne: "पानी" },
  garbage: { en: "Sanitation", ne: "सरसफाइ" },
  light: { en: "Streetlight", ne: "बत्ती" },
  health: { en: "Health", ne: "स्वास्थ्य" },
  education: { en: "Education", ne: "शिक्षा" },
  legal: { en: "Legal", ne: "कानुनी" },
  tax: { en: "Revenue", ne: "राजस्व" },
  job: { en: "Employment", ne: "रोजगार" },
  other: { en: "General", ne: "सामान्य" },
};

function getLocale(language) {
  return language === "ne" ? "ne-NP" : "en-US";
}

function formatCount(value, language) {
  return Number(value || 0).toLocaleString(getLocale(language));
}

function formatStatusLabel(status, language) {
  const label = statusLabels[String(status || "")];
  if (label) return label[language];
  return String(status || "pending").replaceAll("_", " ");
}

function formatCategoryLabel(item, language) {
  const mapped = categoryLabels[String(item?.category || "")];
  if (mapped) return mapped[language];
  return String(item?.categoryLabel || item?.category || "Other");
}

function formatRelativeTime(value, language) {
  const timestamp = new Date(value || 0).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "-";
  const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / (1000 * 60)));
  if (diffMinutes < 60) {
    return language === "ne" ? `${diffMinutes} मिनेट अघि` : `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return language === "ne" ? `${diffHours} घण्टा अघि` : `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return language === "ne" ? `${diffDays} दिन अघि` : `${diffDays}d ago`;
}

function formatDays(value, language, t) {
  if (!Number.isFinite(Number(value))) return "-";
  return `${Number(value || 0).toLocaleString(getLocale(language), { maximumFractionDigits: 1 })} ${t.daysSuffix}`;
}

function getLaggingRows(rows) {
  return [...rows]
    .sort((left, right) => left.resolutionRate - right.resolutionRate || right.overdue - left.overdue || right.total - left.total)
    .slice(0, 4);
}

function RankingList({ rows, language, t }) {
  if (!rows.length) return <p className="stitch-card-copy">{t.noPerformance}</p>;

  return (
    <div className="transparency-ranking-list">
      {rows.map((row, index) => (
        <article className="transparency-ranking-item" key={row.key}>
          <div className="transparency-ranking-head">
            <div className="transparency-ranking-title">
              <span className="transparency-rank-badge">#{index + 1}</span>
              <strong>{row.label}</strong>
            </div>
            <span className="transparency-ranking-rate">{row.resolutionRate}%</span>
          </div>
          <div className="mini-bar-track">
            <div className="mini-bar-fill" style={{ width: `${Math.max(row.resolutionRate, row.total ? 8 : 0)}%` }} />
          </div>
          <div className="transparency-ranking-meta">
            <span>{t.totalShort}: {formatCount(row.total, language)}</span>
            <span>{t.avgShort}: {formatDays(row.averageResolutionDays, language, t)}</span>
            <span>{t.overdueShort}: {formatCount(row.overdue, language)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function TransparencyPageClient() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [overview, setOverview] = useState(defaultOverview);
  const [trackQuery, setTrackQuery] = useState("");
  const [trackError, setTrackError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    let ignore = false;

    async function fetchOverview() {
      try {
        const response = await fetch(`${apiBase}/api/public/overview`);
        const result = await response.json();
        if (!response.ok || ignore) return;
        setOverview(result.overview || defaultOverview);
        setLastUpdatedAt(new Date().toISOString());
      } catch {}
    }

    fetchOverview();
    const intervalId = setInterval(fetchOverview, 45000);
    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, []);

  const summaryCards = useMemo(() => ([
    { value: overview.totals.complaints, label: t.totalComplaints, Icon: FileText },
    { value: overview.totals.resolved, label: t.resolved, Icon: CheckCircle2 },
    { value: overview.totals.inProgress, label: t.inProgress, Icon: Activity },
    { value: overview.totals.pending, label: t.pending, Icon: Clock3 },
    { value: overview.totals.overdue, label: t.overdue, Icon: AlertTriangle },
  ]), [overview.totals, t]);

  const slaCards = useMemo(() => ([
    { value: `${overview.sla.firstResponseRate}%`, label: t.firstResponseRate, Icon: ShieldCheck },
    {
      value: overview.sla.trackedResolvedCount
        ? `${formatCount(overview.sla.resolvedWithinTarget, language)}/${formatCount(overview.sla.trackedResolvedCount, language)}`
        : formatCount(overview.sla.resolvedWithinTarget, language),
      label: t.resolvedWithinTarget,
      Icon: CheckCircle2,
      sublabel: overview.sla.trackedResolvedCount ? `${overview.sla.resolvedWithinTargetRate}% • ${t.trackedCases}` : "",
    },
    { value: formatCount(overview.sla.escalatedOrDelayed, language), label: t.escalatedDelayed, Icon: Route },
    { value: formatCount(overview.sla.overdueOpen, language), label: t.overdueOpen, Icon: AlertTriangle },
  ]), [overview.sla, t, language]);

  const wardLeaders = useMemo(() => overview.performance.wards.slice(0, 4), [overview.performance.wards]);
  const wardLagging = useMemo(() => getLaggingRows(overview.performance.wards), [overview.performance.wards]);
  const departmentLeaders = useMemo(() => overview.performance.departments.slice(0, 4), [overview.performance.departments]);
  const departmentLagging = useMemo(() => getLaggingRows(overview.performance.departments), [overview.performance.departments]);

  function handleTrackOpen() {
    const query = String(trackQuery || "").trim();
    if (!query) {
      setTrackError(t.trackingError);
      return;
    }

    setTrackError("");
    router.push(`${appRoutes.track}?query=${encodeURIComponent(query)}`);
  }

  return (
    <>
      <BodyConfig />
      <PublicTopbar title={t.topbarTitle}>
        <a href={appRoutes.home} className="track-link">{t.home}</a>
        <a href={appRoutes.track} className="track-link">{t.track}</a>
        <a href={appRoutes.register} className="track-link">{t.register}</a>
        <LanguageSwitch currentLanguage={language} onChange={setLanguage} />
      </PublicTopbar>

      <main className="transparency-page">
        <section className="stitch-track-hero transparency-hero">
          <div className="container stitch-track-hero-inner">
            <h1>{t.pageTitle}</h1>
            <p>{t.pageSubtitle}</p>
            <div className="stitch-track-searchbar">
              <input
                type="text"
                value={trackQuery}
                placeholder={t.trackingPlaceholder}
                onChange={(event) => {
                  setTrackQuery(event.target.value);
                  if (trackError) setTrackError("");
                }}
              />
              <button type="button" className="button dark" onClick={handleTrackOpen}>
                <Search size={16} />
                <span>{t.trackingButton}</span>
              </button>
            </div>
            {trackError ? <div className="form-message error">{trackError}</div> : null}
            <div className="transparency-refresh-row">
              <span>{t.trackingHelp}</span>
              <span>
                {t.autoRefresh}
                {lastUpdatedAt ? ` • ${t.lastUpdated}: ${new Date(lastUpdatedAt).toLocaleTimeString(getLocale(language), { hour: "numeric", minute: "2-digit" })}` : ""}
              </span>
            </div>
          </div>
        </section>

        <section className="stitch-metric-band transparency-metric-band">
          <div className="container">
            <div className="transparency-summary-grid">
              {summaryCards.map(({ Icon, label, value }) => (
                <article key={label}>
                  <div className="stitch-metric-head">
                    <span className="stitch-metric-icon"><Icon size={16} /></span>
                  </div>
                  <strong>{formatCount(value, language)}</strong>
                  <span>{label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="stitch-section stitch-section-soft">
          <div className="container transparency-panel-grid">
            <article className="stitch-surface-card">
              <p className="eyebrow small">{t.performanceEyebrow}</p>
              <h3>{t.wardPerformanceTitle}</h3>
              <p className="stitch-card-copy">{t.wardPerformanceBody}</p>
              <div className="transparency-ranking-columns">
                <div>
                  <p className="eyebrow small">{t.leading}</p>
                  <RankingList rows={wardLeaders} language={language} t={t} />
                </div>
                <div>
                  <p className="eyebrow small">{t.lagging}</p>
                  <RankingList rows={wardLagging} language={language} t={t} />
                </div>
              </div>
            </article>

            <article className="stitch-surface-card">
              <p className="eyebrow small">{t.performanceEyebrow}</p>
              <h3>{t.departmentPerformanceTitle}</h3>
              <p className="stitch-card-copy">{t.departmentPerformanceBody}</p>
              <div className="transparency-ranking-columns">
                <div>
                  <p className="eyebrow small">{t.leading}</p>
                  <RankingList rows={departmentLeaders} language={language} t={t} />
                </div>
                <div>
                  <p className="eyebrow small">{t.lagging}</p>
                  <RankingList rows={departmentLagging} language={language} t={t} />
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="stitch-section">
          <div className="container transparency-panel-grid">
            <article className="stitch-surface-card">
              <p className="eyebrow small">{t.feedEyebrow}</p>
              <h3>{t.feedTitle}</h3>
              <p className="stitch-card-copy">{t.feedBody}</p>
              <div className="transparency-feed-list">
                {overview.recentComplaints.length ? overview.recentComplaints.map((item) => (
                  <article className="transparency-feed-item" key={item.tokenNumber}>
                    <div className="transparency-feed-head">
                      <strong>{formatCategoryLabel(item, language)}</strong>
                      <span className={`transparency-chip ${item.overdue ? "is-alert" : ""}`}>
                        {formatStatusLabel(item.status, language)}
                      </span>
                    </div>
                    <div className="transparency-feed-meta">
                      <span>{t.wardLabel} {item.wardNumber || "-"}</span>
                      <span>{t.submittedLabel}: {formatRelativeTime(item.createdAt, language)}</span>
                      <span>{item.assignedOfficeLabel || "-"}</span>
                    </div>
                  </article>
                )) : <p className="stitch-card-copy">{t.feedEmpty}</p>}
              </div>
              <p className="transparency-privacy-note">{t.privacyNote}</p>
            </article>

            <article className="stitch-surface-card">
              <p className="eyebrow small">{t.slaEyebrow}</p>
              <h3>{t.slaTitle}</h3>
              <p className="stitch-card-copy">{t.slaBody}</p>
              <div className="status-mini-grid top-gap">
                {slaCards.map(({ Icon, label, value, sublabel }) => (
                  <div className="status-mini-card" key={label}>
                    <span><Icon size={16} /></span>
                    <strong>{value}</strong>
                    <p>{label}</p>
                    {sublabel ? <small>{sublabel}</small> : null}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="stitch-section stitch-section-soft">
          <div className="container">
            <article className="stitch-surface-card">
              <p className="eyebrow small">{t.hotspotEyebrow}</p>
              <h3>{t.hotspotTitle}</h3>
              <p className="stitch-card-copy">{t.hotspotBody}</p>
              <div className="transparency-hotspot-grid">
                <LocationMapCard
                  title={t.hotspotTitle}
                  locationText={overview.hotspots.focus?.locationText || "Pokhara, Nepal"}
                  locationCoordinates={overview.hotspots.focus?.locationCoordinates || null}
                  wardNumber={overview.hotspots.focus?.wardNumber || ""}
                  language={language}
                />
                <div className="transparency-hotspot-side">
                  <p className="eyebrow small">{t.hotspotListTitle}</p>
                  <div className="transparency-hotspot-list">
                    {overview.hotspots.wards.map((item) => (
                      <article className="transparency-feed-item" key={item.key}>
                        <div className="transparency-feed-head">
                          <strong>{item.label}</strong>
                          <span className="transparency-chip">{formatCount(item.total, language)}</span>
                        </div>
                        <div className="transparency-feed-meta">
                          <span>{t.resolved}: {item.resolutionRate}%</span>
                          <span>{t.overdue}: {formatCount(item.overdue, language)}</span>
                          <span>{formatDays(item.averageResolutionDays, language, t)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
      <ChatbotWidget initialLanguage={language} />
    </>
  );
}
