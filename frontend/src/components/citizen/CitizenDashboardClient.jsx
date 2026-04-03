"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Clock3,
  FileText,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Route,
  Settings,
  Trophy,
  UserRound,
} from "lucide-react";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { LanguageSwitch, PublicTopbar } from "../public/PublicShell.jsx";
import { ChatbotWidget } from "../public/ChatbotClient.jsx";
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
    topTitle: "पोखरा महानगरपालिका नागरिक ड्यासबोर्ड",
    gov: "नेपाल सरकार",
    main: "नागरिक ड्यासबोर्ड",
    sub: "गुनासो दर्ता, ट्र्याकिङ र प्रोफाइल व्यवस्थापन",
    logout: "लगआउट",
    welcome: "स्वागत छ, {name}. यहाँबाट तपाईं नयाँ गुनासो दर्ता गर्न, स्थिति ट्र्याक गर्न, र आफ्नो प्रोफाइल हेर्न सक्नुहुन्छ।",
    registrationNotice: "भविष्यको लगइनका लागि आफ्नो नागरिक कोड सुरक्षित राख्नुहोस्: {code}",
    navDashboard: "ड्यासबोर्ड",
    navFile: "नयाँ गुनासो",
    navComplaints: "मेरो गुनासोहरू",
    navProfile: "प्रोफाइल सेटिङ",
    pointsEyebrow: "पुरस्कार अंक",
    pointsCopy: "वैध र समाधान भएका गुनासोबाट प्राप्त अंक",
    recentComplaintsEyebrow: "हालका गुनासो",
    recentComplaintsTitle: "पछिल्ला ५ गुनासो",
    fileButton: "File a Complaint",
    dashboardPointsEyebrow: "Reward history",
    dashboardPointsTitle: "अंक इतिहास",
    dashboardTotal: "कुल दर्ता",
    dashboardResolved: "समाधान",
    dashboardProgress: "प्रगतिमा",
    dashboardReview: "समीक्षाधीन",
    noRecent: "हाल कुनै हालको गुनासो छैन।",
    noPoints: "अहिलेसम्म अंक इतिहास छैन।",
    wizardEyebrow: "गुनासो दर्ता",
    wizardTitle: "चरणगत रूपमा गुनासो पेश गर्नुहोस्",
    wizardStep: "चरण १ / ४",
    stepAccount: "खाता",
    stepDetails: "विवरण",
    stepReview: "पुनरावलोकन",
    anonymousBannerTitle: "गुमनाम रूपमा दर्ता गर्नुहोस्",
    anonymousBannerCopy: "अन गर्दा अधिकारीलाई तपाईंको नाम र सम्पर्क विवरण देखाइँदैन।",
    anonymousWarningTitle: "गुमनाम गुनासो सूचना",
    anonymousWarningCopy: "यस गुनासोसँग तपाईंको नाम, मोबाइल नम्बर, वा नागरिक कोड जोडिने छैन। सुरक्षा वा गोपनीयता महत्वपूर्ण हुँदा मात्र यो विकल्प रोज्नुहोस्।",
    anonymousRewardWarning: "गुमनाम गुनासोमा कुनै पुरस्कार अंक, नगद, वा सार्वजनिक मान्यता दिइँदैन।",
    anonymousTrackingNotice: "यो गुनासो तपाईंको प्रोफाइलमा रहँदैन। पछि हेर्न ट्र्याकिङ कोड सुरक्षित राख्नुहोस्।",
    complainantEyebrow: "व्यक्तिगत विवरण",
    complainantTitle: "आधारभूत नागरिक जानकारी",
    complaintInfoEyebrow: "गुनासोको विवरण",
    complaintInfoTitle: "समस्या दर्ता जानकारी",
    fieldContactName: "पूरा नाम",
    fieldContactPhone: "सम्पर्क नम्बर",
    fieldContactEmail: "इमेल ठेगाना",
    fieldCategory: "गुनासोको विभाग/वर्ग",
    fieldTitle: "गुनासोको शीर्षक",
    fieldWard: "वडा नम्बर",
    fieldLocation: "स्थान / ल्यान्डमार्क",
    fieldSubcategory: "विशिष्ट समस्या",
    fieldArea: "क्षेत्र / टोल",
    fieldDescription: "गुनासोको पूर्ण विवरण",
    fieldLandmark: "नजिकको ल्यान्डमार्क",
    fieldUrgency: "जरुरीपन",
    fieldContactOptIn: "अपडेटका लागि सम्पर्क राख्ने?",
    fieldMedia: "फोटो / कागजात संलग्न गर्नुहोस्",
    urgencyHigh: "उच्च",
    urgencyMedium: "मध्यम",
    urgencyLow: "न्यून",
    yes: "हो",
    no: "होइन",
    captureGps: "GPS लिनुहोस्",
    submit: "गुनासो पेश गर्नुहोस्",
    submitSuccess: "गुनासो सफलतापूर्वक दर्ता भयो।",
    submitFailed: "गुनासो दर्ता गर्न सकिएन।",
    resultTitle: "गुनासो दर्ता पुष्टिकरण",
    resultToken: "गुनासो आईडी",
    resultAssigned: "तोकिएको विभाग",
    resultStatus: "हालको स्थिति",
    anonTokenTitle: "गोप्य ट्र्याकिङ कोड",
    anonTokenHint: "यो कोड सुरक्षित राख्नुहोस् — लगइन बिना गुनासो ट्र्याक गर्न प्रयोग गर्नुहोस्।",
    resultPendingPoints: "अंक अहिले थपिँदैन। अधिकारीले वैधता पुष्टि गरेपछि मात्र अंक दिइन्छ।",
    resultAnonymousNoReward: "यो गुनासो गुमनाम रूपमा दर्ता भएकाले कुनै पुरस्कार वा प्रोत्साहन उपलब्ध हुँदैन।",
    myComplaintsEyebrow: "मेरो गुनासोहरू",
    myComplaintsTitle: "फिल्टर, हेर्नुहोस्, र समयरेखा जाँच गर्नुहोस्",
    filterStatusLabel: "स्थिति",
    filterDepartmentLabel: "विभाग",
    filterFromLabel: "मिति देखि",
    filterToLabel: "मिति सम्म",
    allStatuses: "सबै स्थिति",
    allDepartments: "सबै विभाग",
    complaintDetailEyebrow: "विस्तृत दृश्य",
    complaintDetailTitle: "चयन गरिएको गुनासो",
    noComplaints: "हालसम्म कुनै गुनासो दर्ता गरिएको छैन।",
    noComplaintSelected: "विस्तृत दृश्य हेर्न गुनासो छान्नुहोस्।",
    status: "स्थिति",
    department: "विभाग",
    lastUpdated: "अन्तिम अद्यावधिक",
    createdAt: "दर्ता मिति",
    eta: "समाप्ति अनुमान",
    currentOfficer: "हालको अधिकारी",
    rewardPoints: "प्राप्त अंक",
    timeline: "समयरेखा",
    comments: "अधिकारी टिप्पणीहरू",
    attachments: "संलग्न फाइलहरू",
    journeyEyebrow: "प्रगति मार्ग",
    journeyTitle: "गुनासो यात्रा",
    rateTitle: "समाधान मूल्याङ्कन",
    rateLabel: "समाधानलाई कति अंक दिनुहुन्छ?",
    confirmClose: "समाधान पुष्टि गर्नुहोस्",
    feedbackPlaceholder: "इच्छा भए छोटो प्रतिक्रिया लेख्नुहोस्",
    feedbackSaved: "समाधान प्रतिक्रिया सुरक्षित गरियो।",
    profileEyebrow: "प्रोफाइल सेटिङ",
    profileTitle: "दर्ता विवरण",
    profileCitizenCode: "नागरिक कोड",
    profileAnonymous: "गुमनाम दर्ता",
    profileMobile: "मोबाइल नम्बर",
    profileEmail: "इमेल",
    profilePoints: "कुल पुरस्कार अंक",
    gpsSuccess: "GPS स्थान प्राप्त भयो।",
    gpsFailed: "GPS प्राप्त गर्न सकिएन।",
    mapPreviewTitle: "स्थान पूर्वावलोकन",
    complaintMapTitle: "गुनासो स्थान",
    loadFailed: "डाटा लोड गर्न सकिएन।",
    pending: "Pending Review",
    in_progress: "In Progress",
    solved: "Resolved",
    delayed: "Delayed",
    forwarded: "Forwarded",
    escalated: "Under Review",
    anonymousRegisteredYes: "हो",
    anonymousRegisteredNo: "होइन",
    citizenIdLabel: "नागरिक कोड",
    pointsHoverPrefix: "अंक इतिहास",
    noComments: "कुनै टिप्पणी छैन।",
    noTimeline: "कुनै समयरेखा छैन।",
    viewDetails: "विस्तृत हेर्नुहोस्",
    open: "खोल्नुहोस्",
    proofImage: "प्रमाण फोटो",
    authRequired: "लगइन आवश्यक छ।",
  },
  en: {
    topTitle: "Pokhara Mahanagarpalika Citizen Dashboard",
    gov: "Government of Nepal",
    main: "Citizen Dashboard",
    sub: "Complaint filing, tracking, and profile management",
    logout: "Logout",
    welcome: "Welcome, {name}. From here you can file complaints, track status, and manage your profile.",
    registrationNotice: "Save your citizen ID for future login: {code}",
    navDashboard: "Dashboard",
    navFile: "File Complaint",
    navComplaints: "My Complaints",
    navProfile: "Profile Settings",
    pointsEyebrow: "Reward Points",
    pointsCopy: "Points earned from valid resolved complaints",
    recentComplaintsEyebrow: "Recent complaints",
    recentComplaintsTitle: "Last 5 complaints",
    fileButton: "File a Complaint",
    dashboardPointsEyebrow: "Reward history",
    dashboardPointsTitle: "Points history",
    dashboardTotal: "Total filed",
    dashboardResolved: "Resolved",
    dashboardProgress: "In progress",
    dashboardReview: "Under review",
    noRecent: "No recent complaints yet.",
    noPoints: "No points history yet.",
    wizardEyebrow: "Complaint filing",
    wizardTitle: "Submit your complaint step by step",
    wizardStep: "Step 1 / 4",
    stepAccount: "Account",
    stepDetails: "Details",
    stepReview: "Review",
    anonymousBannerTitle: "Register this complaint anonymously",
    anonymousBannerCopy: "When enabled, your name and contact details are hidden from officers.",
    anonymousWarningTitle: "Anonymous complaint notice",
    anonymousWarningCopy: "This complaint will not store your name, phone number, or citizen ID link. Proceed anonymously only if your safety or privacy is the priority.",
    anonymousRewardWarning: "You will not receive any reward points, cash incentive, or public recognition for this complaint.",
    anonymousTrackingNotice: "This complaint will not remain linked to your profile. Save the tracking token to follow progress later.",
    complainantEyebrow: "Personal details",
    complainantTitle: "Basic citizen information",
    complaintInfoEyebrow: "Complaint details",
    complaintInfoTitle: "Problem registration details",
    fieldContactName: "Full name",
    fieldContactPhone: "Contact number",
    fieldContactEmail: "Email address",
    fieldCategory: "Complaint department/category",
    fieldTitle: "Complaint title",
    fieldWard: "Ward number",
    fieldLocation: "Location / landmark",
    fieldSubcategory: "Specific issue",
    fieldArea: "Area / locality",
    fieldDescription: "Full complaint description",
    fieldLandmark: "Nearest landmark",
    fieldUrgency: "Urgency",
    fieldContactOptIn: "Keep contact details for updates?",
    fieldMedia: "Attach photos / documents",
    urgencyHigh: "High",
    urgencyMedium: "Medium",
    urgencyLow: "Low",
    yes: "Yes",
    no: "No",
    captureGps: "Capture GPS",
    submit: "Submit Complaint",
    submitSuccess: "Complaint submitted successfully.",
    submitFailed: "Could not submit the complaint.",
    resultTitle: "Complaint confirmation",
    resultToken: "Complaint ID",
    resultAssigned: "Assigned department",
    resultStatus: "Current status",
    anonTokenTitle: "Anonymous Tracking Code",
    anonTokenHint: "Keep this safe — use it to track your complaint without logging in.",
    resultPendingPoints: "Points are not awarded yet. They are added only after an officer verifies the complaint as valid.",
    resultAnonymousNoReward: "This complaint was filed anonymously, so it is not eligible for any reward or incentive.",
    myComplaintsEyebrow: "My complaints",
    myComplaintsTitle: "Filter, inspect, and review your complaint timeline",
    filterStatusLabel: "Status",
    filterDepartmentLabel: "Department",
    filterFromLabel: "Date from",
    filterToLabel: "Date to",
    allStatuses: "All statuses",
    allDepartments: "All departments",
    complaintDetailEyebrow: "Detail view",
    complaintDetailTitle: "Selected complaint",
    noComplaints: "No complaints have been filed yet.",
    noComplaintSelected: "Select a complaint to view its details.",
    status: "Status",
    department: "Department",
    lastUpdated: "Last updated",
    createdAt: "Created at",
    eta: "Estimated completion",
    currentOfficer: "Current officer",
    rewardPoints: "Reward points",
    timeline: "Timeline",
    comments: "Officer comments",
    attachments: "Attachments",
    journeyEyebrow: "Progress path",
    journeyTitle: "Complaint journey",
    rateTitle: "Resolution rating",
    rateLabel: "How would you rate the resolution?",
    confirmClose: "Confirm closure",
    feedbackPlaceholder: "Optional short feedback",
    feedbackSaved: "Resolution feedback saved.",
    profileEyebrow: "Profile settings",
    profileTitle: "Registration details",
    profileCitizenCode: "Citizen ID",
    profileAnonymous: "Anonymous registration",
    profileMobile: "Mobile number",
    profileEmail: "Email",
    profilePoints: "Total reward points",
    gpsSuccess: "GPS location captured.",
    gpsFailed: "Could not access GPS.",
    mapPreviewTitle: "Location Preview",
    complaintMapTitle: "Complaint Location",
    loadFailed: "Could not load data.",
    pending: "Pending Review",
    in_progress: "In Progress",
    solved: "Resolved",
    delayed: "Delayed",
    forwarded: "Forwarded",
    escalated: "Under Review",
    anonymousRegisteredYes: "Yes",
    anonymousRegisteredNo: "No",
    citizenIdLabel: "Citizen ID",
    pointsHoverPrefix: "Points history",
    noComments: "No comments yet.",
    noTimeline: "No timeline yet.",
    viewDetails: "View details",
    open: "Open",
    proofImage: "Proof Image",
    authRequired: "Authentication required.",
  },
};

function formatDate(value, language) {
  if (!value) return "-";
  return new Date(value).toLocaleString(language === "ne" ? "ne-NP" : "en-US");
}

function safeInitials(name) {
  return String(name || "Citizen")
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

function statusClass(status) {
  if (status === "solved") return "department-badge-green";
  if (status === "delayed") return "department-badge-red";
  if (status === "in_progress") return "department-badge-amber";
  return "department-badge-blue";
}

function getComplaintProgress(status, language) {
  const labels = language === "ne"
    ? ["दर्ता", "कार्यालयमा पुगेको", "समाधान"]
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

export function CitizenDashboardClient({ initialSection = "dashboard" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState("en");
  const [activeSection, setActiveSection] = useState(initialSection);
  const [authToken, setAuthToken] = useState("");
  const [user, setUser] = useState(null);
  const [registrationNoticeCode, setRegistrationNoticeCode] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaintToken, setSelectedComplaintToken] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loadError, setLoadError] = useState("");
  const [resultCard, setResultCard] = useState(null);
  const [feedback, setFeedback] = useState({ rating: "0", comment: "", token: "" });
  const [filters, setFilters] = useState({ status: "", department: "", from: "", to: "" });
  const [form, setForm] = useState({
    anonymous: false,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
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
    contactOptIn: "yes",
  });
  const citizenSectionRoutes = appRoutes.citizenSections || {
    dashboard: "/citizen/dashboard",
    file: "/citizen/new-complaint",
    complaints: "/citizen/complaints",
    profile: "/citizen/profile",
  };

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("citizen_user");
    const storedToken = sessionStorage.getItem("citizen_auth_token");
    if (!storedUser || !storedToken) {
      router.replace(appRoutes.home);
      return;
    }
    setUser(JSON.parse(storedUser));
    setAuthToken(storedToken);
    const storedRegistrationCode = sessionStorage.getItem("citizen_registration_notice") || "";
    setRegistrationNoticeCode(storedRegistrationCode);
    if (storedRegistrationCode) {
      sessionStorage.removeItem("citizen_registration_notice");
    }
  }, [router]);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;

    async function load() {
      try {
        setLoadError("");
        const [dashboardResponse, complaintsResponse] = await Promise.all([
          fetch(`${apiBase}/api/citizen/dashboard`, { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch(`${apiBase}/api/complaints/mine`, { headers: { Authorization: `Bearer ${authToken}` } }),
        ]);

        const dashboardResult = await dashboardResponse.json();
        const complaintsResult = await complaintsResponse.json();

        if (!dashboardResponse.ok || !complaintsResponse.ok) {
          throw new Error(t.loadFailed);
        }

        if (cancelled) return;
        setDashboardData(dashboardResult.dashboard);
        setComplaints(complaintsResult.complaints || []);
        setSelectedComplaintToken((prev) => prev || complaintsResult.complaints?.[0]?.tokenNumber || "");
      } catch {
        if (!cancelled) {
          setLoadError(t.loadFailed);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authToken, t.loadFailed]);

  const currentUser = dashboardData?.user || user;
  const pointsHistory = dashboardData?.pointsHistory || [];
  const recentComplaints = dashboardData?.recentComplaints || [];
  const stats = dashboardData?.stats || { total: 0, resolved: 0, inProgress: 0, underReview: 0 };

  useEffect(() => {
    if (!currentUser) return;
    setForm((prev) => {
      if (prev.contactName || prev.contactPhone || prev.contactEmail) return prev;
      return {
        ...prev,
        contactName: currentUser.name || "",
        contactPhone: currentUser.mobileNumber || "",
        contactEmail: currentUser.email || "",
      };
    });
  }, [currentUser?.name, currentUser?.mobileNumber, currentUser?.email]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      if (filters.status && complaint.status !== filters.status) return false;
      if (filters.department && complaint.assignedOfficeLabel !== filters.department) return false;
      if (filters.from && new Date(complaint.createdAt).getTime() < new Date(filters.from).getTime()) return false;
      if (filters.to && new Date(complaint.createdAt).getTime() > new Date(`${filters.to}T23:59:59`).getTime()) return false;
      return true;
    });
  }, [complaints, filters]);

  const availableDepartments = useMemo(
    () => [...new Set(complaints.map((item) => item.assignedOfficeLabel).filter(Boolean))],
    [complaints],
  );

  const selectedComplaint = useMemo(
    () => complaints.find((item) => item.tokenNumber === selectedComplaintToken) || null,
    [complaints, selectedComplaintToken],
  );
  const selectedComplaintProgress = useMemo(
    () => getComplaintProgress(selectedComplaint?.status, language),
    [selectedComplaint?.status, language],
  );
  const selectedComplaintProgressValue = useMemo(
    () => getComplaintProgressValue(selectedComplaint?.status),
    [selectedComplaint?.status],
  );
  const serviceMix = useMemo(() => {
    const total = Math.max(stats.total, 1);
    return [
      { label: t.dashboardResolved, value: stats.resolved, percent: Math.round((stats.resolved / total) * 100), tone: "is-positive" },
      { label: t.dashboardProgress, value: stats.inProgress, percent: Math.round((stats.inProgress / total) * 100), tone: "is-active" },
      { label: t.dashboardReview, value: stats.underReview, percent: Math.round((stats.underReview / total) * 100), tone: "is-neutral" },
    ];
  }, [stats, t.dashboardProgress, t.dashboardResolved, t.dashboardReview]);

  useEffect(() => {
    if (!selectedComplaintToken || !authToken) return;
    const selected = complaints.find((item) => item.tokenNumber === selectedComplaintToken);
    if (selected?.history) return;

    let cancelled = false;

    async function loadDetail() {
      try {
        const response = await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const result = await response.json();
        if (!response.ok || cancelled) return;
        setComplaints((prev) =>
          prev.map((item) => (item.tokenNumber === selectedComplaintToken ? { ...item, ...result.complaint } : item)),
        );
      } catch {}
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedComplaintToken, authToken, complaints]);

  function statusLabel(status) {
    return t[status] || status || "-";
  }

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };
  }

  function handleSectionChange(nextSection) {
    setActiveSection(nextSection);
    const targetRoute = citizenSectionRoutes[nextSection] || appRoutes.citizen;
    if (pathname !== targetRoute) {
      router.push(targetRoute);
    }
  }

  async function refreshData() {
    if (!authToken) return;
    const [dashboardResponse, complaintsResponse] = await Promise.all([
      fetch(`${apiBase}/api/citizen/dashboard`, { headers: { Authorization: `Bearer ${authToken}` } }),
      fetch(`${apiBase}/api/complaints/mine`, { headers: { Authorization: `Bearer ${authToken}` } }),
    ]);
    const dashboardResult = await dashboardResponse.json();
    const complaintsResult = await complaintsResponse.json();
    if (!dashboardResponse.ok || !complaintsResponse.ok) {
      throw new Error(t.loadFailed);
    }
    setDashboardData(dashboardResult.dashboard);
    setComplaints(complaintsResult.complaints || []);
    setSelectedComplaintToken((prev) => prev || complaintsResult.complaints?.[0]?.tokenNumber || "");
  }

  async function selectComplaint(tokenNumber) {
    handleSectionChange("complaints");
    setSelectedComplaintToken(tokenNumber);
    try {
      const response = await fetch(`${apiBase}/api/complaints/${tokenNumber}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || t.loadFailed);
      setComplaints((prev) => prev.map((item) => (item.tokenNumber === tokenNumber ? { ...item, ...result.complaint } : item)));
    } catch {}
  }

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
    setMessage({ type: "", text: "" });
    try {
      const isAnonymousSubmission = Boolean(form.anonymous);
      const payload = {
        ...form,
        contactOptIn: form.contactOptIn === "yes",
        proofImage: attachments.find((file) => file.mimeType.startsWith("image/")) || null,
        attachments,
      };
      const response = await fetch(`${apiBase}/api/complaints`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: result.message || t.submitFailed });
        return;
      }
      setMessage({
        type: "success",
        text: isAnonymousSubmission
          ? `${t.submitSuccess} ${t.anonymousTrackingNotice}`
          : t.submitSuccess,
      });
      setResultCard({
        complaint: result.complaint,
        anonymousTrackingToken: result.anonymousTrackingToken || null,
      });
      setForm({
        anonymous: false,
        contactName: currentUser?.name || "",
        contactPhone: currentUser?.mobileNumber || "",
        contactEmail: currentUser?.email || "",
        category: categories[language][0][0],
        title: "",
        wardNumber: "1",
        locationText: "",
        locationCoordinates: null,
        subcategory: "",
        areaName: "",
        description: "",
        nearestLandmark: "",
        priority: "high",
        contactOptIn: "yes",
      });
      setAttachments([]);
      await refreshData();
      if (isAnonymousSubmission) {
        handleSectionChange("file");
      } else {
        setSelectedComplaintToken(result.complaint?.tokenNumber || "");
        handleSectionChange("complaints");
      }
    } catch {
      setMessage({ type: "error", text: t.submitFailed });
    }
  }

  async function handleFeedbackSubmit() {
    if (!selectedComplaint) return;
    try {
      const response = await fetch(`${apiBase}/api/complaints/${selectedComplaint.tokenNumber}/feedback`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          rating: feedback.rating,
          comment: feedback.comment.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || t.loadFailed);
      setMessage({ type: "success", text: t.feedbackSaved });
      await refreshData();
    } catch (error) {
      setMessage({ type: "error", text: error.message || t.loadFailed });
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${apiBase}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch {}
    sessionStorage.removeItem("citizen_user");
    sessionStorage.removeItem("citizen_auth_token");
    router.replace(appRoutes.home);
  }

  return (
    <>
      <BodyConfig className="citizen-dashboard-body" />
      <div className="citizen-shell">
        <PublicTopbar title={t.topTitle}>
          <LanguageSwitch currentLanguage={language} onChange={setLanguage} />
          <button type="button" className="button secondary compact-button" onClick={handleLogout}>
            {t.logout}
          </button>
        </PublicTopbar>
        <header className="portal-header citizen-header">
          <div className="container citizen-header-inner">
            <div className="brand">
              <div className="brand-mark crest government-emblem">
                <img src="/assets/images/nepal-gov-emblem.png" alt="Government of Nepal emblem" />
              </div>
              <div>
                <p className="eyebrow small">{t.gov}</p>
                <h1>{t.main}</h1>
                <p className="brand-subtitle">{t.sub}</p>
              </div>
            </div>
            <div className="citizen-header-profile">
              <div className="citizen-profile-copy">
                <strong>{currentUser?.name || "Citizen"}</strong>
                <span>{`${t.citizenIdLabel}: ${currentUser?.citizenCode || "-"}`}</span>
              </div>
              <div className="citizen-profile-avatar">{safeInitials(currentUser?.name)}</div>
            </div>
          </div>
        </header>

        <main className="citizen-main">
          <div className="container citizen-layout">
            <aside className="citizen-sidebar">
              {[
                { key: "dashboard", label: t.navDashboard, Icon: LayoutDashboard, badge: stats.total || null },
                { key: "file", label: t.navFile, Icon: FileText, badge: null },
                { key: "complaints", label: t.navComplaints, Icon: Route, badge: complaints.length || null },
                { key: "profile", label: t.navProfile, Icon: Settings, badge: null },
              ].map(({ key, label, Icon, badge }) => (
                <button type="button" className={`citizen-nav-btn ${activeSection === key ? "active" : ""}`} onClick={() => handleSectionChange(key)} key={key}>
                  <span className="portal-nav-row">
                    <span className="portal-nav-icon"><Icon size={17} /></span>
                    <span>{label}</span>
                    {badge ? <strong className="portal-nav-badge">{badge}</strong> : null}
                  </span>
                </button>
              ))}

              <div className="citizen-points-card" title={pointsHistory.length ? `${t.pointsHoverPrefix}: ${pointsHistory.map((entry) => `+${entry.points} ${entry.title}`).join(" | ")}` : t.noPoints}>
                <p className="eyebrow small">{t.pointsEyebrow}</p>
                <div className="citizen-points-value">{dashboardData?.user?.rewardPoints || 0}</div>
                <p className="citizen-points-copy">{t.pointsCopy}</p>
                <div className="citizen-points-history">
                  {pointsHistory.length
                    ? pointsHistory.slice(0, 3).map((entry) => (
                        <div className="citizen-points-entry" key={`${entry.title}-${entry.awardedAt}`}>
                          <strong>{`+${entry.points}`}</strong>
                          <span>{entry.title}</span>
                        </div>
                      ))
                    : <p className="citizen-muted-copy">{t.noPoints}</p>}
                </div>
              </div>
            </aside>

            <section className="citizen-content" style={{ display: "block" }}>
              {activeSection === "dashboard" ? (
                <section className="citizen-section active">
                  <div className="login-banner">
                    {t.welcome.replace("{name}", currentUser?.name || "Citizen")}
                    {registrationNoticeCode ? ` ${t.registrationNotice.replace("{code}", registrationNoticeCode)}` : ""}
                  </div>

                  <div className="citizen-summary-grid">
                    {[
                      [t.dashboardTotal, stats.total, ""],
                      [t.dashboardResolved, stats.resolved, "is-green"],
                      [t.dashboardProgress, stats.inProgress, "is-amber"],
                      [t.dashboardReview, stats.underReview, "is-blue"],
                    ].map(([label, value, className]) => (
                      <article className="department-kpi-card citizen-stat-card" key={label}>
                        <div className={`department-kpi-num ${className}`}>{value}</div>
                        <div className="department-kpi-lbl">{label}</div>
                      </article>
                    ))}
                  </div>

                  <div className="citizen-dashboard-grid top-gap">
                    <div className="panel">
                      <div className="panel-header">
                        <div>
                          <p className="eyebrow small">{t.recentComplaintsEyebrow}</p>
                          <h3>{t.recentComplaintsTitle}</h3>
                        </div>
                        <button type="button" className="button primary" onClick={() => handleSectionChange("file")}>
                          {t.fileButton}
                        </button>
                      </div>
                      <div>
                        {loadError ? (
                          <div className="admin-list-card"><p>{loadError}</p></div>
                        ) : recentComplaints.length ? (
                          recentComplaints.map((complaint) => (
                            <article className="citizen-complaint-card" key={complaint.tokenNumber}>
                              <div className="citizen-complaint-card-head">
                                <div>
                                  <strong>{complaint.title}</strong>
                                  <p>{`${complaint.tokenNumber} • ${complaint.assignedOfficeLabel || "-"}`}</p>
                                </div>
                                <span className={`department-badge ${statusClass(complaint.status)}`}>{statusLabel(complaint.status)}</span>
                              </div>
                              <button type="button" className="department-mini-btn" onClick={() => selectComplaint(complaint.tokenNumber)}>
                                {t.viewDetails}
                              </button>
                            </article>
                          ))
                        ) : (
                          <div className="admin-list-card"><p>{t.noRecent}</p></div>
                        )}
                      </div>
                    </div>

                    <div className="panel">
                      <div className="panel-header">
                        <div>
                          <p className="eyebrow small">{t.dashboardPointsEyebrow}</p>
                          <h3>{t.dashboardPointsTitle}</h3>
                        </div>
                      </div>
                      <div className="status-rail-list">
                        {serviceMix.map((item) => (
                          <div className="status-rail-item" key={item.label}>
                            <div className="status-rail-head">
                              <strong>{item.label}</strong>
                              <span>{item.value}</span>
                            </div>
                            <div className="status-rail-track">
                              <div className={`status-rail-fill ${item.tone}`} style={{ width: `${Math.max(item.percent, item.value ? 12 : 4)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        {loadError ? (
                          <div className="admin-list-card"><p>{loadError}</p></div>
                        ) : pointsHistory.length ? (
                          pointsHistory.map((entry) => (
                            <article className="admin-list-card" key={`${entry.title}-${entry.awardedAt}`}>
                              <strong>{`+${entry.points}`}</strong>
                              <p>{entry.title}</p>
                              <p>{formatDate(entry.awardedAt, language)}</p>
                            </article>
                          ))
                        ) : (
                          <div className="admin-list-card"><p>{t.noPoints}</p></div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {activeSection === "file" ? (
                <section className="citizen-section active">
                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow small">{t.wizardEyebrow}</p>
                        <h3>{t.wizardTitle}</h3>
                      </div>
                      <div className="wizard-step">{t.wizardStep}</div>
                    </div>

                    <div className="citizen-stepper">
                      <div className="citizen-step active"><span>1</span><strong>{t.stepAccount}</strong></div>
                      <div className="citizen-step active"><span>2</span><strong>{t.stepDetails}</strong></div>
                      <div className="citizen-step"><span>3</span><strong>{t.stepReview}</strong></div>
                    </div>

                    <form className="auth-form complaint-form-grid citizen-complaint-form" onSubmit={(event) => event.preventDefault()}>
                      <div className="citizen-inline-banner">
                        <div>
                          <strong>{t.anonymousBannerTitle}</strong>
                          <p>{t.anonymousBannerCopy}</p>
                        </div>
                        <label className="citizen-switch">
                          <input
                            type="checkbox"
                            checked={form.anonymous}
                            onChange={(event) => setForm((prev) => ({ ...prev, anonymous: event.target.checked }))}
                          />
                          <span></span>
                        </label>
                      </div>

                      {form.anonymous ? (
                        <div className="citizen-anonymous-warning">
                          <strong>{t.anonymousWarningTitle}</strong>
                          <p>{t.anonymousWarningCopy}</p>
                          <p>{t.anonymousRewardWarning}</p>
                        </div>
                      ) : null}

                      <div className={`citizen-form-card ${form.anonymous ? "is-dimmed" : ""}`}>
                        <div className="panel-header">
                          <div>
                            <p className="eyebrow small">{t.complainantEyebrow}</p>
                            <h3>{t.complainantTitle}</h3>
                          </div>
                        </div>
                        <div className="grid two-col citizen-form-grid">
                          <label>
                            <span>{t.fieldContactName}</span>
                            <input type="text" value={form.contactName} placeholder={language === "ne" ? "उदाहरण: राजन शर्मा" : "Example: Rajan Sharma"} onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))} />
                          </label>
                          <label>
                            <span>{t.fieldContactPhone}</span>
                            <input type="text" value={form.contactPhone} placeholder="98XXXXXXXX" onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))} />
                          </label>
                        </div>
                        <label>
                          <span>{t.fieldContactEmail}</span>
                          <input type="text" value={form.contactEmail} placeholder="example@email.com" onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))} />
                        </label>
                      </div>

                      <div className="citizen-form-card">
                        <div className="panel-header">
                          <div>
                            <p className="eyebrow small">{t.complaintInfoEyebrow}</p>
                            <h3>{t.complaintInfoTitle}</h3>
                          </div>
                        </div>

                        <div className="grid two-col citizen-form-grid">
                          <label>
                            <span>{t.fieldCategory}</span>
                            <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
                              {categories[language].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                          </label>
                          <label>
                            <span>{t.fieldTitle}</span>
                            <input type="text" value={form.title} placeholder={language === "ne" ? "छोटो शीर्षक दिनुहोस्" : "Give a short title"} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
                          </label>
                        </div>

                        <div className="grid two-col citizen-form-grid">
                          <label>
                            <span>{t.fieldWard}</span>
                            <select value={form.wardNumber} onChange={(event) => setForm((prev) => ({ ...prev, wardNumber: event.target.value }))}>
                              {wards.map((ward) => <option key={ward} value={ward}>{language === "ne" ? `वडा ${ward}` : `Ward ${ward}`}</option>)}
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
                            <input type="text" value={form.subcategory} placeholder={language === "ne" ? "जस्तै: खाल्डो, ढल अवरोध" : "For example: pothole, blocked drain"} onChange={(event) => setForm((prev) => ({ ...prev, subcategory: event.target.value }))} />
                          </label>
                          <label>
                            <span>{t.fieldArea}</span>
                            <input type="text" value={form.areaName} placeholder={language === "ne" ? "क्षेत्र वा टोल" : "Area or locality"} onChange={(event) => setForm((prev) => ({ ...prev, areaName: event.target.value }))} />
                          </label>
                        </div>

                        <label>
                          <span>{t.fieldDescription}</span>
                          <textarea value={form.description} placeholder={language === "ne" ? "समस्याको विस्तृत विवरण लेख्नुहोस्" : "Write the full problem description"} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}></textarea>
                        </label>

                        <div className="grid two-col citizen-form-grid">
                          <label>
                            <span>{t.fieldLandmark}</span>
                            <input type="text" value={form.nearestLandmark} placeholder={language === "ne" ? "नजिकको चिनारी" : "Nearby landmark"} onChange={(event) => setForm((prev) => ({ ...prev, nearestLandmark: event.target.value }))} />
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
                          <label>
                            <span>{t.fieldContactOptIn}</span>
                            <select value={form.contactOptIn} onChange={(event) => setForm((prev) => ({ ...prev, contactOptIn: event.target.value }))}>
                              <option value="yes">{t.yes}</option>
                              <option value="no">{t.no}</option>
                            </select>
                          </label>
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
                        <button type="button" className="button dark" onClick={handleSubmitComplaint}>
                          {t.submit}
                        </button>
                      </div>
                    </form>

                    <div className={`form-message ${message.type}`}>{message.text}</div>
                    {resultCard ? (
                      <div className="wizard-summary visible">
                        <h3>{t.resultTitle}</h3>
                        <p><strong>{t.resultToken}:</strong> {resultCard.complaint.tokenNumber}</p>
                        <p><strong>{t.resultAssigned}:</strong> {resultCard.complaint.assignedOfficeLabel || "-"}</p>
                        <p><strong>{t.resultStatus}:</strong> {statusLabel(resultCard.complaint.status)}</p>
                        <p>{resultCard.complaint.anonymous ? t.resultAnonymousNoReward : t.resultPendingPoints}</p>
                        {resultCard.anonymousTrackingToken ? (
                          <div style={{ background: "#fff8e1", border: "1px solid #c9a227", borderRadius: "8px", padding: "12px", marginTop: "12px" }}>
                            <strong style={{ color: "#c9a227" }}>{t.anonTokenTitle}</strong>
                            <p style={{ fontFamily: "monospace", fontSize: "1.1rem", letterSpacing: "2px", margin: "6px 0" }}>{resultCard.anonymousTrackingToken}</p>
                            <small>{t.anonTokenHint}</small>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {activeSection === "complaints" ? (
                <section className="citizen-section active">
                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow small">{t.myComplaintsEyebrow}</p>
                        <h3>{t.myComplaintsTitle}</h3>
                      </div>
                    </div>

                    <div className="citizen-filter-grid">
                      <label>
                        <span>{t.filterStatusLabel}</span>
                        <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
                          <option value="">{t.allStatuses}</option>
                          {["pending", "in_progress", "solved", "delayed", "forwarded", "escalated"].map((status) => (
                            <option key={status} value={status}>{statusLabel(status)}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>{t.filterDepartmentLabel}</span>
                        <select value={filters.department} onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}>
                          <option value="">{t.allDepartments}</option>
                          {availableDepartments.map((department) => <option key={department} value={department}>{department}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>{t.filterFromLabel}</span>
                        <input type="date" value={filters.from} onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))} />
                      </label>
                      <label>
                        <span>{t.filterToLabel}</span>
                        <input type="date" value={filters.to} onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))} />
                      </label>
                    </div>

                    {loadError ? (
                      <div className="detail-card"><p>{loadError}</p></div>
                    ) : filteredComplaints.length ? (
                      <table className="department-work-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>{t.fieldTitle}</th>
                            <th>{t.department}</th>
                            <th>{t.status}</th>
                            <th>{t.lastUpdated}</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredComplaints.map((complaint) => (
                            <tr key={complaint.tokenNumber} className={complaint.tokenNumber === selectedComplaintToken ? "selected-row" : ""}>
                              <td className="department-tid">{complaint.tokenNumber}</td>
                              <td><strong className="department-issue-title">{complaint.title || complaint.subcategory || complaint.category}</strong></td>
                              <td>{complaint.assignedOfficeLabel || "-"}</td>
                              <td><span className={`department-badge ${statusClass(complaint.status)}`}>{statusLabel(complaint.status)}</span></td>
                              <td>{formatDate(complaint.updatedAt || complaint.createdAt, language)}</td>
                              <td><button type="button" className="department-mini-btn" onClick={() => selectComplaint(complaint.tokenNumber)}>{t.open}</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="detail-card"><p>{t.noComplaints}</p></div>
                    )}
                  </div>

                  <div className="panel top-gap">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow small">{t.complaintDetailEyebrow}</p>
                        <h3>{t.complaintDetailTitle}</h3>
                      </div>
                    </div>

                    {!selectedComplaint ? (
                      <div className="detail-card"><p>{t.noComplaintSelected}</p></div>
                    ) : (
                      <>
                        <div className="detail-card citizen-progress-card">
                          <div className="panel-header">
                            <div>
                              <p className="eyebrow small">{t.journeyEyebrow}</p>
                              <h3>{t.journeyTitle}</h3>
                            </div>
                            <span className={`department-badge ${statusClass(selectedComplaint.status)}`}>{statusLabel(selectedComplaint.status)}</span>
                          </div>
                          <div className="complaint-progress-bar">
                            <div className="complaint-progress-fill" style={{ width: `${selectedComplaintProgressValue}%` }} />
                          </div>
                          <div className="complaint-stage-strip">
                            {selectedComplaintProgress.map((step, index) => (
                              <div className={`complaint-stage ${step.done ? "is-done" : ""} ${step.current ? "is-current" : ""}`} key={`${step.label}-${index}`}>
                                <span>{index + 1}</span>
                                <strong>{step.label}</strong>
                              </div>
                            ))}
                          </div>
                          <div className="status-mini-grid top-gap">
                            <div className="status-mini-card">
                              <span><Building2 size={16} /></span>
                              <strong>{selectedComplaint.assignedOfficeLabel || "-"}</strong>
                              <p>{t.department}</p>
                            </div>
                            <div className="status-mini-card">
                              <span><Clock3 size={16} /></span>
                              <strong>{formatDate(selectedComplaint.updatedAt || selectedComplaint.createdAt, language)}</strong>
                              <p>{t.lastUpdated}</p>
                            </div>
                            <div className="status-mini-card">
                              <span><UserRound size={16} /></span>
                              <strong>{selectedComplaint.assignedOfficerName || "-"}</strong>
                              <p>{t.currentOfficer}</p>
                            </div>
                            <div className="status-mini-card">
                              <span><Trophy size={16} /></span>
                              <strong>{selectedComplaint.pointsAwarded || 0}</strong>
                              <p>{t.rewardPoints}</p>
                            </div>
                          </div>
                        </div>
                        <div className="details-list department-detail-grid citizen-detail-grid">
                          <div className="detail-card">
                            <h3>{selectedComplaint.title || selectedComplaint.subcategory || selectedComplaint.category}</h3>
                            <p><strong>{selectedComplaint.tokenNumber}</strong></p>
                            <p>{selectedComplaint.description || "-"}</p>
                            <p><strong>{t.department}:</strong> {selectedComplaint.assignedOfficeLabel || "-"}</p>
                            <p><strong>{t.status}:</strong> <span className={`department-badge ${statusClass(selectedComplaint.status)}`}>{statusLabel(selectedComplaint.status)}</span></p>
                            <p><strong>{t.createdAt}:</strong> {formatDate(selectedComplaint.createdAt, language)}</p>
                            <p><strong>{t.lastUpdated}:</strong> {formatDate(selectedComplaint.updatedAt || selectedComplaint.createdAt, language)}</p>
                            <p><strong>{t.currentOfficer}:</strong> {selectedComplaint.assignedOfficerName || "-"}</p>
                            <p><strong>{t.eta}:</strong> {formatDate(selectedComplaint.estimatedCompletionAt, language)}</p>
                            <p><strong>{t.rewardPoints}:</strong> {selectedComplaint.pointsAwarded || 0}</p>
                            <p>
                              <strong>{t.attachments}:</strong>
                              <br />
                              {(selectedComplaint.attachments || []).length
                                ? selectedComplaint.attachments.map((file) => (
                                    <span key={file.name}>
                                      <a className="track-link" href={file.dataUrl} download={file.name}>{file.name}</a>
                                      <br />
                                    </span>
                                  ))
                                : "-"}
                            </p>
                          </div>
                          <LocationMapCard
                            title={t.complaintMapTitle}
                            language={language}
                            locationText={selectedComplaint.locationText}
                            locationCoordinates={selectedComplaint.locationCoordinates}
                            wardNumber={selectedComplaint.wardNumber}
                          />
                          <div className="detail-card">
                            <h3>{t.comments}</h3>
                            {(selectedComplaint.comments || []).length
                              ? selectedComplaint.comments.map((comment, index) => (
                                  <div className="department-detail-line" key={`${comment.actorName}-${index}`}>
                                    <strong><MessageSquare size={14} /> {comment.actorName}</strong>
                                    <span>{comment.message}</span>
                                    <small>{formatDate(comment.createdAt, language)}</small>
                                  </div>
                                ))
                              : <p>{t.noComments}</p>}
                          </div>
                          <div className="detail-card">
                            <h3>{t.timeline}</h3>
                            {(selectedComplaint.history || []).length
                              ? selectedComplaint.history.map((entry, index) => (
                                  <div className="department-detail-line" key={`${entry.action}-${index}`}>
                                    <strong><MapPinned size={14} /> {entry.action}</strong>
                                    <span>{entry.note || "-"}</span>
                                    <small>{formatDate(entry.timestamp || entry.createdAt, language)}</small>
                                  </div>
                                ))
                              : <p>{t.noTimeline}</p>}
                          </div>
                          {selectedComplaint.proofImage?.dataUrl ? (
                            <div className="detail-card">
                              <h3>{t.proofImage}</h3>
                              <img src={selectedComplaint.proofImage.dataUrl} alt={selectedComplaint.proofImage.name || "Proof"} style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "8px" }} />
                            </div>
                          ) : null}
                        </div>

                        {selectedComplaint.status === "solved" ? (
                          <div className="detail-card top-gap">
                            <h3>{t.rateTitle}</h3>
                            <label className="top-gap">
                              <span>{t.rateLabel}</span>
                              <select value={feedback.token === selectedComplaint.tokenNumber ? feedback.rating : "0"} onChange={(event) => setFeedback({ token: selectedComplaint.tokenNumber, rating: event.target.value, comment: feedback.token === selectedComplaint.tokenNumber ? feedback.comment : "" })}>
                                {["0", "1", "2", "3", "4", "5"].map((value) => <option key={value} value={value}>{value}</option>)}
                              </select>
                            </label>
                            <label className="top-gap">
                              <span>{t.rateTitle}</span>
                              <textarea value={feedback.token === selectedComplaint.tokenNumber ? feedback.comment : ""} placeholder={t.feedbackPlaceholder} onChange={(event) => setFeedback((prev) => ({ token: selectedComplaint.tokenNumber, rating: prev.token === selectedComplaint.tokenNumber ? prev.rating : "0", comment: event.target.value }))}></textarea>
                            </label>
                            <div className="action-strip top-gap">
                              <button type="button" className="button primary" onClick={handleFeedbackSubmit}>{t.confirmClose}</button>
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </section>
              ) : null}

              {activeSection === "profile" ? (
                <section className="citizen-section active">
                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow small">{t.profileEyebrow}</p>
                        <h3>{t.profileTitle}</h3>
                      </div>
                    </div>
                    <div className="details-list">
                      <div className="detail-card">
                        <p><strong>{t.profileCitizenCode}:</strong> {currentUser?.citizenCode || "-"}</p>
                        <p><strong>{t.profileAnonymous}:</strong> {currentUser?.isAnonymousRegistered ? t.anonymousRegisteredYes : t.anonymousRegisteredNo}</p>
                        <p><strong>{t.profileMobile}:</strong> {currentUser?.mobileNumber || "-"}</p>
                        <p><strong>{t.profileEmail}:</strong> {currentUser?.email || "-"}</p>
                        <p><strong>{t.profilePoints}:</strong> {dashboardData?.user?.rewardPoints || 0}</p>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}
            </section>
          </div>
        </main>
        <ChatbotWidget initialLanguage={language} />
      </div>
    </>
  );
}
