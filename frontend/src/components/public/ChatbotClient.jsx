"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  ImagePlus,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { LanguageSwitch, PublicTopbar } from "./PublicShell.jsx";

const translations = {
  en: {
    topbarTitle: "Pokhara Civic Response",
    title: "PNPP Complaint Assistant",
    subtitle: "Share the issue in plain language and I will help prepare the complaint.",
    dockTitle: "AI Complaint Help",
    dockSubtitle: "Quick help for filing and tracking",
    nudgeTitle: "Need help filing?",
    nudgeBody: "The assistant can guide the complaint for you.",
    widgetStatus: "Citizen support online",
    inputPlaceholder: "Describe the problem, location, or department...",
    attachImage: "Attach image",
    attachmentReady: "Image will be sent with the complaint",
    send: "Send",
    back: "Back",
    close: "Close assistant",
    openAssistant: "Open AI assistant",
    confirmTitle: "Complaint draft ready",
    confirmBody: "Review the captured details below. When everything looks correct, submit the complaint.",
    confirmDept: "Department",
    confirmLocation: "Location",
    confirmDesc: "Description",
    confirmPhone: "Phone",
    confirmSubmit: "Confirm & Submit Complaint",
    startOver: "Start over",
    submitting: "Submitting...",
    successTitle: "Complaint filed successfully",
    successBody: "Your complaint has been registered. Use this tracking code to follow progress.",
    successSecondary: "Complaint ID",
    trackNow: "Track Complaint",
    imageError: "Only image files are supported (max 2.5 MB).",
    networkError: "Network error. Please try again.",
    botError: "The assistant could not respond. Please try again.",
    anonymousNotice: "You are not signed in, so this complaint will be registered anonymously.",
    evidenceTag: "Evidence attached",
  },
  ne: {
    topbarTitle: "पोखरा नागरिक प्रतिक्रिया",
    title: "PNPP गुनासो सहायक",
    subtitle: "समस्या सरल भाषामा लेख्नुहोस्, म गुनासो तयार गर्न मद्दत गर्छु।",
    dockTitle: "AI गुनासो सहायक",
    dockSubtitle: "दर्ता र ट्र्याकिङका लागि छिटो सहायता",
    nudgeTitle: "गुनासो दर्तामा मद्दत चाहियो?",
    nudgeBody: "यो सहायकले तपाईंलाई चरण-चरण मार्गदर्शन गर्छ।",
    widgetStatus: "नागरिक सहायता उपलब्ध",
    inputPlaceholder: "समस्या, स्थान वा विभाग लेख्नुहोस्...",
    attachImage: "तस्बिर थप्नुहोस्",
    attachmentReady: "यो तस्बिर गुनासोसँग पठाइनेछ",
    send: "पठाउनुहोस्",
    back: "फर्कनुहोस्",
    close: "सहायक बन्द गर्नुहोस्",
    openAssistant: "AI सहायक खोल्नुहोस्",
    confirmTitle: "गुनासो ड्राफ्ट तयार छ",
    confirmBody: "तलको विवरण जाँच गर्नुहोस्। सबै ठीक भए गुनासो दर्ता गर्नुहोस्।",
    confirmDept: "विभाग",
    confirmLocation: "स्थान",
    confirmDesc: "विवरण",
    confirmPhone: "फोन",
    confirmSubmit: "पुष्टि गरी गुनासो दर्ता गर्नुहोस्",
    startOver: "फेरि सुरु गर्नुहोस्",
    submitting: "पेश गर्दै...",
    successTitle: "गुनासो सफलतापूर्वक दर्ता भयो",
    successBody: "तपाईंको गुनासो दर्ता भयो। प्रगति हेर्न यो ट्र्याकिङ कोड प्रयोग गर्नुहोस्।",
    successSecondary: "गुनासो आईडी",
    trackNow: "गुनासो ट्र्याक",
    imageError: "केवल छवि फाइलहरू समर्थित छन् (अधिकतम २.५ MB)।",
    networkError: "नेटवर्क त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।",
    botError: "सहायकले प्रतिक्रिया दिन सकेन। कृपया पुनः प्रयास गर्नुहोस्।",
    anonymousNotice: "तपाईं लगइन हुनुहुन्न, त्यसैले यो गुनासो गुमनाम रूपमा दर्ता हुनेछ।",
    evidenceTag: "प्रमाण संलग्न",
  },
};

const roleModeTranslations = {
  officer: {
    en: {
      topbarTitle: "Officer Support",
      title: "Officer Help Assistant",
      subtitle: "Ask about review steps, forwarding, ETA updates, handover checks, or attachments.",
      dockTitle: "Officer Help",
      dockSubtitle: "Queue and review guidance",
      widgetStatus: "Officer guidance ready",
      inputPlaceholder: "Ask about accepting, forwarding, ETA, or handover review...",
      send: "Send",
      close: "Close assistant",
      openAssistant: "Open officer assistant",
      startOver: "Start over",
      helpHeading: "What this assistant can help with",
      helpBody: "Queue review steps, forwarding rules, escalation, proof images, map checks, weekly points, and handover review guidance.",
    },
    ne: {
      topbarTitle: "अधिकृत सहायता",
      title: "अधिकृत सहायता सहायक",
      subtitle: "समीक्षा, फर्वार्ड, मिति अद्यावधिक, ह्यान्डओभर जाँच, वा प्रमाण फाइल सम्बन्धी प्रश्न सोध्नुहोस्।",
      dockTitle: "अधिकृत सहायता",
      dockSubtitle: "कार्यसूची र समीक्षा मार्गदर्शन",
      widgetStatus: "अधिकृत सहायता तयार",
      inputPlaceholder: "स्वीकार, फर्वार्ड, मिति वा ह्यान्डओभरबारे सोध्नुहोस्...",
      send: "पठाउनुहोस्",
      close: "बन्द गर्नुहोस्",
      openAssistant: "अधिकृत सहायक खोल्नुहोस्",
      startOver: "फेरि सुरु गर्नुहोस्",
      helpHeading: "यो सहायकले के मद्दत गर्छ",
      helpBody: "कार्यसूची समीक्षा, फर्वार्ड नियम, एस्केलेसन, प्रमाण फोटो, नक्सा जाँच, साप्ताहिक अंक, र ह्यान्डओभर मार्गदर्शन।",
    },
  },
  admin: {
    en: {
      topbarTitle: "Admin Support",
      title: "Admin Command Assistant",
      subtitle: "Ask about oversight, escalations, rotations, analytics, departments, or complaint evidence.",
      dockTitle: "Admin Help",
      dockSubtitle: "Control-room guidance",
      widgetStatus: "Admin guidance ready",
      inputPlaceholder: "Ask about escalations, officers, analytics, or transfers...",
      send: "Send",
      close: "Close assistant",
      openAssistant: "Open admin assistant",
      startOver: "Start over",
      helpHeading: "What this assistant can help with",
      helpBody: "Oversight queues, transfer actions, officer rotation setup, dashboard metrics, analytics charts, and complaint evidence visibility.",
    },
    ne: {
      topbarTitle: "एडमिन सहायता",
      title: "एडमिन कमाण्ड सहायक",
      subtitle: "निगरानी, एस्केलेसन, रोटेसन, विश्लेषण, विभाग, वा प्रमाण सामग्रीबारे सोध्नुहोस्।",
      dockTitle: "एडमिन सहायता",
      dockSubtitle: "नियन्त्रण कक्ष मार्गदर्शन",
      widgetStatus: "एडमिन सहायता तयार",
      inputPlaceholder: "एस्केलेसन, अधिकृत, विश्लेषण वा ट्रान्सफरबारे सोध्नुहोस्...",
      send: "पठाउनुहोस्",
      close: "बन्द गर्नुहोस्",
      openAssistant: "एडमिन सहायक खोल्नुहोस्",
      startOver: "फेरि सुरु गर्नुहोस्",
      helpHeading: "यो सहायकले के मद्दत गर्छ",
      helpBody: "निगरानी सूची, ट्रान्सफर कार्य, अधिकृत रोटेसन, ड्यासबोर्ड मेट्रिक, विश्लेषण चार्ट, र प्रमाण सामग्री दृश्यता।",
    },
  },
  officeAdmin: {
    en: {
      topbarTitle: "Office Setup Support",
      title: "Office Account Assistant",
      subtitle: "Ask about creating department or ward accounts, login IDs, or division and section mapping.",
      dockTitle: "Setup Help",
      dockSubtitle: "Account creation guidance",
      widgetStatus: "Setup guidance ready",
      inputPlaceholder: "Ask about office type, sections, login IDs, or passwords...",
      send: "Send",
      close: "Close assistant",
      openAssistant: "Open setup assistant",
      startOver: "Start over",
      helpHeading: "What this assistant can help with",
      helpBody: "Department versus ward setup, section mapping, login ID patterns, and account-creation reminders.",
    },
    ne: {
      topbarTitle: "कार्यालय सेटअप सहायता",
      title: "कार्यालय खाता सहायक",
      subtitle: "विभाग वा वडा खाता सिर्जना, लगइन आईडी, वा शाखा म्यापिङबारे सोध्नुहोस्।",
      dockTitle: "सेटअप सहायता",
      dockSubtitle: "खाता सिर्जना मार्गदर्शन",
      widgetStatus: "सेटअप सहायता तयार",
      inputPlaceholder: "कार्यालय प्रकार, शाखा, लगइन आईडी वा पासवर्डबारे सोध्नुहोस्...",
      send: "पठाउनुहोस्",
      close: "बन्द गर्नुहोस्",
      openAssistant: "सेटअप सहायक खोल्नुहोस्",
      startOver: "फेरि सुरु गर्नुहोस्",
      helpHeading: "यो सहायकले के मद्दत गर्छ",
      helpBody: "विभाग बनाम वडा सेटअप, शाखा म्यापिङ, लगइन आईडी ढाँचा, र खाता सिर्जना सम्झना।",
    },
  },
};

function readAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, mimeType: file.type, dataUrl: reader.result });
    reader.readAsDataURL(file);
  });
}

function getModeText(mode, language) {
  if (mode === "citizen") {
    return translations[language];
  }
  return roleModeTranslations[mode]?.[language] || roleModeTranslations.officer[language];
}

function getInitialGreeting(language, mode = "citizen") {
  if (mode === "officer") {
    return language === "ne"
      ? "नमस्ते। म अधिकृत सहायता सहायक हुँ। समीक्षा, फर्वार्ड, एस्केलेसन, ह्यान्डओभर, वा प्रमाण सामग्रीबारे प्रश्न सोध्न सक्नुहुन्छ।"
      : "Hello. I’m the officer help assistant. You can ask about complaint review, forwarding, escalation, handover checks, or evidence handling.";
  }
  if (mode === "admin") {
    return language === "ne"
      ? "नमस्ते। म एडमिन सहायता सहायक हुँ। एस्केलेसन, अधिकृत रोटेसन, विश्लेषण, विभाग, वा निगरानी कार्यबारे सोध्न सक्नुहुन्छ।"
      : "Hello. I’m the admin support assistant. Ask about escalations, officer rotations, analytics, departments, or oversight actions.";
  }
  if (mode === "officeAdmin") {
    return language === "ne"
      ? "नमस्ते। म कार्यालय खाता सहायक हुँ। विभाग वा वडा खाता बनाउन, सही शाखा छान्न, वा लगइन संरचना बुझ्न म मद्दत गर्छु।"
      : "Hello. I’m the office account assistant. I can help with department or ward account setup, section selection, and login structure.";
  }
  return language === "ne"
    ? "नमस्ते। म PNPP गुनासो सहायक हुँ। कृपया समस्या कुन विभागसँग सम्बन्धित छ भन्नुहोस्, वा समस्या सीधै वर्णन गर्नुहोस्।"
    : "Hello. I’m the PNPP complaint assistant. Tell me which department the issue belongs to, or simply describe the problem and I will guide you.";
}

function createEmptyDraft(language) {
  return {
    department: "",
    location: "",
    description: "",
    ward_number: null,
    phone: null,
    language,
    categoryHint: "",
    phoneSkipped: false,
  };
}

function mapDepartmentToCategory(department) {
  const d = String(department || "").toLowerCase();
  if (d.includes("road") || d.includes("bridge") || d.includes("सडक") || d.includes("street")) return "road";
  if (d.includes("garbage") || d.includes("waste") || d.includes("sanitation") || d.includes("फोहर")) return "garbage";
  if (d.includes("water") || d.includes("drain") || d.includes("sewer") || d.includes("पानी")) return "water";
  if (d.includes("light") || d.includes("electricity") || d.includes("बत्ती") || d.includes("bijuli") || d.includes("inspection")) return "light";
  if (d.includes("health") || d.includes("hospital") || d.includes("स्वास्थ्य")) return "health";
  if (d.includes("education") || d.includes("school") || d.includes("शिक्षा")) return "education";
  if (d.includes("legal") || d.includes("law") || d.includes("कानून")) return "legal";
  return "other";
}

function getAuthToken() {
  try {
    return sessionStorage.getItem("citizen_auth_token") || null;
  } catch {
    return null;
  }
}

function buildConfirmationJson(draft) {
  return JSON.stringify({
    department: draft.department || "",
    location: draft.location || "",
    description: draft.description || "",
    ward_number: draft.ward_number ?? null,
    phone: draft.phone || null,
    language: draft.language || "en",
  }, null, 2);
}

function buildSuccessMessage(language, trackingCode) {
  return language === "ne"
    ? `तपाईंको गुनासो दर्ता भयो। ट्र्याकिङ कोड: ${trackingCode}`
    : `Your complaint has been registered. Tracking code: ${trackingCode}`;
}

function normalizeDraft(input, language) {
  const wardNumber = Number(input?.ward_number);
  return {
    department: String(input?.department || "").trim(),
    location: String(input?.location || "").trim(),
    description: String(input?.description || "").trim(),
    ward_number: Number.isInteger(wardNumber) ? wardNumber : null,
    phone: input?.phone ? String(input.phone).trim() : null,
    language: input?.language === "ne" ? "ne" : language,
    categoryHint: String(input?.categoryHint || "").trim(),
    phoneSkipped: Boolean(input?.phoneSkipped),
  };
}

function buildStaffAssistantReply(mode, language, text) {
  const normalized = String(text || "").toLowerCase();
  const isNepali = language === "ne";

  if (mode === "officer") {
    if (/(accept|review|eta|due|deadline|initial review|स्वीकार|समीक्षा|मिति|समय)/.test(normalized)) {
      return isNepali
        ? "नयाँ गुनासोमा २४ घण्टाभित्र प्रारम्भिक समीक्षा आवश्यक हुन्छ। गुनासो तपाईंको कार्यक्षेत्रभित्र छ भने `Accept` छान्नुहोस्, अपेक्षित सम्पन्न मिति राख्नुहोस्, र स्पष्ट टिप्पणी लेख्नुहोस्। त्यसपछि गुनासो `In Progress` सूचीमा जान्छ।"
        : "New complaints should receive an initial review within 24 hours. If the issue belongs to your office, choose `Accept`, set an expected completion date, and leave a clear comment. The complaint then moves into the `In Progress` queue.";
    }
    if (/(forward|transfer|other department|फर्वार्ड|ट्रान्सफर)/.test(normalized)) {
      return isNepali
        ? "यदि गुनासो अर्को शाखा वा विभागको हो भने `Forward` प्रयोग गर्नुहोस्। लक्ष्य विभाग र उप-विभाग छान्नुहोस्, किन सारिएको हो भन्ने टिप्पणी दिनुहोस्, र प्रणालीले नयाँ कार्यसूचीमा पठाउँछ।"
        : "If the complaint belongs to another section or department, use `Forward`. Select the target department and sub department, add a transfer comment, and the system will move it into the correct queue.";
    }
    if (/(escalat|central admin|invalid|एस्केलेट|केन्द्रीय|अवैध)/.test(normalized)) {
      return isNepali
        ? "विभागले समाधान गर्न नसक्ने वा प्रशासनिक निर्णय चाहिने गुनासोमा `Escalate to Central Admin` प्रयोग गर्नुहोस्। टिप्पणी अनिवार्य हुन्छ। गलत वा गैर-नगरपालिका गुनासोमा `Mark Invalid` गर्दा पनि स्पष्ट कारण चाहिन्छ।"
        : "Use `Escalate to Central Admin` when the department cannot solve the issue or an administrative decision is required. A comment is mandatory. For non-actionable or invalid complaints, `Mark Invalid` also requires a clear reason.";
    }
    if (/(handover|verify|flag|points|performance|ह्यान्डओभर|पुष्टि|अंक)/.test(normalized)) {
      return isNepali
        ? "ह्यान्डओभर ट्याबमा अघिल्लो अधिकृतले `Solved` गरेका गुनासो जाँचिन्छन्। सही भए `Verify` गर्नुहोस्। अधुरो देखिए `Flag as Incomplete` गरेर कारण पठाउनुहोस्। प्रशासनले पुष्टि गरेपछि अङ्क समायोजन हुन्छ।"
        : "The handover tab is for checking complaints that outgoing officers marked as `Solved`. Use `Verify` when the resolution looks correct. If work is incomplete, choose `Flag as Incomplete` and submit the reason. Admin verification then drives the points adjustment.";
    }
    if (/(photo|image|attachment|map|proof|तस्बिर|प्रमाण|नक्सा|संलग्न)/.test(normalized)) {
      return isNepali
        ? "गुनासो विवरण खोल्दा प्रमाण फोटो, अन्य संलग्न फाइल, र स्थान नक्सा देखिनुपर्छ। नागरिक वा च्याटबोटबाट पठाइएको छवि पनि यही विवरण कार्डमा उपलब्ध हुन्छ।"
        : "When you open a complaint detail, the proof image, attachments, and location map should be visible there. Images uploaded from the citizen form or chatbot appear in the same detail area.";
    }
    return isNepali
      ? "म `Accept`, `Forward`, `Escalate`, `Delay`, `Resolve`, `Handover Review`, प्रमाण फोटो, नक्सा, वा साप्ताहिक कार्यसम्बन्धी प्रश्नमा मद्दत गर्न सक्छु।"
      : "I can help with `Accept`, `Forward`, `Escalate`, `Delay`, `Resolve`, `Handover Review`, proof images, maps, and weekly workflow questions.";
  }

  if (mode === "admin") {
    if (/(escalat|oversight|invalid|review|निगरानी|एस्केलेट|समीक्षा|अवैध)/.test(normalized)) {
      return isNepali
        ? "`Escalations & Reviews` खण्डमा तीन मुख्य सूची छन्: escalated, invalid complaints, र officer action reviews। कुनै गुनासो खोलेपछि निर्णय डेस्कमा टिप्पणी, ट्रान्सफर, वा पुष्टि निर्णय दिन सकिन्छ।"
        : "The `Escalations & Reviews` section has three key queues: escalated complaints, invalid complaints, and officer action reviews. Once you open a complaint, the decision desk lets you comment, transfer, or validate the case.";
    }
    if (/(rotation|officer|activate|schedule|रोटेसन|अधिकृत|सक्रिय)/.test(normalized)) {
      return isNepali
        ? "`Officers & Rotations` मा अधिकृत सक्रियता र साप्ताहिक तालिका दुवै व्यवस्थापन हुन्छ। कुनै अधिकृतलाई काम देखिनुका लागि चालु हप्ताको rotation वा activation आवश्यक हुन्छ।"
        : "Use `Officers & Rotations` to manage both officer activation and weekly scheduling. An officer only sees live work when they are active for the current week through rotation or activation.";
    }
    if (/(analytics|graph|chart|report|dashboard|metrics|विश्लेषण|ग्राफ|रिपोर्ट|ड्यासबोर्ड)/.test(normalized)) {
      return isNepali
        ? "`Analytics & Reports` खण्डले विभागगत गुनासो, solved ratio, pending volume, forwards, र अन्य चार्ट देखाउँछ। `Dashboard` कार्डहरू समग्र संख्याको छिटो सारांश हुन् र refresh गरेपछि नयाँ डेटा देखिन्छ।"
        : "The `Analytics & Reports` section shows department load, solved ratio, pending volume, forwards, and other charts. The `Dashboard` cards are the quick city-wide summary, and refresh pulls the latest complaint state.";
    }
    if (/(department|sub department|transfer|routing|विभाग|शाखा|ट्रान्सफर)/.test(normalized)) {
      return isNepali
        ? "प्रशासनबाट गुनासो अर्को विभागमा पठाउँदा लक्ष्य विभाग र उप-विभाग छानिन्छ। कुनै विभागमा अलग उप-विभाग नभए पहिलो वैध routing option नै प्रयोग गर्नुपर्छ।"
        : "When central admin transfers a complaint, choose the target department and sub department. If a department has no separate sub department, the first valid routing target should be used.";
    }
    if (/(photo|image|attachment|map|proof|तस्बिर|प्रमाण|नक्सा)/.test(normalized)) {
      return isNepali
        ? "एडमिन complaint detail view मा प्रमाण फोटो, अन्य attachments, र captured map coordinates देखिनुपर्छ। नागरिक र अधिकृत दुवै पक्षको अद्यावधिक इतिहास पनि त्यहीँ उपलब्ध हुन्छ।"
        : "In the admin complaint detail view, proof images, attachments, and captured map coordinates should be visible. The same screen should also show the update history from both citizens and officers.";
    }
    return isNepali
      ? "म oversight queues, escalations, officer rotations, analytics, transfers, complaint evidence, र dashboard metrics सम्बन्धी सहायता दिन सक्छु।"
      : "I can help with oversight queues, escalations, officer rotations, analytics, transfers, complaint evidence, and dashboard metrics.";
  }

  if (/(ward|department|section|login|password|वडा|विभाग|शाखा|लगइन|पासवर्ड)/.test(normalized)) {
    return isNepali
      ? "यहाँ विभाग वा वडा account बनाउँदा सही office type छान्नुहोस्। Department mode मा division र section अनिवार्य हुन्छ; ward mode मा ward number आवश्यक हुन्छ। Login ID स्पष्ट र अद्वितीय राख्नुहोस्।"
      : "When creating an account here, choose the correct office type first. Department mode requires a division and section; ward mode requires a ward number. Keep the login ID short, clear, and unique.";
  }
  return isNepali
    ? "म विभाग/वडा खाता सिर्जना, शाखा चयन, लगइन आईडी संरचना, र कार्यालय सेटअप सम्बन्धी छोटो सहायता दिन सक्छु।"
    : "I can help with department or ward account creation, section selection, login ID structure, and office setup guidance.";
}

export function ChatbotClient({ embedded = false, initialLanguage = "en", onRequestClose = null, mode = "citizen" }) {
  const router = useRouter();
  const [language, setLanguage] = useState(initialLanguage === "ne" ? "ne" : "en");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachmentAnnounced, setAttachmentAnnounced] = useState(false);
  const [complaintData, setComplaintData] = useState(createEmptyDraft(initialLanguage === "ne" ? "ne" : "en"));
  const [authToken, setAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  const [complaintId, setComplaintId] = useState(null);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const t = getModeText(mode, language);
  const backLabel = t.back || (language === "ne" ? "फर्कनुहोस्" : "Back");
  const isCitizenMode = mode === "citizen";

  function resetConversation(nextLanguage = language) {
    const normalizedLanguage = nextLanguage === "ne" ? "ne" : "en";
    setLanguage(normalizedLanguage);
    setMessages([{ role: "assistant", content: getInitialGreeting(normalizedLanguage, mode) }]);
    setInputText("");
    setAttachedImage(null);
    setAttachmentAnnounced(false);
    setComplaintData(createEmptyDraft(normalizedLanguage));
    setReadyToSubmit(false);
    setTrackingId(null);
    setComplaintId(null);
    setError(null);
  }

  useEffect(() => {
    resetConversation(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    const syncAuthToken = () => setAuthToken(getAuthToken());
    syncAuthToken();
    window.addEventListener("focus", syncAuthToken);
    document.addEventListener("visibilitychange", syncAuthToken);
    return () => {
      window.removeEventListener("focus", syncAuthToken);
      document.removeEventListener("visibilitychange", syncAuthToken);
    };
  }, []);

  useEffect(() => {
    if (!embedded) {
      document.documentElement.lang = language;
    }
  }, [embedded, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, readyToSubmit, trackingId]);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(appRoutes.home);
  }

  async function handleImageAttach(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2.5 * 1024 * 1024) {
      setError(t.imageError);
      event.target.value = "";
      return;
    }

    const result = await readAsDataUrl(file);
    setAttachedImage(result);
    setAttachmentAnnounced(false);
    setError(null);
    event.target.value = "";
  }

  async function sendMessage() {
    const text = inputText.trim();
    const shouldMentionAttachment = Boolean(attachedImage && !attachmentAnnounced);
    if (!text && !shouldMentionAttachment) return;
    if (isLoading || isSubmitting || trackingId) return;

    const nextUserMessage = {
      role: "user",
      content: text || (language === "ne" ? "तस्बिर संलग्न गरिएको छ।" : "An image has been attached."),
      imagePreview: shouldMentionAttachment ? attachedImage?.dataUrl : null,
    };

    setMessages((prev) => [...prev, nextUserMessage]);
    setInputText("");
    setIsLoading(true);
    setError(null);

    try {
      if (!isCitizenMode) {
        const reply = buildStaffAssistantReply(mode, language, text);
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        setAttachedImage(null);
        setAttachmentAnnounced(false);
        return;
      }

      const response = await fetch(`${apiBase}/api/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          draft: complaintData,
          language,
          image_description: shouldMentionAttachment && attachedImage
            ? `${attachedImage.name} (${attachedImage.mimeType})`
            : "",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.message || t.botError);
        return;
      }

      const nextLanguage = result.language === "ne" ? "ne" : "en";
      setLanguage(nextLanguage);
      const nextDraft = normalizeDraft(result.draft, nextLanguage);

      setComplaintData(nextDraft);
      setReadyToSubmit(Boolean(result.readyToSubmit));
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);

      if (result.cancelled) {
        setComplaintData(createEmptyDraft(nextLanguage));
        setReadyToSubmit(false);
        setAttachedImage(null);
        setAttachmentAnnounced(false);
      } else if (shouldMentionAttachment) {
        setAttachmentAnnounced(true);
      }
    } catch {
      setError(t.networkError);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitComplaint() {
    if (!isCitizenMode) return;
    if (!readyToSubmit || isSubmitting) return;
    const token = authToken || getAuthToken();
    const isAnonymous = !token;
    const category = complaintData.categoryHint || mapDepartmentToCategory(complaintData.department);

    setIsSubmitting(true);
    setError(null);

    const payload = {
      title: String(complaintData.description || complaintData.department || "Citizen Complaint").slice(0, 100),
      category,
      description: complaintData.description,
      location: complaintData.location,
      locationText: complaintData.location,
      wardNumber: complaintData.ward_number ? String(complaintData.ward_number) : "",
      ward_number: complaintData.ward_number ?? null,
      phone: complaintData.phone || "",
      priority: "medium",
      anonymous: isAnonymous,
    };

    if (attachedImage) {
      payload.proofImage = {
        name: attachedImage.name,
        mimeType: attachedImage.mimeType,
        dataUrl: attachedImage.dataUrl,
      };
    }

    const endpoint = isAnonymous
      ? `${apiBase}/api/complaints/anonymous`
      : `${apiBase}/api/complaints`;

    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || t.networkError);
        return;
      }

      const complaintToken = result.complaint?.tokenNumber || null;
      const primaryTrackingId = result.anonymousTrackingToken || complaintToken || `PMC-${Date.now()}`;

      setTrackingId(primaryTrackingId);
      setComplaintId(complaintToken);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: buildSuccessMessage(language, primaryTrackingId) },
      ]);
      setAttachedImage(null);
      setAttachmentAnnounced(false);
      setReadyToSubmit(false);
    } catch {
      setError(t.networkError);
    } finally {
      setIsSubmitting(false);
    }
  }

  const conversationWindow = (
    <div className="stitch-chat-window">
      <div className="stitch-chat-messages" aria-live="polite" aria-label="Conversation">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`stitch-chat-bubble stitch-chat-bubble--${message.role}`}>
            {message.imagePreview ? (
              <div className="stitch-chat-image-preview">
                <img src={message.imagePreview} alt="Attached evidence" />
              </div>
            ) : null}
            <p className="stitch-chat-bubble-text">{message.content}</p>
          </div>
        ))}

        {isLoading ? (
          <div className="stitch-chat-bubble stitch-chat-bubble--assistant stitch-chat-bubble--loading">
            <span className="stitch-chat-typing" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </span>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {attachedImage ? (
        <div className="stitch-chat-attachment-strip">
          <img src={attachedImage.dataUrl} alt={attachedImage.name} className="stitch-chat-thumb" />
          <div className="stitch-chat-attachment-copy">
            <span className="stitch-chat-attachment-name">{attachedImage.name}</span>
            <small>{t.attachmentReady}</small>
          </div>
          <button
            type="button"
            className="stitch-chat-remove-attachment"
            onClick={() => {
              setAttachedImage(null);
              setAttachmentAnnounced(false);
            }}
            aria-label="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="stitch-chat-error" role="alert">
          {error}
        </div>
      ) : null}

      {isCitizenMode && !authToken && !trackingId ? (
        <div className="stitch-chat-inline-note">
          <Sparkles size={15} />
          <span>{t.anonymousNotice}</span>
        </div>
      ) : null}

      {isCitizenMode && readyToSubmit && !trackingId ? (
        <div className="stitch-chat-confirm-panel">
          <p className="stitch-chat-confirm-title">{t.confirmTitle}</p>
          <p className="stitch-chat-confirm-copy">{t.confirmBody}</p>
          <ul className="stitch-chat-confirm-list">
            <li><strong>{t.confirmDept}:</strong> {complaintData.department || "-"}</li>
            <li><strong>{t.confirmLocation}:</strong> {complaintData.location || "-"}</li>
            <li><strong>{t.confirmDesc}:</strong> {complaintData.description || "-"}</li>
            <li><strong>{t.confirmPhone}:</strong> {complaintData.phone || "-"}</li>
          </ul>
          <pre className="stitch-chat-json-preview">{buildConfirmationJson(complaintData)}</pre>
          <div className="stitch-chat-confirm-actions">
            <button
              type="button"
              className="button primary"
              onClick={submitComplaint}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="stitch-spin" style={{ marginRight: "0.4rem" }} />
                  {t.submitting}
                </>
              ) : t.confirmSubmit}
            </button>
            <button type="button" className="button secondary-outline" onClick={() => setReadyToSubmit(false)}>
              {t.startOver}
            </button>
          </div>
        </div>
      ) : null}

      {isCitizenMode && trackingId ? (
        <div className="stitch-chat-success-panel">
          <p className="stitch-chat-success-title">{t.successTitle}</p>
          <div className="track-pill stitch-chat-tracking-id">{trackingId}</div>
          {complaintId && complaintId !== trackingId ? (
            <p className="stitch-chat-secondary-id"><strong>{t.successSecondary}:</strong> {complaintId}</p>
          ) : null}
          <p className="stitch-chat-success-body">{t.successBody}</p>
          <div className="stitch-chat-success-actions">
            <a href={`${appRoutes.track}?query=${encodeURIComponent(trackingId)}`} className="button primary">
              {t.trackNow}
            </a>
            <button type="button" className="button secondary-outline" onClick={() => resetConversation(language)}>
              {t.startOver}
            </button>
          </div>
        </div>
      ) : null}

      {!trackingId ? (
        <div className="stitch-chat-inputrow">
          {isCitizenMode ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="stitch-chat-file-input"
                onChange={handleImageAttach}
                aria-label={t.attachImage}
              />
              <button
                type="button"
                className="stitch-chat-icon-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label={t.attachImage}
                title={t.attachImage}
              >
                <ImagePlus size={20} />
              </button>
            </>
          ) : null}
          <input
            type="text"
            className="stitch-chat-input"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder={t.inputPlaceholder}
            disabled={isLoading || isSubmitting}
            maxLength={1000}
            aria-label={t.inputPlaceholder}
          />
          <button
            type="button"
            className="stitch-chat-send-btn button primary"
            onClick={sendMessage}
            disabled={isLoading || isSubmitting || (!inputText.trim() && !(isCitizenMode && attachedImage && !attachmentAnnounced))}
            aria-label={t.send}
          >
            {isLoading ? <Loader2 size={18} className="stitch-spin" /> : <Send size={18} />}
          </button>
        </div>
      ) : null}
    </div>
  );

  if (embedded) {
    return (
      <div className="stitch-chat-embedded">
        <div className="stitch-chat-embedded-head">
          <div className="stitch-chat-header stitch-chat-header--compact">
            <div className="stitch-chat-avatar" aria-hidden="true">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="stitch-chat-title">{t.title}</h2>
              <p className="stitch-chat-subtitle">{t.widgetStatus}</p>
            </div>
          </div>
          <div className="stitch-chat-embedded-actions">
            <LanguageSwitch currentLanguage={language} onChange={resetConversation} />
            {onRequestClose ? (
              <button type="button" className="stitch-chat-close-btn" onClick={onRequestClose} aria-label={t.close}>
                <X size={18} />
              </button>
            ) : null}
          </div>
        </div>
        {conversationWindow}
      </div>
    );
  }

  return (
    <>
      <BodyConfig />
      <div className="pnpp-public-page stitch-chat-page">
        <PublicTopbar title={t.topbarTitle}>
          <div className="stitch-chat-topbar-actions">
            <button type="button" className="stitch-chat-back-btn" onClick={goBack}>
              <ArrowLeft size={16} />
              <span>{backLabel}</span>
            </button>
            <LanguageSwitch currentLanguage={language} onChange={resetConversation} />
          </div>
        </PublicTopbar>

        <main className="stitch-chat-main container">
          <div className="stitch-chat-header">
            <div className="stitch-chat-avatar" aria-hidden="true">
              <Bot size={28} />
            </div>
            <div>
              <h1 className="stitch-chat-title">{t.title}</h1>
              <p className="stitch-chat-subtitle">{t.subtitle}</p>
            </div>
          </div>
          {conversationWindow}
        </main>
      </div>
    </>
  );
}

export function ChatbotWidget({ initialLanguage = "en", mode = "citizen" }) {
  const [isOpen, setIsOpen] = useState(false);
  const language = initialLanguage === "ne" ? "ne" : "en";
  const t = getModeText(mode, language);
  const isCitizenMode = mode === "citizen";
  const showCitizenNudge = isCitizenMode && !isOpen;

  return (
    <div className={`stitch-chat-dock ${isOpen ? "is-open" : ""} ${showCitizenNudge ? "is-popping" : ""}`}>
      {null}

      {isOpen ? (
        <div className="stitch-chat-dock-panel">
          <ChatbotClient embedded initialLanguage={language} onRequestClose={() => setIsOpen(false)} mode={mode} />
        </div>
      ) : null}

      <button
        type="button"
        className={`stitch-chat-launcher ${showCitizenNudge ? "is-nudging" : ""}`}
        onClick={() => setIsOpen((value) => !value)}
        aria-label={t.openAssistant}
      >
        <span className="stitch-chat-launcher-icon">
          <MessageSquare size={20} />
        </span>
        <span className="stitch-chat-launcher-copy">
          <strong>{t.dockTitle}</strong>
          <small>{t.dockSubtitle}</small>
        </span>
      </button>
    </div>
  );
}
