"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  ClipboardCheck,
  Clock3,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { ChatbotWidget } from "../public/ChatbotClient.jsx";
import { LanguageSwitch, PublicTopbar } from "../public/PublicShell.jsx";
import { LocationMapCard } from "../shared/LocationMapCard.jsx";

const departmentCatalog = [
  { code: "ADMIN", division: "Administration", sections: ["Admin Section", "Inspection (Security)", "Fire & Emergency"] },
  { code: "FIN", division: "Finance & Revenue", sections: ["Internal Audit", "Procurement", "Revenue/Tax Units"] },
  { code: "INFRA", division: "Infrastructure Development", sections: ["Road Section", "Bridge Section", "Buildings", "Water & Sewer"] },
  { code: "URBAN", division: "Urban Dev & Environment", sections: ["Tourism", "Sanitation/Waste", "Greenery Units"] },
  { code: "PLANIT", division: "Planning, Monitoring & IT", sections: ["IT Section", "Data & Statistics", "Documentation"] },
  { code: "SOCIAL", division: "Social Development", sections: ["Women/Child Program", "Social Security", "Community Development"] },
  { code: "HEALTH", division: "Health", sections: ["Health Services / Health Center Coordination"] },
  { code: "EDU", division: "Education", sections: ["School Management / Education Programs"] },
  { code: "ECON", division: "Economic Development", sections: ["Business Promotion", "Employment", "Agri & Livestock"] },
  { code: "LEGAL", division: "Legal", sections: ["Legal Advice / Dispute Management"] },
];

const translations = {
  ne: {
    topTitle: "जनसेवा · अधिकृत पोर्टल",
    weekLabel: "साप्ताहिक कार्य अवधि: {week}",
    gov: "पोखरा महानगरपालिका",
    main: "अधिकृत पोर्टल",
    sub: "गुनासो समीक्षा, कार्य प्रगति र विभागीय समन्वय",
    logout: "लगआउट",
    alert: "{count} गुनासोमा प्रारम्भिक समीक्षा बाँकी छ।",
    noAlert: "यस हप्ताका सबै नयाँ गुनासो समयमै समीक्षा भएका छन्।",
    tabNew: "नयाँ गुनासो",
    tabForwarded: "मलाई पठाइएका",
    tabAccepted: "प्रगतिमा",
    tabClosed: "फर्वार्ड / बन्द",
    tabPerformance: "मेरो रिपोर्ट",
    pointsEyebrow: "मेरो अंक",
    pointsCopy: "Performance points",
    solvedMini: "समाधान",
    pendingMini: "बाँकी",
    recentActivity: "हालैको गतिविधि",
    leaderboard: "अंक तालिका",
    kpiReceived: "यस हप्ता प्राप्त",
    kpiForwarded: "मलाई पठाइएका",
    kpiCompleted: "यस हप्ता समाधान",
    kpiResponse: "औसत प्रतिक्रिया",
    kpiPoints: "यस हप्ताको अंक",
    newEyebrow: "नयाँ गुनासो",
    newTitle: "२४ घण्टाभित्र प्रारम्भिक समीक्षा गर्नुहोस्",
    forwardedEyebrow: "मलाई पठाइएका गुनासो",
    forwardedTitle: "अन्य विभागबाट आएका गुनासो",
    acceptedEyebrow: "प्रगतिमा रहेका गुनासो",
    acceptedTitle: "स्वीकृत र कार्यरत गुनासो",
    closedEyebrow: "फर्वार्ड / बन्द",
    closedTitle: "तपाईंले फर्वार्ड वा बन्द गरेका गुनासो",
    performanceEyebrow: "अधिकृत प्रदर्शन",
    performanceTitle: "अंक, इतिहास र साप्ताहिक रिपोर्ट",
    reportButton: "साप्ताहिक रिपोर्ट",
    reviewEyebrow: "गुनासो समीक्षा",
    reviewTitle: "कार्य चयन गरी समीक्षा पठाउनुहोस्",
    reviewAction: "कार्य छान्नुहोस्",
    accept: "स्वीकार गर्नुहोस्",
    forward: "फर्वार्ड गर्नुहोस्",
    escalate: "केन्द्रीय प्रशासनमा पठाउनुहोस्",
    invalid: "अवैध चिन्ह लगाउनुहोस्",
    delay: "ढिलाइ देखाउनुहोस्",
    resolve: "समाधान गरेर बन्द गर्नुहोस्",
    expectedDate: "अपेक्षित सम्पन्न मिति",
    comment: "टिप्पणी",
    forwardDepartment: "लक्ष्य विभाग",
    forwardSection: "लक्ष्य उप-विभाग",
    reviewSubmit: "समीक्षा पठाउनुहोस्",
    actionSuccess: "कार्य सफलतापूर्वक अद्यावधिक भयो।",
    actionFailed: "कार्य पूरा गर्न सकिएन।",
    noComplaints: "यस सूचीमा हाल गुनासो छैन।",
    noSelection: "सूचीबाट गुनासो छान्नुहोस्।",
    urgencyHigh: "अत्यावश्यक",
    status_pending: "समीक्षाधीन",
    status_in_progress: "प्रगतिमा",
    status_solved: "समाधान गरिएको",
    status_delayed: "ढिलाइ",
    status_forwarded: "फर्वार्ड गरिएको",
    status_escalated: "एस्केलेट गरिएको",
    status_pending_admin_verification: "प्रशासन पुष्टि बाँकी",
    reviewButton: "समीक्षा गर्नुहोस्",
    pointsCurrent: "हालको अंक",
    pointsWeek: "यस हप्ताको अंक",
    pointsAll: "कुल अंक",
    feedbackTitle: "केन्द्रीय प्रशासन प्रतिक्रिया",
    noFeedback: "अहिलेसम्म कुनै प्रतिक्रिया छैन।",
    officerNameLabel: "अधिकृत",
    departmentLabel: "कार्यालय",
    citizenLabel: "नागरिक",
    locationLabel: "स्थान",
    mapTitle: "गुनासो स्थान",
    attachmentsLabel: "संलग्न फाइल",
    timelineLabel: "समयरेखा",
    commentsLabel: "टिप्पणीहरू",
    invalidNeedsReason: "अवैध चिन्ह लगाउँदा टिप्पणी आवश्यक छ।",
    forwardNeedsTarget: "फर्वार्ड गर्न लक्ष्य विभाग र उप-विभाग छान्नुहोस्।",
    acceptedNeedsEta: "स्वीकार गर्दा अपेक्षित सम्पन्न मिति आवश्यक छ।",
    delayNeedsEta: "ढिलाइ गर्दा नयाँ मिति आवश्यक छ।",
    escalateNeedsComment: "एस्केलेट गर्दा टिप्पणी आवश्यक छ।",
    resolveNeedsComment: "समाधान गर्दा टिप्पणी आवश्यक छ।",
    downloadHint: "Print dialog opened. Save as PDF if needed.",
    handoverEyebrow: "ह्यान्डओभर समीक्षा",
    handoverTitle: "अघिल्ला अधिकृतले समाधान गरेका गुनासो पुष्टि गर्नुहोस्",
    handoverEmpty: "ह्यान्डओभर समीक्षाको लागि गुनासो छैन।",
    handoverVerify: "पुष्टि गर्नुहोस्",
    handoverFlag: "अपूर्ण चिन्ह लगाउनुहोस्",
    proofImageLabel: "प्रमाण फोटो",
    handoverFlagReason: "अपूर्णताको कारण",
    handoverFlagSubmit: "झण्डा पठाउनुहोस्",
    handoverFlagSuccess: "झण्डा प्रशासनको समीक्षाका लागि पठाइयो।",
    handoverFlagNeedsReason: "कारण आवश्यक छ।",
    handoverFlagPending: "प्रशासन समीक्षाधीन",
    handoverFlagVerified: "पुष्टि भयो",
    handoverFlagRejected: "अस्वीकार गरियो",
    handoverCancel: "रद्द गर्नुहोस्",
    handoverFlaggedBy: "झण्डा लगाउनेः",
    handoverFlagReason2: "कारणः",
    handoverReadOnly: "ह्यान्डओभर समीक्षाका गुनासो यहाँ हेर्न सकिन्छ, तर स्थिति परिवर्तन सामान्य कार्यसूचीबाट मात्र गर्नुहोस्।",
    snapshotEyebrow: "कार्यप्रवाह",
    snapshotTitle: "यस हप्ताको कार्यभार",
    completionTitle: "सम्पादन प्रगति",
    completionRate: "समाधान दर",
    pendingReview: "प्रारम्भिक समीक्षा बाँकी",
  },
  en: {
    topTitle: "JanaSewa · Officer Portal",
    weekLabel: "Weekly duty: {week}",
    gov: "Pokhara Metropolitan City",
    main: "Officer Portal",
    sub: "Complaint review, work progress, and department coordination",
    logout: "Logout",
    alert: "{count} complaints are still waiting for first review.",
    noAlert: "All new complaints have been reviewed on time this week.",
    tabNew: "New Complaints",
    tabForwarded: "Forwarded To Me",
    tabAccepted: "In Progress",
    tabClosed: "Forwarded / Closed",
    tabPerformance: "My Performance",
    pointsEyebrow: "My points",
    pointsCopy: "Performance points",
    solvedMini: "Resolved",
    pendingMini: "Pending",
    recentActivity: "Recent activity",
    leaderboard: "Points leaderboard",
    kpiReceived: "Received this week",
    kpiForwarded: "Forwarded to me",
    kpiCompleted: "Completed this week",
    kpiResponse: "Average response",
    kpiPoints: "Weekly points",
    newEyebrow: "New complaints",
    newTitle: "Complete initial review within 24 hours",
    forwardedEyebrow: "Forwarded to me",
    forwardedTitle: "Complaints received from other departments",
    acceptedEyebrow: "In-progress complaints",
    acceptedTitle: "Accepted complaints under work",
    closedEyebrow: "Forwarded / Closed",
    closedTitle: "Complaints you forwarded or closed",
    performanceEyebrow: "Officer performance",
    performanceTitle: "Points, history, and weekly report",
    reportButton: "Weekly report",
    reviewEyebrow: "Complaint review",
    reviewTitle: "Choose an action and submit review",
    reviewAction: "Select action",
    accept: "Accept",
    forward: "Forward",
    escalate: "Escalate to Central Admin",
    invalid: "Mark Invalid",
    delay: "Delay",
    resolve: "Close as Resolved",
    expectedDate: "Expected completion date",
    comment: "Comment",
    forwardDepartment: "Target department",
    forwardSection: "Target sub department",
    reviewSubmit: "Submit Review",
    actionSuccess: "Action updated successfully.",
    actionFailed: "Could not complete the action.",
    noComplaints: "No complaints in this list right now.",
    noSelection: "Select a complaint from the list.",
    urgencyHigh: "Urgent",
    status_pending: "Under Review",
    status_in_progress: "In Progress",
    status_solved: "Resolved",
    status_delayed: "Delayed",
    status_forwarded: "Forwarded",
    status_escalated: "Escalated",
    status_pending_admin_verification: "Pending Admin Verification",
    reviewButton: "Review",
    pointsCurrent: "Current points",
    pointsWeek: "Points earned this week",
    pointsAll: "All-time points",
    feedbackTitle: "Central admin feedback",
    noFeedback: "No admin feedback yet.",
    officerNameLabel: "Officer",
    departmentLabel: "Office",
    citizenLabel: "Citizen",
    locationLabel: "Location",
    mapTitle: "Complaint location",
    attachmentsLabel: "Attachments",
    timelineLabel: "Timeline",
    commentsLabel: "Comments",
    invalidNeedsReason: "A comment is required when marking invalid.",
    forwardNeedsTarget: "Choose the target department and sub department.",
    acceptedNeedsEta: "Expected completion date is required when accepting.",
    delayNeedsEta: "A new completion date is required for delay.",
    escalateNeedsComment: "A comment is required when escalating.",
    resolveNeedsComment: "A resolution comment is required.",
    downloadHint: "Print dialog opened. Save as PDF if needed.",
    handoverEyebrow: "Handover Review",
    handoverTitle: "Verify resolved complaints from outgoing officers",
    handoverEmpty: "No complaints pending handover review.",
    handoverVerify: "Verify",
    handoverFlag: "Flag as Incomplete",
    proofImageLabel: "Proof Image",
    handoverFlagReason: "Reason for flagging",
    handoverFlagSubmit: "Submit Flag",
    handoverFlagSuccess: "Flag submitted for admin review.",
    handoverFlagNeedsReason: "A reason is required.",
    handoverFlagPending: "Pending Admin Review",
    handoverFlagVerified: "Flag Verified",
    handoverFlagRejected: "Flag Rejected",
    handoverCancel: "Cancel",
    handoverFlaggedBy: "Flagged by:",
    handoverFlagReason2: "Reason:",
    handoverReadOnly: "Handover complaints are view-only here. Use the regular work queue for status changes.",
    snapshotEyebrow: "Workflow pulse",
    snapshotTitle: "Current workload mix",
    completionTitle: "Task completion progress",
    completionRate: "Completion rate",
    pendingReview: "Pending first review",
  },
};

function formatDate(value, language) {
  if (!value) return "-";
  return new Date(value).toLocaleString(language === "ne" ? "ne-NP" : "en-US");
}

function statusClass(status) {
  if (status === "solved") return "department-badge-green";
  if (status === "delayed" || status === "pending_admin_verification") return "department-badge-red";
  if (status === "in_progress") return "department-badge-amber";
  if (status === "forwarded" || status === "escalated") return "department-badge-blue";
  return "department-badge-blue";
}

function safeInitials(name) {
  return (name || "OF")
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function complaintAgeHours(complaint) {
  return Math.max(0, Math.round((Date.now() - new Date(complaint.createdAt).getTime()) / 3600000));
}

function getUrgencyMeta(complaint) {
  if (!complaint?.createdAt) return null;
  if (complaint.status === "solved" || complaint.status === "closed_invalid" || complaint.status === "cannot_solve") {
    return null;
  }
  const age = complaintAgeHours(complaint);
  const hoursLeft = Math.max(0, 24 - age);
  if (age >= 24) {
    return { className: "department-badge-red", label: "OVERDUE", pulse: true };
  }
  if (hoursLeft <= 6) {
    return { className: "department-badge-red", label: `${hoursLeft}h left` };
  }
  if (hoursLeft <= 12) {
    return { className: "department-badge-amber", label: `${hoursLeft}h left` };
  }
  return { className: "department-badge-blue", label: `${hoursLeft}h left` };
}

function handoverFlagBadge(status, text) {
  if (!status) return null;
  if (status === "pending") return { className: "department-badge-amber", label: text.handoverFlagPending };
  if (status === "verified") return { className: "department-badge-red", label: text.handoverFlagVerified };
  if (status === "rejected") return { className: "department-badge-green", label: text.handoverFlagRejected };
  return null;
}

export function DepartmentDashboardClient({ initialTab = "new" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [officer, setOfficer] = useState(null);
  const [departmentAuthToken, setDepartmentAuthToken] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [handoverComplaints, setHandoverComplaints] = useState([]);
  const [selectedComplaintToken, setSelectedComplaintToken] = useState("");
  const [selectedComplaintDetail, setSelectedComplaintDetail] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loadingError, setLoadingError] = useState("");
  const [reviewAction, setReviewAction] = useState("in_progress");
  const [reviewFields, setReviewFields] = useState({
    eta: "",
    comment: "",
    forwardDivision: "",
    forwardSection: "",
    forwardComment: "",
    escalateComment: "",
    invalidComment: "",
    delayEta: "",
    delayComment: "",
    resolveComment: "",
  });
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [flagState, setFlagState] = useState({});
  const departmentSectionRoutes = appRoutes.departmentSections || {
    new: "/department/new",
    forwarded: "/department/forwarded",
    accepted: "/department/accepted",
    closed: "/department/closed",
    handover: "/department/handover",
    performance: "/department/performance",
  };

  const text = translations[currentLanguage];
  const tabKeyMap = {
    new: "newComplaints",
    forwarded: "forwardedToMe",
    accepted: "myAcceptedComplaints",
    closed: "forwardedOrClosed",
    handover: "handover",
    performance: "performance",
  };

  const reviewableComplaints = dashboard
    ? [
        ...(dashboard.tabs?.newComplaints || []),
        ...(dashboard.tabs?.forwardedToMe || []),
        ...(dashboard.tabs?.myAcceptedComplaints || []),
        ...(dashboard.tabs?.forwardedOrClosed || []),
      ]
    : [];
  const selectableComplaints = [...reviewableComplaints, ...handoverComplaints].filter(
    (complaint, index, items) => items.findIndex((item) => item.tokenNumber === complaint.tokenNumber) === index,
  );
  const selectedComplaint =
    selectedComplaintDetail
    || selectableComplaints.find((item) => item.tokenNumber === selectedComplaintToken)
    || null;
  const isReviewableSelection = reviewableComplaints.some((item) => item.tokenNumber === selectedComplaintToken);
  const selectedTabItems = activeTab === "handover"
    ? handoverComplaints
    : activeTab === "performance"
      ? []
      : dashboard?.tabs?.[tabKeyMap[activeTab]] || [];
  const selectedForwardDepartment = departmentCatalog.find(
    (department) => department.division === reviewFields.forwardDivision,
  );
  const forwardSections = selectedForwardDepartment?.sections || [];
  const workflowMix = [
    { key: "new", label: text.tabNew, value: dashboard?.tabs?.newComplaints?.length || 0 },
    { key: "forwarded", label: text.tabForwarded, value: dashboard?.tabs?.forwardedToMe?.length || 0 },
    { key: "accepted", label: text.tabAccepted, value: dashboard?.tabs?.myAcceptedComplaints?.length || 0 },
    { key: "handover", label: text.handoverEyebrow, value: handoverComplaints.length || 0 },
  ];
  const workflowTotal = Math.max(workflowMix.reduce((sum, item) => sum + item.value, 0), 1);
  const completionRate = dashboard?.kpis?.complaintsReceivedThisWeek
    ? Math.round(((dashboard?.kpis?.complaintsCompletedThisWeek || 0) / Math.max(dashboard.kpis.complaintsReceivedThisWeek, 1)) * 100)
    : 0;

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const storedDepartment = sessionStorage.getItem("department_user");
    const storedToken = sessionStorage.getItem("department_auth_token");

    if (!storedDepartment || !storedToken) {
      router.replace(appRoutes.departmentLogin);
      return;
    }

    setOfficer(JSON.parse(storedDepartment));
    setDepartmentAuthToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!departmentAuthToken) return;

    let ignore = false;

    async function loadDashboardData() {
      try {
        setLoadingError("");

        const [dashboardResponse, handoverResponse] = await Promise.all([
          fetch(`${apiBase}/api/officer/dashboard`, {
            headers: { Authorization: `Bearer ${departmentAuthToken}` },
          }),
          fetch(`${apiBase}/api/officer/handover-queue`, {
            headers: { Authorization: `Bearer ${departmentAuthToken}` },
          }),
        ]);

        const dashboardResult = await dashboardResponse.json();
        if (!dashboardResponse.ok) {
          throw new Error(dashboardResult.message || text.actionFailed);
        }

        const nextDashboard = dashboardResult.dashboard;
        const handoverResult = handoverResponse.ok ? await handoverResponse.json() : { handoverComplaints: [] };
        const nextHandover = handoverResult.handoverComplaints || [];

        if (ignore) return;

        setDashboard(nextDashboard);
        setHandoverComplaints(nextHandover);
        setReviewFields((current) => ({
          ...current,
          forwardDivision: current.forwardDivision || departmentCatalog[0]?.division || "",
          forwardSection:
            current.forwardSection
            || departmentCatalog.find((department) => department.division === (current.forwardDivision || departmentCatalog[0]?.division))?.sections?.[0]
            || "",
        }));

        const allComplaints = [
          ...(nextDashboard.tabs?.newComplaints || []),
          ...(nextDashboard.tabs?.forwardedToMe || []),
          ...(nextDashboard.tabs?.myAcceptedComplaints || []),
          ...(nextDashboard.tabs?.forwardedOrClosed || []),
          ...nextHandover,
        ];
        const stillSelected = allComplaints.some((complaint) => complaint.tokenNumber === selectedComplaintToken);
        if (!stillSelected) {
          setSelectedComplaintToken(
            nextDashboard.tabs?.newComplaints?.[0]?.tokenNumber
              || nextDashboard.tabs?.forwardedToMe?.[0]?.tokenNumber
              || nextDashboard.tabs?.myAcceptedComplaints?.[0]?.tokenNumber
              || nextHandover[0]?.tokenNumber
              || "",
          );
        }
      } catch (error) {
        if (!ignore) {
          setLoadingError(error.message || text.actionFailed);
        }
      }
    }

    loadDashboardData();

    return () => {
      ignore = true;
    };
  }, [departmentAuthToken, text.actionFailed]);

  useEffect(() => {
    if (!selectedComplaintToken || !departmentAuthToken) {
      setSelectedComplaintDetail(null);
      return;
    }

    let ignore = false;

    async function loadComplaintDetail() {
      try {
        const response = await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}`, {
          headers: { Authorization: `Bearer ${departmentAuthToken}` },
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || text.actionFailed);
        }
        if (!ignore) {
          setSelectedComplaintDetail(result.complaint || null);
        }
      } catch {
        if (!ignore) {
          const fallback = selectableComplaints.find((item) => item.tokenNumber === selectedComplaintToken) || null;
          setSelectedComplaintDetail(fallback);
        }
      }
    }

    loadComplaintDetail();

    return () => {
      ignore = true;
    };
  }, [departmentAuthToken, dashboard, handoverComplaints, selectedComplaintToken, text.actionFailed]);

  useEffect(() => {
    if (!reviewFields.forwardDivision && departmentCatalog[0]) {
      setReviewFields((current) => ({
        ...current,
        forwardDivision: departmentCatalog[0].division,
        forwardSection: departmentCatalog[0].sections[0] || "",
      }));
    }
  }, [reviewFields.forwardDivision]);

  function statusLabel(status) {
    return text[`status_${status}`] || status || "-";
  }

  function resetActionFields() {
    setReviewFields((current) => ({
      ...current,
      eta: "",
      comment: "",
      forwardComment: "",
      escalateComment: "",
      invalidComment: "",
      delayEta: "",
      delayComment: "",
      resolveComment: "",
    }));
  }

  async function reloadDashboard() {
    if (!departmentAuthToken) return;
    try {
      setLoadingError("");
      const [dashboardResponse, handoverResponse] = await Promise.all([
        fetch(`${apiBase}/api/officer/dashboard`, {
          headers: { Authorization: `Bearer ${departmentAuthToken}` },
        }),
        fetch(`${apiBase}/api/officer/handover-queue`, {
          headers: { Authorization: `Bearer ${departmentAuthToken}` },
        }),
      ]);
      const dashboardResult = await dashboardResponse.json();
      if (!dashboardResponse.ok) {
        throw new Error(dashboardResult.message || text.actionFailed);
      }
      const handoverResult = handoverResponse.ok ? await handoverResponse.json() : { handoverComplaints: [] };
      const nextDashboard = dashboardResult.dashboard;
      const nextHandover = handoverResult.handoverComplaints || [];
      const allComplaints = [
        ...(nextDashboard.tabs?.newComplaints || []),
        ...(nextDashboard.tabs?.forwardedToMe || []),
        ...(nextDashboard.tabs?.myAcceptedComplaints || []),
        ...(nextDashboard.tabs?.forwardedOrClosed || []),
        ...nextHandover,
      ];

      setDashboard(nextDashboard);
      setHandoverComplaints(nextHandover);
      if (!allComplaints.some((complaint) => complaint.tokenNumber === selectedComplaintToken)) {
        setSelectedComplaintToken(
          nextDashboard.tabs?.newComplaints?.[0]?.tokenNumber
            || nextDashboard.tabs?.forwardedToMe?.[0]?.tokenNumber
            || nextDashboard.tabs?.myAcceptedComplaints?.[0]?.tokenNumber
            || nextHandover[0]?.tokenNumber
            || "",
        );
      }
    } catch (error) {
      setLoadingError(error.message || text.actionFailed);
    }
  }

  async function patchStatus(status, comment) {
    const response = await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${departmentAuthToken}`,
      },
      body: JSON.stringify({ status, comment }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || text.actionFailed);
  }

  async function patchEta(estimatedCompletionAt) {
    const response = await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}/eta`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${departmentAuthToken}`,
      },
      body: JSON.stringify({ estimatedCompletionAt }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || text.actionFailed);
  }

  async function patchForward({ targetDivisionName, targetSectionName, comment, escalateToCentralAdmin }) {
    const response = await fetch(`${apiBase}/api/complaints/${selectedComplaintToken}/forward`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${departmentAuthToken}`,
      },
      body: JSON.stringify({
        targetOfficeType: "department",
        targetDivisionName,
        targetSectionName,
        targetWardNumber: "",
        comment,
        escalateToCentralAdmin,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || text.actionFailed);
  }

  async function handleSubmitReview() {
    if (!selectedComplaintToken) return;

    setActionMessage({ type: "", text: "" });

    try {
      if (reviewAction === "in_progress") {
        if (!reviewFields.eta) throw new Error(text.acceptedNeedsEta);
        await patchStatus("in_progress", reviewFields.comment.trim());
        await patchEta(reviewFields.eta);
      } else if (reviewAction === "forward") {
        if (!reviewFields.forwardDivision || !reviewFields.forwardSection) {
          throw new Error(text.forwardNeedsTarget);
        }
        await patchForward({
          targetDivisionName: reviewFields.forwardDivision,
          targetSectionName: reviewFields.forwardSection,
          comment: reviewFields.forwardComment.trim(),
          escalateToCentralAdmin: false,
        });
      } else if (reviewAction === "escalate") {
        if (!reviewFields.escalateComment.trim()) throw new Error(text.escalateNeedsComment);
        await patchForward({
          targetDivisionName: "",
          targetSectionName: "",
          comment: reviewFields.escalateComment.trim(),
          escalateToCentralAdmin: true,
        });
      } else if (reviewAction === "pending_admin_verification") {
        if (!reviewFields.invalidComment.trim()) throw new Error(text.invalidNeedsReason);
        await patchStatus("pending_admin_verification", reviewFields.invalidComment.trim());
      } else if (reviewAction === "delayed") {
        if (!reviewFields.delayEta) throw new Error(text.delayNeedsEta);
        await patchStatus("delayed", reviewFields.delayComment.trim());
        await patchEta(reviewFields.delayEta);
      } else if (reviewAction === "solved") {
        if (!reviewFields.resolveComment.trim()) throw new Error(text.resolveNeedsComment);
        await patchStatus("solved", reviewFields.resolveComment.trim());
      }

      setActionMessage({ type: "success", text: text.actionSuccess });
      resetActionFields();
      await reloadDashboard();
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || text.actionFailed });
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${apiBase}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${departmentAuthToken}` },
      });
    } catch {}

    sessionStorage.removeItem("department_user");
    sessionStorage.removeItem("department_auth_token");
    router.replace(appRoutes.departmentLogin);
  }

  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    const targetRoute = departmentSectionRoutes[nextTab] || appRoutes.departmentPortal;
    if (pathname !== targetRoute) {
      router.push(targetRoute);
    }
  }

  function handleDownloadWeeklyReport() {
    if (!dashboard) return;
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return;
    reportWindow.document.write(`
      <html>
        <head><title>Weekly Officer Report</title></head>
        <body>
          <h1>${dashboard.header.officerName}</h1>
          <p>${dashboard.header.departmentName}</p>
          <p>${dashboard.weekKey}</p>
          <p>${text.pointsCurrent}: ${dashboard.performance.currentWeekPoints}</p>
          <p>${text.pointsAll}: ${dashboard.performance.allTimePoints}</p>
          <ul>
            ${(dashboard.performance.history || []).map((item) => `<li>${item.tokenNumber} - ${item.title} - ${statusLabel(item.status)} - ${item.points} pts</li>`).join("")}
          </ul>
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
    setActionMessage({ type: "success", text: text.downloadHint });
  }

  function updateFlagState(tokenNumber, patch) {
    setFlagState((current) => ({
      ...current,
      [tokenNumber]: {
        ...(current[tokenNumber] || { open: false, reason: "", message: { type: "", text: "" }, submitting: false }),
        ...patch,
      },
    }));
  }

  async function submitHandoverFlag(tokenNumber) {
    const entry = flagState[tokenNumber] || {};
    const reason = (entry.reason || "").trim();
    if (!reason) {
      updateFlagState(tokenNumber, {
        message: { type: "error", text: text.handoverFlagNeedsReason },
      });
      return;
    }

    updateFlagState(tokenNumber, {
      submitting: true,
      message: { type: "", text: "" },
    });

    try {
      const response = await fetch(`${apiBase}/api/complaints/${tokenNumber}/handover-flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${departmentAuthToken}`,
        },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || text.actionFailed);

      updateFlagState(tokenNumber, {
        submitting: false,
        open: false,
        reason: "",
        message: { type: "success", text: text.handoverFlagSuccess },
      });
      await reloadDashboard();
    } catch (error) {
      updateFlagState(tokenNumber, {
        submitting: false,
        message: { type: "error", text: error.message || text.actionFailed },
      });
    }
  }

  if (!officer || !departmentAuthToken) {
    return <BodyConfig className="officer-dashboard-body" />;
  }

  return (
    <>
      <BodyConfig className="officer-dashboard-body" />
      <div className="officer-shell">
        <PublicTopbar title={text.topTitle}>
          <span className="track-link">{text.weekLabel.replace("{week}", dashboard?.weekKey || "-")}</span>
          <LanguageSwitch currentLanguage={currentLanguage} onChange={setCurrentLanguage} />
          <button type="button" className="button secondary compact-button" onClick={handleLogout}>
            {text.logout}
          </button>
        </PublicTopbar>

        <header className="portal-header citizen-header">
          <div className="container citizen-header-inner">
            <div className="brand">
              <div className="brand-mark crest government-emblem">
                <img src="/assets/images/nepal-gov-emblem.png" alt="Government of Nepal emblem" />
              </div>
              <div>
                <p className="eyebrow small">{text.gov}</p>
                <h1>{text.main}</h1>
                <p className="brand-subtitle">{text.sub}</p>
              </div>
            </div>
            <div className="citizen-header-profile">
              <div className="citizen-profile-copy">
                <strong>{dashboard?.header?.officerName || officer.name || "Officer"}</strong>
                <span>{dashboard?.header?.departmentName || officer.departmentName || officer.divisionName || "Department"}</span>
              </div>
              <div className="citizen-profile-avatar">
                {safeInitials(dashboard?.header?.officerName || officer.name)}
              </div>
            </div>
          </div>
        </header>

        <main className="citizen-main">
          <div className="container officer-layout">
            <aside className="officer-sidebar">
              <div className="officer-alert-banner">
                {dashboard?.alerts?.pendingFirstReviewCount
                  ? text.alert.replace("{count}", dashboard.alerts.pendingFirstReviewCount)
                  : text.noAlert}
              </div>

              <div className="officer-sidebar-card">
                {[
                  { key: "new", label: text.tabNew, Icon: LayoutDashboard, badge: dashboard?.tabs?.newComplaints?.length || null },
                  { key: "forwarded", label: text.tabForwarded, Icon: ArrowRightLeft, badge: dashboard?.tabs?.forwardedToMe?.length || null },
                  { key: "accepted", label: text.tabAccepted, Icon: Activity, badge: dashboard?.tabs?.myAcceptedComplaints?.length || null },
                  { key: "closed", label: text.tabClosed, Icon: ClipboardCheck, badge: dashboard?.tabs?.forwardedOrClosed?.length || null },
                  { key: "handover", label: text.handoverEyebrow, Icon: ShieldCheck, badge: handoverComplaints.length || null },
                  { key: "performance", label: text.tabPerformance, Icon: Trophy, badge: dashboard?.header?.currentWeekPoints || null },
                ].map(({ key, label, Icon, badge }) => (
                  <button type="button" className={`officer-side-link ${activeTab === key ? "active" : ""}`} onClick={() => handleTabChange(key)} key={key}>
                    <span className="portal-nav-row">
                      <span className="portal-nav-icon"><Icon size={17} /></span>
                      <span>{label}</span>
                      {badge ? <strong className="portal-nav-badge">{badge}</strong> : null}
                    </span>
                  </button>
                ))}
              </div>

              <div className="officer-sidebar-card">
                <p className="eyebrow small">{text.pointsEyebrow}</p>
                <div className="officer-points-total">{dashboard?.header?.currentWeekPoints || 0}</div>
                <p className="citizen-muted-copy">{text.pointsCopy}</p>
                <div className="officer-points-mini">
                  <div>
                    <strong>{dashboard?.kpis?.complaintsCompletedThisWeek || 0}</strong>
                    <span>{text.solvedMini}</span>
                  </div>
                  <div>
                    <strong>{dashboard?.tabs?.myAcceptedComplaints?.length || 0}</strong>
                    <span>{text.pendingMini}</span>
                  </div>
                </div>
              </div>

              <div className="officer-sidebar-card">
                <p className="eyebrow small">{text.recentActivity}</p>
                {dashboard?.recentActivity?.length ? (
                  dashboard.recentActivity.map((item) => (
                    <div className="department-detail-line officer-activity-line" key={`${item.complaintToken}-${item.timestamp}`}>
                      <strong>{item.complaintToken}</strong>
                      <span>{item.note || item.action}</span>
                      <small>{formatDate(item.timestamp, currentLanguage)}</small>
                    </div>
                  ))
                ) : (
                  <p className="citizen-muted-copy">{text.noComplaints}</p>
                )}
              </div>

              <div className="officer-sidebar-card">
                <p className="eyebrow small">{text.leaderboard}</p>
                {dashboard?.leaderboard?.length ? (
                  dashboard.leaderboard.map((item, index) => (
                    <div className="officer-leaderboard-row" key={`${item.name}-${index}`}>
                      <span>{index + 1}. {item.name}</span>
                      <strong>{item.points}</strong>
                    </div>
                  ))
                ) : (
                  <p className="citizen-muted-copy">{text.noComplaints}</p>
                )}
              </div>
            </aside>

            <section className="officer-main">
              <div className="department-kpi-row officer-kpi-row">
                {[
                  [text.kpiReceived, dashboard?.kpis?.complaintsReceivedThisWeek || 0, "is-red"],
                  [text.kpiForwarded, dashboard?.tabs?.forwardedToMe?.length || 0, "is-blue"],
                  [text.kpiCompleted, dashboard?.kpis?.complaintsCompletedThisWeek || 0, "is-green"],
                  [text.kpiResponse, dashboard?.kpis?.averageResponseTime || 0, "is-amber"],
                  [text.kpiPoints, dashboard?.header?.currentWeekPoints || 0, "is-blue"],
                ].map(([label, value, className]) => (
                  <div className="department-kpi-card citizen-stat-card" key={label}>
                    <div className={`department-kpi-num ${className}`}>{value}</div>
                    <div className="department-kpi-lbl">{label}</div>
                  </div>
                ))}
              </div>

              <div className="officer-snapshot-grid">
                <article className="detail-card officer-snapshot-card">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow small">{text.snapshotEyebrow}</p>
                      <h3>{text.snapshotTitle}</h3>
                    </div>
                    <span className="department-badge department-badge-blue">{workflowTotal - (dashboard?.tabs?.forwardedOrClosed?.length || 0)}</span>
                  </div>
                  <div className="mini-bar-list">
                    {workflowMix.map((item) => (
                      <div className="mini-bar-row" key={item.key}>
                        <div className="mini-bar-head">
                          <strong>{item.label}</strong>
                          <span>{item.value}</span>
                        </div>
                        <div className="mini-bar-track">
                          <div className="mini-bar-fill" style={{ width: `${Math.max((item.value / workflowTotal) * 100, item.value ? 14 : 6)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="detail-card officer-snapshot-card">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow small">{text.performanceEyebrow}</p>
                      <h3>{text.completionTitle}</h3>
                    </div>
                    <span className="department-badge department-badge-green">{completionRate}%</span>
                  </div>
                  <div className="status-mini-grid">
                    <div className="status-mini-card">
                      <span><Sparkles size={16} /></span>
                      <strong>{completionRate}%</strong>
                      <p>{text.completionRate}</p>
                    </div>
                    <div className="status-mini-card">
                      <span><Clock3 size={16} /></span>
                      <strong>{dashboard?.alerts?.pendingFirstReviewCount || 0}</strong>
                      <p>{text.pendingReview}</p>
                    </div>
                    <div className="status-mini-card">
                      <span><Trophy size={16} /></span>
                      <strong>{dashboard?.header?.currentWeekPoints || 0}</strong>
                      <p>{text.kpiPoints}</p>
                    </div>
                    <div className="status-mini-card">
                      <span><AlertTriangle size={16} /></span>
                      <strong>{dashboard?.kpis?.averageResponseTime || 0}</strong>
                      <p>{text.kpiResponse}</p>
                    </div>
                  </div>
                </article>
              </div>

              <div className="officer-tab-bar">
                <button type="button" className={`department-filter-btn ${activeTab === "new" ? "active" : ""}`} onClick={() => handleTabChange("new")}>
                  {text.tabNew}
                </button>
                <button type="button" className={`department-filter-btn ${activeTab === "forwarded" ? "active" : ""}`} onClick={() => handleTabChange("forwarded")}>
                  {text.tabForwarded}
                </button>
                <button type="button" className={`department-filter-btn ${activeTab === "accepted" ? "active" : ""}`} onClick={() => handleTabChange("accepted")}>
                  {text.tabAccepted}
                </button>
                <button type="button" className={`department-filter-btn ${activeTab === "closed" ? "active" : ""}`} onClick={() => handleTabChange("closed")}>
                  {text.tabClosed}
                </button>
                <button type="button" className={`department-filter-btn ${activeTab === "handover" ? "active" : ""}`} onClick={() => handleTabChange("handover")}>
                  {text.handoverEyebrow}
                </button>
                <button type="button" className={`department-filter-btn ${activeTab === "performance" ? "active" : ""}`} onClick={() => handleTabChange("performance")}>
                  {text.tabPerformance}
                </button>
              </div>

              {activeTab !== "performance" ? (
                <section className="officer-section active">
                  <div className="officer-list-panel panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow small">
                          {activeTab === "new" && text.newEyebrow}
                          {activeTab === "forwarded" && text.forwardedEyebrow}
                          {activeTab === "accepted" && text.acceptedEyebrow}
                          {activeTab === "closed" && text.closedEyebrow}
                          {activeTab === "handover" && text.handoverEyebrow}
                        </p>
                        <h3>
                          {activeTab === "new" && text.newTitle}
                          {activeTab === "forwarded" && text.forwardedTitle}
                          {activeTab === "accepted" && text.acceptedTitle}
                          {activeTab === "closed" && text.closedTitle}
                          {activeTab === "handover" && text.handoverTitle}
                        </h3>
                      </div>
                    </div>

                    {selectedTabItems.length ? (
                      selectedTabItems.map((complaint) => {
                        const urgency = getUrgencyMeta(complaint);
                        const flagBadge = activeTab === "handover"
                          ? handoverFlagBadge(complaint.handoverFlagStatus, text)
                          : null;
                        const flagEntry = flagState[complaint.tokenNumber] || {};
                        return (
                          <article className={`officer-complaint-card ${complaint.status === "solved" ? "is-solved" : ""}`} key={complaint.tokenNumber}>
                            <div className="citizen-complaint-card-head">
                              <div>
                                <p className="department-tid">{complaint.tokenNumber}</p>
                                <strong>{complaint.title || complaint.subcategory || complaint.category}</strong>
                                <p>
                                  {complaint.assignedOfficeLabel || "-"} · {complaint.citizenName || complaint.assignedOfficerName || "-"}
                                </p>
                              </div>
                              <div className="officer-card-badges">
                                {flagBadge ? (
                                  <span className={`department-badge ${flagBadge.className}`}>{flagBadge.label}</span>
                                ) : null}
                                {urgency ? (
                                  <span
                                    className={`department-badge ${urgency.className}`}
                                    style={urgency.pulse ? { animation: "pulse 1s infinite" } : undefined}
                                  >
                                    {urgency.label}
                                  </span>
                                ) : null}
                                <span className={`department-badge ${statusClass(activeTab === "handover" ? "solved" : complaint.status)}`}>
                                  {statusLabel(activeTab === "handover" ? "solved" : complaint.status)}
                                </span>
                              </div>
                            </div>
                            <p className="citizen-muted-copy">{complaint.description || "-"}</p>
                            <div className="officer-card-meta">
                              <span>{formatDate(complaint.updatedAt || complaint.createdAt, currentLanguage)}</span>
                              <span>{complaint.citizenName || "Anonymous"}</span>
                            </div>

                            {complaint.handoverFlag ? (
                              <div style={{ marginTop: 8, padding: "8px 12px", background: "#fff8e1", borderLeft: "3px solid #f59e0b", borderRadius: 4, fontSize: "0.875rem" }}>
                                <strong>{text.handoverFlagReason2}</strong> {complaint.handoverFlag.reason || "-"}
                                {complaint.handoverFlag.flaggedByOfficerName ? (
                                  <>
                                    <br />
                                    <strong>{text.handoverFlaggedBy}</strong> {complaint.handoverFlag.flaggedByOfficerName}
                                  </>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="action-strip" style={{ marginTop: 8 }}>
                              <button type="button" className="button primary compact-button" onClick={() => setSelectedComplaintToken(complaint.tokenNumber)}>
                                {activeTab === "handover" ? text.handoverVerify : text.reviewButton}
                              </button>
                              {activeTab === "handover" && complaint.handoverFlagStatus !== "pending" ? (
                                <button
                                  type="button"
                                  className="button secondary compact-button"
                                  onClick={() => updateFlagState(complaint.tokenNumber, { open: !flagEntry.open })}
                                >
                                  {text.handoverFlag}
                                </button>
                              ) : null}
                            </div>

                            {activeTab === "handover" && complaint.handoverFlagStatus !== "pending" && flagEntry.open ? (
                              <div className="handover-flag-form" style={{ marginTop: 12, padding: 12, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                                <label style={{ display: "block", marginBottom: 8 }}>
                                  <span style={{ fontSize: "0.875rem", fontWeight: 600, display: "block", marginBottom: 4 }}>
                                    {text.handoverFlagReason}
                                  </span>
                                  <textarea
                                    rows="3"
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                    placeholder={currentLanguage === "ne" ? "कारण लेख्नुहोस्..." : "Describe the issue with this complaint..."}
                                    value={flagEntry.reason || ""}
                                    onChange={(event) => updateFlagState(complaint.tokenNumber, { reason: event.target.value })}
                                  />
                                </label>
                                <div className="action-strip">
                                  <button
                                    type="button"
                                    className="button primary compact-button"
                                    disabled={Boolean(flagEntry.submitting)}
                                    onClick={() => submitHandoverFlag(complaint.tokenNumber)}
                                  >
                                    {text.handoverFlagSubmit}
                                  </button>
                                  <button
                                    type="button"
                                    className="button secondary compact-button"
                                    onClick={() => updateFlagState(complaint.tokenNumber, { open: false })}
                                  >
                                    {text.handoverCancel}
                                  </button>
                                </div>
                                {flagEntry.message?.text ? (
                                  <div className={`form-message ${flagEntry.message.type}`}>{flagEntry.message.text}</div>
                                ) : null}
                              </div>
                            ) : null}
                          </article>
                        );
                      })
                    ) : (
                      <div className="admin-list-card">
                        <p>{activeTab === "handover" ? text.handoverEmpty : text.noComplaints}</p>
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <section className="officer-section active">
                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow small">{text.performanceEyebrow}</p>
                        <h3>{text.performanceTitle}</h3>
                      </div>
                      <button type="button" className="button dark" onClick={handleDownloadWeeklyReport}>
                        {text.reportButton}
                      </button>
                    </div>
                    <div className="officer-performance-grid">
                      <div className="detail-card">
                        <h3>{text.pointsCurrent}</h3>
                        <p><strong>{dashboard?.performance?.currentWeekPoints || 0}</strong></p>
                        <p>{text.pointsWeek}: {dashboard?.performance?.pointsEarnedThisWeek || 0}</p>
                        <p>{text.pointsAll}: {dashboard?.performance?.allTimePoints || 0}</p>
                      </div>
                      <div className="detail-card">
                        <h3>{text.feedbackTitle}</h3>
                        {dashboard?.performance?.feedback?.length ? (
                          dashboard.performance.feedback.map((entry, index) => (
                            <p key={`${entry.createdAt}-${index}`}>
                              {entry.message || `${entry.points} pts`} · {formatDate(entry.createdAt, currentLanguage)}
                            </p>
                          ))
                        ) : (
                          <p>{text.noFeedback}</p>
                        )}
                      </div>
                    </div>
                    <div className="details-list top-gap">
                      {dashboard?.performance?.history?.length ? (
                        dashboard.performance.history.map((item) => (
                          <article className="admin-list-card" key={`${item.tokenNumber}-${item.updatedAt}`}>
                            <strong>{item.tokenNumber} · {item.title}</strong>
                            <p>{statusLabel(item.status)} · {formatDate(item.updatedAt, currentLanguage)}</p>
                            <p>{item.points ? `+${item.points} pts` : "0 pts"}</p>
                          </article>
                        ))
                      ) : (
                        <div className="admin-list-card">
                          <p>{text.noComplaints}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <div className="panel top-gap">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow small">{text.reviewEyebrow}</p>
                    <h3>{text.reviewTitle}</h3>
                  </div>
                </div>

                {loadingError ? (
                  <div className="detail-card">
                    <p>{loadingError}</p>
                  </div>
                ) : selectedComplaint ? (
                  <div className="details-list citizen-detail-grid">
                    <div className="detail-card">
                      <h3>{selectedComplaint.title || selectedComplaint.subcategory || selectedComplaint.category}</h3>
                      <p><strong>{text.officerNameLabel}:</strong> {dashboard?.header?.officerName || officer.name || "-"}</p>
                      <p><strong>{text.departmentLabel}:</strong> {selectedComplaint.assignedOfficeLabel || "-"}</p>
                      <p><strong>{text.citizenLabel}:</strong> {selectedComplaint.citizenName || "-"}</p>
                      <p><strong>{text.locationLabel}:</strong> {selectedComplaint.locationText || "-"}</p>
                      <p>{selectedComplaint.description || "-"}</p>
                      <p>
                        <strong>{text.attachmentsLabel}:</strong>
                      </p>
                      {selectedComplaint.attachments?.length ? (
                        selectedComplaint.attachments.map((item) => (
                          <a className="track-link" href={item.dataUrl} download={item.name} key={item.name}>
                            {item.name}
                          </a>
                        ))
                      ) : (
                        <p>-</p>
                      )}
                    </div>
                    <LocationMapCard
                      title={text.mapTitle}
                      language={currentLanguage}
                      locationText={selectedComplaint.locationText}
                      locationCoordinates={selectedComplaint.locationCoordinates}
                      wardNumber={selectedComplaint.wardNumber}
                    />

                    <div className="detail-card">
                      <h3>{text.commentsLabel}</h3>
                      {selectedComplaint.comments?.length ? (
                        selectedComplaint.comments.map((item, index) => (
                          <div className="department-detail-line" key={`${item.createdAt}-${index}`}>
                            <strong>{item.actorName}</strong>
                            <span>{item.message}</span>
                            <small>{formatDate(item.createdAt, currentLanguage)}</small>
                          </div>
                        ))
                      ) : (
                        <p>-</p>
                      )}
                    </div>

                    <div className="detail-card">
                      <h3>{text.timelineLabel}</h3>
                      {selectedComplaint.history?.length ? (
                        selectedComplaint.history.map((item, index) => (
                          <div className="department-detail-line" key={`${item.timestamp || item.createdAt}-${index}`}>
                            <strong>{item.action}</strong>
                            <span>{item.note || "-"}</span>
                            <small>{formatDate(item.timestamp || item.createdAt, currentLanguage)}</small>
                          </div>
                        ))
                      ) : (
                        <p>-</p>
                      )}
                    </div>

                    {selectedComplaint.proofImage?.dataUrl ? (
                      <div className="detail-card">
                        <h3>{text.proofImageLabel}</h3>
                        <img
                          src={selectedComplaint.proofImage.dataUrl}
                          alt={selectedComplaint.proofImage.name || "Proof"}
                          style={{ maxWidth: "100%", borderRadius: 8, marginTop: 8 }}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="detail-card">
                    <p>{text.noSelection}</p>
                  </div>
                )}

                {isReviewableSelection ? (
                  <form className="auth-form top-gap" onSubmit={(event) => event.preventDefault()}>
                    <label>
                      <span>{text.reviewAction}</span>
                      <select value={reviewAction} onChange={(event) => setReviewAction(event.target.value)}>
                        <option value="in_progress">{text.accept}</option>
                        <option value="forward">{text.forward}</option>
                        <option value="escalate">{text.escalate}</option>
                        <option value="pending_admin_verification">{text.invalid}</option>
                        <option value="delayed">{text.delay}</option>
                        <option value="solved">{text.resolve}</option>
                      </select>
                    </label>

                    {reviewAction === "in_progress" ? (
                      <div className="officer-action-group">
                        <label>
                          <span>{text.expectedDate}</span>
                          <input
                            className="officer-datetime-input"
                            type="datetime-local"
                            value={reviewFields.eta}
                            onChange={(event) => setReviewFields((current) => ({ ...current, eta: event.target.value }))}
                          />
                        </label>
                        <label>
                          <span>{text.comment}</span>
                          <textarea
                            value={reviewFields.comment}
                            onChange={(event) => setReviewFields((current) => ({ ...current, comment: event.target.value }))}
                            placeholder="Explain the action clearly"
                          />
                        </label>
                      </div>
                    ) : null}

                    {reviewAction === "forward" ? (
                      <div className="officer-action-group">
                        <label>
                          <span>{text.forwardDepartment}</span>
                          <select
                            value={reviewFields.forwardDivision}
                            onChange={(event) => {
                              const nextDivision = event.target.value;
                              const nextSections = departmentCatalog.find((department) => department.division === nextDivision)?.sections || [];
                              setReviewFields((current) => ({
                                ...current,
                                forwardDivision: nextDivision,
                                forwardSection: nextSections[0] || "",
                              }));
                            }}
                          >
                            <option value="">{text.forwardDepartment}</option>
                            {departmentCatalog.map((department) => (
                              <option value={department.division} key={department.code}>
                                {department.division}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>{text.forwardSection}</span>
                          <select
                            value={reviewFields.forwardSection}
                            onChange={(event) => setReviewFields((current) => ({ ...current, forwardSection: event.target.value }))}
                          >
                            <option value="">{text.forwardSection}</option>
                            {forwardSections.map((section) => (
                              <option value={section} key={section}>
                                {section}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="officer-action-group-span">
                          <span>{text.comment}</span>
                          <textarea
                            value={reviewFields.forwardComment}
                            onChange={(event) => setReviewFields((current) => ({ ...current, forwardComment: event.target.value }))}
                            placeholder="Why is this being forwarded?"
                          />
                        </label>
                      </div>
                    ) : null}

                    {reviewAction === "escalate" ? (
                      <div className="officer-action-group">
                        <label className="officer-action-group-span">
                          <span>{text.comment}</span>
                          <textarea
                            value={reviewFields.escalateComment}
                            onChange={(event) => setReviewFields((current) => ({ ...current, escalateComment: event.target.value }))}
                            placeholder="Explain why this needs central admin attention"
                          />
                        </label>
                      </div>
                    ) : null}

                    {reviewAction === "pending_admin_verification" ? (
                      <div className="officer-action-group">
                        <label className="officer-action-group-span">
                          <span>{text.comment}</span>
                          <textarea
                            value={reviewFields.invalidComment}
                            onChange={(event) => setReviewFields((current) => ({ ...current, invalidComment: event.target.value }))}
                            placeholder="Explain why this complaint is invalid"
                          />
                        </label>
                      </div>
                    ) : null}

                    {reviewAction === "delayed" ? (
                      <div className="officer-action-group">
                        <label>
                          <span>{text.expectedDate}</span>
                          <input
                            type="datetime-local"
                            value={reviewFields.delayEta}
                            onChange={(event) => setReviewFields((current) => ({ ...current, delayEta: event.target.value }))}
                          />
                        </label>
                        <label>
                          <span>{text.comment}</span>
                          <textarea
                            value={reviewFields.delayComment}
                            onChange={(event) => setReviewFields((current) => ({ ...current, delayComment: event.target.value }))}
                            placeholder="Explain the reason for delay"
                          />
                        </label>
                      </div>
                    ) : null}

                    {reviewAction === "solved" ? (
                      <div className="officer-action-group">
                        <label className="officer-action-group-span">
                          <span>{text.comment}</span>
                          <textarea
                            value={reviewFields.resolveComment}
                            onChange={(event) => setReviewFields((current) => ({ ...current, resolveComment: event.target.value }))}
                            placeholder="Describe how the complaint was resolved"
                          />
                        </label>
                      </div>
                    ) : null}

                    <div className="action-strip">
                      <button type="button" className="button primary" onClick={handleSubmitReview}>
                        {text.reviewSubmit}
                      </button>
                    </div>
                    {actionMessage.text ? (
                      <div className={`form-message ${actionMessage.type}`}>{actionMessage.text}</div>
                    ) : null}
                  </form>
                ) : selectedComplaint ? (
                  <div className="detail-card top-gap">
                    <p>{text.handoverReadOnly}</p>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </main>
        <ChatbotWidget initialLanguage={currentLanguage} mode="officer" />
      </div>
    </>
  );
}
