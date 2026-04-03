import "dotenv/config";
import crypto from "node:crypto";
import http from "node:http";
import { appConfig } from "./config/appConfig.js";
import { createLocalRepositories } from "./localStore.js";
import {
  connectToDatabase,
  getDatabase,
  getCollections,
  getUserRepository,
  getOfficeAccountRepository,
  getSessionRepository,
  getAssignmentCounterRepository,
  getCommentRepository,
  getComplaintRepository,
  getDepartmentRepository,
  getWardRepository,
  getAdminRepository,
} from "./config/db.js";

const routes = [
  "POST /api/chatbot",
  "POST /api/complaints/anonymous",
  "POST /api/auth/register",
  "POST /api/auth/login",
  "POST /api/auth/admin-login",
  "POST /api/auth/department-login",
  "POST /api/auth/logout",
  "GET /api/admin/dashboard",
  "GET /api/admin/departments",
  "POST /api/admin/departments",
  "PATCH /api/admin/departments/:code",
  "DELETE /api/admin/departments/:code",
  "GET /api/admin/officers",
  "POST /api/admin/officers",
  "PATCH /api/admin/officers/:id",
  "GET /api/admin/rotations",
  "POST /api/admin/rotations",
  "GET /api/admin/oversight",
  "PATCH /api/admin/oversight/:tokenNumber",
  "GET /api/admin/office-accounts",
  "POST /api/admin/office-accounts",
  "GET /api/admin/analytics",
  "GET /api/public/overview",
  "GET /api/citizen/dashboard",
  "GET /api/officer/dashboard",
  "GET /api/officer/handover-queue",
  "GET /api/admin/complaints",
  "GET /api/complaints/track",
  "GET /api/complaints/mine",
  "POST /api/complaints",
  "GET /api/complaints/:tokenNumber",
  "PATCH /api/complaints/:tokenNumber/feedback",
  "GET /api/officer/complaints",
  "POST /api/complaints/:tokenNumber/comments",
  "PATCH /api/complaints/:tokenNumber/status",
  "PATCH /api/complaints/:tokenNumber/eta",
  "PATCH /api/complaints/:tokenNumber/forward",
  "POST /api/complaints/:tokenNumber/handover-flag",
  "PATCH /api/admin/officers/:id/adjustments/:index",
];

const adminCredentials = {
  loginId: "admin@pokharamun.gov.np",
  password: "admin",
  name: "Super Admin",
};

const sessionDurationMs = 1000 * 60 * 60 * 12;

const directDepartmentMap = {
  road: { divisionName: "Infrastructure Development", sectionName: "Road Section" },
  drainage: { divisionName: "Infrastructure Development", sectionName: "Water & Sewer" },
  water: { divisionName: "Infrastructure Development", sectionName: "Water & Sewer" },
  garbage: { divisionName: "Urban Dev & Environment", sectionName: "Sanitation/Waste" },
  light: { divisionName: "Administration", sectionName: "Inspection (Security)" },
  health: { divisionName: "Health", sectionName: "Health Services / Health Center Coordination" },
  education: { divisionName: "Education", sectionName: "School Management / Education Programs" },
};

const routingRules = [
  { keywords: ["road", "pothole", "bridge", "blacktop", "street", "बाटो", "पोथोल", "पुल", "सडक", "ब्ल्याकटप"], divisionName: "Infrastructure Development", sectionName: "Road Section" },
  { keywords: ["water", "pipe", "sewer", "drain", "drainage", "पानी", "धारा", "ढल", "पाइप", "नाली"], divisionName: "Infrastructure Development", sectionName: "Water & Sewer" },
  { keywords: ["garbage", "waste", "sanitation", "trash", "फोहर", "कचरा", "सफाई", "फोहोर", "मैला"], divisionName: "Urban Dev & Environment", sectionName: "Sanitation/Waste" },
  { keywords: ["tree", "park", "greenery", "tourism", "बोट", "पार्क", "हरियाली", "पर्यटन", "वन"], divisionName: "Urban Dev & Environment", sectionName: "Greenery Units" },
  { keywords: ["school", "teacher", "education", "विद्यालय", "शिक्षक", "शिक्षा", "पाठशाला", "कलेज"], divisionName: "Education", sectionName: "School Management / Education Programs" },
  { keywords: ["hospital", "clinic", "health", "medicine", "अस्पताल", "स्वास्थ्य", "औषधि", "क्लिनिक", "चिकित्सा"], divisionName: "Health", sectionName: "Health Services / Health Center Coordination" },
  { keywords: ["tax", "revenue", "procurement", "audit", "कर", "राजस्व", "खरिद", "लेखापरीक्षण"], divisionName: "Finance & Revenue", sectionName: "Revenue/Tax Units" },
  { keywords: ["job", "employment", "business", "agri", "livestock", "रोजगार", "व्यापार", "कृषि", "पशुपालन", "उद्योग"], divisionName: "Economic Development", sectionName: "Employment" },
  { keywords: ["law", "legal", "dispute", "कानून", "विवाद", "न्याय", "मुद्दा", "अदालत", "कानूनी"], divisionName: "Legal", sectionName: "Legal Advice / Dispute Management" },
  { keywords: ["electricity", "light", "streetlight", "bijuli", "बिजुली", "बत्ती", "स्ट्रिटलाइट"], divisionName: "Administration", sectionName: "Inspection (Security)" },
  { keywords: ["paperwork", "certificate", "registration", "citizenship", "प्रमाणपत्र", "दर्ता", "नागरिकता", "कागजात"], divisionName: "Administration", sectionName: "Admin Section" },
];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });

    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });
}

function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashPassword(password) {
  return hashValue(password);
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function parseCoordinatesFromText(value) {
  const match = String(value || "").match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return {
    latitude: Math.round(latitude * 1e6) / 1e6,
    longitude: Math.round(longitude * 1e6) / 1e6,
  };
}

function normalizeCoordinates(input, fallbackText = "") {
  if (input && typeof input === "object") {
    const latitude = Number(input.latitude ?? input.lat);
    const longitude = Number(input.longitude ?? input.lng ?? input.lon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
      return {
        latitude: Math.round(latitude * 1e6) / 1e6,
        longitude: Math.round(longitude * 1e6) / 1e6,
      };
    }
  }

  return parseCoordinatesFromText(fallbackText);
}

function departmentSectionsForRouting(department, departments = []) {
  const directSections = Array.isArray(department?.subDepartments)
    ? department.subDepartments.map((item) => String(item).trim()).filter(Boolean)
    : [];
  if (directSections.length) return directSections;

  const childSections = departments
    .filter((item) => String(item.parentCode || "").trim().toUpperCase() === String(department?.code || "").trim().toUpperCase())
    .map((item) => String(item.name || "").trim())
    .filter(Boolean);
  if (childSections.length) return childSections;

  return String(department?.name || "").trim() ? [String(department.name).trim()] : [];
}

function resolveDepartmentRoutingTarget(departments, input = {}) {
  const departmentCode = String(input.departmentCode || "").trim().toUpperCase();
  const divisionName = String(input.divisionName || "").trim();
  const sectionName = String(input.sectionName || "").trim();

  const resolveLeafDepartment = (leafDepartment) => {
    const parentDepartment = departments.find(
      (department) =>
        String(department.code || "").trim().toUpperCase()
        === String(leafDepartment.parentCode || "").trim().toUpperCase(),
    );
    return {
      departmentCode: parentDepartment?.code || leafDepartment.parentCode || leafDepartment.code || departmentCode,
      divisionName: parentDepartment?.name || divisionName || leafDepartment.name || "",
      sectionName: sectionName || leafDepartment.name || "",
    };
  };

  const byCode = departmentCode
    ? departments.find((department) => String(department.code || "").trim().toUpperCase() === departmentCode)
    : null;
  if (byCode) {
    if (String(byCode.parentCode || "").trim()) {
      return resolveLeafDepartment(byCode);
    }

    const routedSections = departmentSectionsForRouting(byCode, departments);
    return {
      departmentCode: byCode.code || departmentCode,
      divisionName: byCode.name || divisionName,
      sectionName: sectionName || routedSections[0] || byCode.name || "",
    };
  }

  const byDivisionName = divisionName
    ? departments.find((department) => normalizeText(department.name) === normalizeText(divisionName))
    : null;
  if (byDivisionName) {
    if (String(byDivisionName.parentCode || "").trim()) {
      return resolveLeafDepartment(byDivisionName);
    }

    const routedSections = departmentSectionsForRouting(byDivisionName, departments);
    return {
      departmentCode: byDivisionName.code || departmentCode,
      divisionName: byDivisionName.name || divisionName,
      sectionName: sectionName || routedSections[0] || byDivisionName.name || "",
    };
  }

  const bySectionName = sectionName
    ? departments.find((department) => normalizeText(department.name) === normalizeText(sectionName))
    : null;
  if (bySectionName && String(bySectionName.parentCode || "").trim()) {
    return resolveLeafDepartment(bySectionName);
  }

  return {
    departmentCode,
    divisionName,
    sectionName,
  };
}

function sanitizeCitizen(user) {
  return {
    id: String(user._id),
    name: user.name,
    mobileNumber: user.mobileNumber,
    citizenCode: user.citizenCode || "",
    email: user.email || "",
    isAnonymousRegistered: Boolean(user.isAnonymousRegistered),
    rewardPoints: Number(user.rewardPoints || 0),
    role: user.role,
  };
}

function sanitizeOfficeAccount(account) {
  return {
    id: String(account._id),
    officeType: account.officeType,
    role: account.role,
    name: account.name,
    loginId: account.loginId,
    email: account.email || "",
    phone: account.phone || "",
    departmentCode: account.departmentCode || "",
    divisionName: account.divisionName || "",
    sectionName: account.sectionName || "",
    wardNumber: account.wardNumber || "",
    status: account.status || "active",
    assignmentWeeks: getEffectiveAssignmentWeeks(account),
    isOnDutyThisWeek: isOfficerOnDutyThisWeek(account),
    activationStartAt: account.activationStartAt || null,
    activationExpiresAt: account.activationExpiresAt || endOfCurrentWeek().toISOString(),
    currentWeekPoints: Number(account.currentWeekPoints || 0),
    allTimePoints: Number(account.allTimePoints || 0),
  };
}

function sanitizeDepartment(department) {
  return {
    id: String(department._id || department.code),
    code: department.code,
    name: department.name,
    type: department.type || "Mahashakha",
    parentCode: department.parentCode || "",
    wards: department.wards || [],
    subDepartments: department.subDepartments || [],
    description: department.description || "",
    active: department.active !== false,
    createdAt: department.createdAt || null,
    updatedAt: department.updatedAt || null,
  };
}

function sanitizeRotation(rotation) {
  return {
    id: String(rotation._id),
    officerId: String(rotation.officerId),
    officerName: rotation.officerName,
    officeType: rotation.officeType,
    departmentCode: rotation.departmentCode || "",
    divisionName: rotation.divisionName || "",
    sectionName: rotation.sectionName || "",
    wardNumber: rotation.wardNumber || "",
    startDate: rotation.startDate,
    endDate: rotation.endDate,
    weekKeys: rotation.weekKeys || [],
    active: Boolean(rotation.active),
    createdBy: rotation.createdBy || "",
    createdAt: rotation.createdAt || null,
  };
}

function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

async function createSession(repositories, principal) {
  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = hashValue(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionDurationMs);

  await repositories.sessions.createSession({
    tokenHash,
    principal,
    createdAt: now,
    expiresAt,
    revokedAt: null,
  });

  return { token, expiresAt };
}

async function requireAuth(req, res, repositories, allowedRoles = []) {
  const rawToken = extractBearerToken(req);
  if (!rawToken) {
    sendJson(res, 401, { success: false, message: "Authentication required." });
    return null;
  }

  const session = await repositories.sessions.findByTokenHash(hashValue(rawToken));
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    sendJson(res, 401, { success: false, message: "Session expired or invalid." });
    return null;
  }

  if (allowedRoles.length && !allowedRoles.includes(session.principal.role)) {
    sendJson(res, 403, { success: false, message: "Access denied for this role." });
    return null;
  }

  return session.principal;
}

function generateComplaintToken() {
  const year = new Date().getFullYear();
  const serial = crypto.randomInt(100000, 999999);
  return `PMC-${year}-${serial}`;
}

function generateCitizenCode() {
  const serial = crypto.randomInt(1000, 9999);
  return `CIT-${serial}`;
}

function getCurrentWeekKey() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const day = Math.floor((now - start) / 86400000);
  const week = Math.ceil((day + start.getUTCDay() + 1) / 7);
  return `${now.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekKeyForDate(value) {
  const now = new Date(value);
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const day = Math.floor((now - start) / 86400000);
  const week = Math.ceil((day + start.getUTCDay() + 1) / 7);
  return `${now.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekKeysBetween(startDate, endDate) {
  const keys = new Set();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    keys.add(getWeekKeyForDate(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return [...keys];
}

function getEffectiveAssignmentWeeks(account) {
  const weeks = Array.isArray(account?.assignmentWeeks)
    ? account.assignmentWeeks.map((item) => String(item).trim()).filter(Boolean)
    : [];

  if (weeks.length) return weeks;
  if (account?.status === "active") return [getCurrentWeekKey()];
  return [];
}

function isOfficerOnDutyThisWeek(account, weekKey = getCurrentWeekKey()) {
  if (!account || account.status === "inactive") return false;
  return getEffectiveAssignmentWeeks(account).includes(weekKey);
}

function startOfCurrentWeek() {
  const date = new Date();
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
}

function endOfCurrentWeek() {
  const start = startOfCurrentWeek();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function normalizeCategory(category) {
  const value = normalizeText(category);
  if (value.includes("road")) return "road";
  if (value.includes("garbage") || value.includes("waste")) return "garbage";
  if (value.includes("water")) return "water";
  if (value.includes("drain")) return "drainage";
  if (value.includes("light")) return "light";
  if (value.includes("health")) return "health";
  if (value.includes("education") || value.includes("school")) return "education";
  return "other";
}

function inferWardNumber(inputWardNumber, locationText) {
  const direct = String(inputWardNumber || "").trim();
  if (direct) return direct;

  const match = String(locationText || "").match(/ward\s*(\d{1,2})/i);
  return match ? match[1] : "";
}

// In-memory rate limiters for chatbot and anonymous complaints
const chatbotRateLimiter = new Map();
const anonymousComplaintRateLimiter = new Map();

function checkRateLimit(map, ip, maxPerHour) {
  const now = Date.now();
  const windowMs = 3_600_000;
  const entry = map.get(ip);
  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxPerHour) return false;
  entry.count++;
  return true;
}

function getClientIp(req) {
  return String(
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "unknown"
  ).trim();
}

function sanitizeImagePayload(image) {
  if (!image || typeof image !== "object") return null;
  const name = String(image.name || "").trim();
  const mimeType = String(image.mimeType || "").trim();
  const dataUrl = String(image.dataUrl || "").trim();

  if (!mimeType.startsWith("image/")) return null;
  if (!dataUrl.startsWith("data:image/")) return null;
  if (dataUrl.length > 2_500_000) return null;

  return { name, mimeType, dataUrl };
}

function sanitizeAttachmentPayload(attachment) {
  if (!attachment || typeof attachment !== "object") return null;

  const name = String(attachment.name || "").trim();
  const mimeType = String(attachment.mimeType || "").trim();
  const dataUrl = String(attachment.dataUrl || "").trim();

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (!name || !allowedTypes.includes(mimeType) || !dataUrl.startsWith("data:")) return null;
  if (dataUrl.length > 4_500_000) return null;

  return { name, mimeType, dataUrl };
}

const nepaliDigitMap = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};

const chatbotDepartmentCatalog = [
  {
    category: "road",
    labelEn: "Road & Infrastructure",
    labelNe: "सडक तथा पूर्वाधार",
    keywords: ["road", "street", "bridge", "pothole", "blacktop", "footpath", "बाटो", "सडक", "पुल", "खाल्डो", "पोथोल"],
  },
  {
    category: "water",
    labelEn: "Water & Sewer",
    labelNe: "पानी तथा ढल",
    keywords: ["water", "pipe", "leak", "leakage", "sewer", "drain", "drainage", "tap", "pani", "पानी", "ढल", "नाली", "धारा", "पाइप"],
  },
  {
    category: "garbage",
    labelEn: "Sanitation & Environment",
    labelNe: "सरसफाई तथा वातावरण",
    keywords: ["garbage", "waste", "sanitation", "trash", "cleaning", "collection", "फोहर", "फोहोर", "कचरा", "सरसफाई", "सफाई"],
  },
  {
    category: "light",
    labelEn: "Administration & Inspection",
    labelNe: "प्रशासन तथा निरीक्षण",
    keywords: ["light", "electricity", "streetlight", "power", "wire", "inspection", "bijuli", "बत्ती", "बिजुली", "विद्युत"],
  },
  {
    category: "health",
    labelEn: "Health Services",
    labelNe: "स्वास्थ्य सेवा",
    keywords: ["health", "hospital", "clinic", "medicine", "doctor", "अस्पताल", "स्वास्थ्य", "क्लिनिक", "चिकित्सा", "औषधि"],
  },
  {
    category: "education",
    labelEn: "Education Services",
    labelNe: "शिक्षा सेवा",
    keywords: ["school", "teacher", "education", "college", "classroom", "विद्यालय", "शिक्षा", "शिक्षक", "कलेज", "पढाइ"],
  },
  {
    category: "legal",
    labelEn: "Legal Affairs",
    labelNe: "कानुनी सेवा",
    keywords: ["legal", "law", "dispute", "court", "कानून", "कानुनी", "विवाद", "न्याय", "मुद्दा"],
  },
  {
    category: "other",
    labelEn: "Administration / General Support",
    labelNe: "प्रशासन / सामान्य सहायता",
    keywords: ["certificate", "paperwork", "registration", "citizenship", "tax", "revenue", "employment", "business", "प्रमाणपत्र", "कागजात", "दर्ता", "नागरिकता", "राजस्व", "रोजगार"],
  },
];

function toAsciiDigits(value) {
  return String(value || "").replace(/[०-९]/g, (digit) => nepaliDigitMap[digit] || digit);
}

function collapseSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function detectChatbotLanguage(text, fallback = "en") {
  return /[\u0900-\u097F]/.test(String(text || "")) ? "ne" : (fallback === "ne" ? "ne" : "en");
}

function getChatbotDepartmentByCategory(category) {
  return chatbotDepartmentCatalog.find((item) => item.category === category) || null;
}

function labelChatbotDepartment(option, language = "en") {
  if (!option) return "";
  return language === "ne" ? option.labelNe : option.labelEn;
}

function inferDepartmentFromText(text) {
  const normalized = normalizeText(toAsciiDigits(text));
  if (!normalized) return null;
  return chatbotDepartmentCatalog.find((option) => option.keywords.some((keyword) => normalized.includes(normalizeText(toAsciiDigits(keyword))))) || null;
}

function extractWardNumberFromText(text) {
  const normalized = toAsciiDigits(String(text || ""));
  const match = normalized.match(/(?:ward|वडा)\s*(?:number|no\.?|नं\.?)?\s*(\d{1,2})/i);
  if (!match) return null;

  const ward = Number(match[1]);
  if (!Number.isInteger(ward) || ward < 1 || ward > 33) return null;
  return ward;
}

function extractPhoneFromText(text) {
  const normalized = toAsciiDigits(String(text || "")).replace(/[^\d]/g, " ");
  const match = normalized.match(/\b(9\d{9})\b/);
  return match ? match[1] : null;
}

function isChatbotConfirmationText(text) {
  const normalized = normalizeText(toAsciiDigits(text)).replace(/[.!?]/g, "");
  const exactMatches = [
    "confirm",
    "yes",
    "correct",
    "submit",
    "proceed",
    "go ahead",
    "looks good",
    "ok",
    "okay",
    "हो",
    "पुष्टि",
    "ठिक छ",
    "सही छ",
    "सहि छ",
  ];
  if (exactMatches.includes(normalized)) return true;

  return [
    /\b(confirm|submit|proceed|approve)\b/i,
    /\b(?:yes|ok|okay)\b.*\b(?:submit|proceed|go ahead|continue)\b/i,
    /\b(?:go ahead|looks good|all good|that's right|thats right)\b/i,
    /(पुष्टि|पेश|दर्ता|ठिक छ|सही छ|सहि छ)/,
  ].some((pattern) => pattern.test(normalized));
}

function isChatbotCancelText(text) {
  const normalized = normalizeText(toAsciiDigits(text)).replace(/[.!?]/g, "");
  const exactMatches = [
    "cancel",
    "stop",
    "abort",
    "nevermind",
    "never mind",
    "रद्द",
    "बन्द",
    "रोक",
    "चाहिँदैन",
  ];
  if (exactMatches.includes(normalized)) return true;

  return [
    /\b(cancel|stop|abort|never ?mind|dont submit|do not submit|forget it)\b/i,
    /(रद्द|बन्द|रोक|चाहिँदैन)/,
  ].some((pattern) => pattern.test(normalized));
}

function isChatbotPhoneSkipText(text) {
  const normalized = normalizeText(toAsciiDigits(text)).replace(/[.!?]/g, "");
  const exactMatches = [
    "skip",
    "no phone",
    "none",
    "prefer not",
    "without phone",
    "स्किप",
    "फोन छैन",
    "छोड्नुहोस्",
    "छोड्नुस",
  ];
  if (exactMatches.includes(normalized)) return true;

  return [
    /\b(skip|no phone|without phone|prefer not|dont want to share|do not want to share|no contact)\b/i,
    /(स्किप|फोन छैन|छोड्नुहोस्|छोड्नुस)/,
  ].some((pattern) => pattern.test(normalized));
}

function sanitizeChatbotText(text, maxLength) {
  return collapseSpaces(String(text || "").slice(0, maxLength));
}

function sanitizeChatbotLocation(text) {
  return sanitizeChatbotText(text, 180);
}

function sanitizeChatbotDescription(text) {
  return sanitizeChatbotText(text, 800);
}

function extractLocationPhrase(text) {
  const normalized = sanitizeChatbotLocation(text);
  const narrativeMatch = normalized.match(/(?:at|in|on|near|around)\s+([^.!?]+)/i);
  if (narrativeMatch?.[1]) {
    return sanitizeChatbotLocation(narrativeMatch[1].replace(/\s+\.$/, ""));
  }
  const wardMatch = normalized.match(/(?:ward|वडा)\s*(?:number|no\.?|नं\.?)?\s*\d{1,2}[^.!?]*/i);
  if (wardMatch?.[0]) {
    return sanitizeChatbotLocation(wardMatch[0]);
  }
  return "";
}

function parseChatbotDraft(input, fallbackLanguage = "en") {
  const rawWardNumber = sanitizeChatbotText(input?.ward_number, 4);
  const wardNumber = rawWardNumber ? Number(toAsciiDigits(rawWardNumber)) : null;
  return {
    department: sanitizeChatbotText(input?.department, 80),
    location: sanitizeChatbotLocation(input?.location),
    description: sanitizeChatbotDescription(input?.description),
    ward_number: Number.isInteger(wardNumber) ? wardNumber : null,
    phone: input?.phone ? sanitizeChatbotText(input.phone, 30) : null,
    language: input?.language === "ne" ? "ne" : (fallbackLanguage === "ne" ? "ne" : "en"),
    categoryHint: sanitizeChatbotText(input?.categoryHint, 40),
    phoneSkipped: Boolean(input?.phoneSkipped),
  };
}

function identifyChatbotMissingRequired(draft) {
  const missing = [];
  if (!draft.department) missing.push("department");
  if (!draft.location) missing.push("location");
  if (!draft.description) missing.push("description");
  return missing;
}

function buildChatbotJsonBlock(draft) {
  return JSON.stringify({
    department: draft.department || "",
    location: draft.location || "",
    description: draft.description || "",
    ward_number: draft.ward_number ?? null,
    phone: draft.phone || null,
    language: draft.language || "en",
  }, null, 2);
}

function mergeChatbotDraft(baseDraft, patch, fallbackLanguage = "en") {
  const nextLanguage = patch?.language === "ne" ? "ne" : (baseDraft.language === "ne" ? "ne" : (fallbackLanguage === "ne" ? "ne" : "en"));
  const merged = {
    ...baseDraft,
    language: nextLanguage,
  };

  if (patch?.department) merged.department = sanitizeChatbotText(patch.department, 80);
  if (patch?.location) merged.location = sanitizeChatbotLocation(patch.location);
  if (patch?.description) merged.description = sanitizeChatbotDescription(patch.description);
  if (patch?.phone) merged.phone = sanitizeChatbotText(patch.phone, 30);
  if (typeof patch?.phoneSkipped === "boolean") merged.phoneSkipped = patch.phoneSkipped;

  const rawWardNumber = sanitizeChatbotText(patch?.ward_number, 4);
  const wardNumber = rawWardNumber ? Number(toAsciiDigits(rawWardNumber)) : null;
  if (Number.isInteger(wardNumber) && wardNumber >= 1 && wardNumber <= 33) {
    merged.ward_number = wardNumber;
  }

  if (patch?.categoryHint) {
    merged.categoryHint = sanitizeChatbotText(patch.categoryHint, 40);
  }

  const departmentOption = getChatbotDepartmentByCategory(merged.categoryHint) || inferDepartmentFromText(merged.department);
  if (departmentOption) {
    merged.categoryHint = departmentOption.category;
    merged.department = labelChatbotDepartment(departmentOption, nextLanguage);
  }

  if (!merged.location && Number.isInteger(merged.ward_number)) {
    merged.location = nextLanguage === "ne" ? `वडा ${merged.ward_number}` : `Ward ${merged.ward_number}`;
  }

  return merged;
}

function buildLocalChatbotPatch(message, draft, fallbackLanguage = "en") {
  const patch = {
    language: detectChatbotLanguage(message, draft.language || fallbackLanguage),
  };
  const normalizedMessage = sanitizeChatbotText(message, 1000);
  const wordCount = normalizedMessage.split(/\s+/).filter(Boolean).length;
  const missingBefore = identifyChatbotMissingRequired(draft);
  const primaryMissing = missingBefore[0] || "";
  const departmentOption = inferDepartmentFromText(normalizedMessage);
  const wardNumber = extractWardNumberFromText(normalizedMessage);
  const phone = extractPhoneFromText(normalizedMessage);
  const cleanedText = collapseSpaces(
    normalizedMessage
      .replace(/\b(?:my\s+phone(?:\s+number)?\s+is|phone(?:\s+number)?\s+is|contact(?:\s+number)?\s+is)\s*9\d{9}\b/gi, " ")
      .replace(/(?:मेरो\s+फोन(?:\s+नम्बर)?|फोन(?:\s+नम्बर)?)[\s:]*9\d{9}/g, " ")
      .replace(/\b9\d{9}\b/g, " "),
  )
    .replace(/\s+\./g, ".")
    .replace(/\.\s*\./g, ".")
    .replace(/[.\s]+$/, "")
    .trim();
  const locationPhrase = extractLocationPhrase(cleanedText);

  if (!draft.department && departmentOption) {
    patch.categoryHint = departmentOption.category;
    patch.department = labelChatbotDepartment(departmentOption, patch.language);
  }

  if (wardNumber !== null) {
    patch.ward_number = wardNumber;
  }

  if (phone) {
    patch.phone = phone;
  }

  if (!draft.location) {
    if (primaryMissing === "location" && (locationPhrase || cleanedText)) {
      patch.location = locationPhrase || cleanedText;
    } else if (wardNumber !== null && (locationPhrase || cleanedText)) {
      patch.location = locationPhrase || cleanedText;
    }
  }

  if (!draft.description) {
    if (primaryMissing === "description" && wordCount >= 2) {
      patch.description = cleanedText;
    } else if (missingBefore.length >= 2 && wordCount >= 6) {
      patch.description = cleanedText;
    }
  }

  return patch;
}

function shouldUseDeepSeekForChatbot(message, draft, localPatch) {
  if (!appConfig.deepseekApiKey) return false;
  const normalizedMessage = sanitizeChatbotText(message, 1000);
  if (!normalizedMessage) return false;
  if (isChatbotCancelText(normalizedMessage) || isChatbotConfirmationText(normalizedMessage) || isChatbotPhoneSkipText(normalizedMessage)) {
    return false;
  }

  const missingBefore = identifyChatbotMissingRequired(draft);
  const wordCount = normalizedMessage.split(/\s+/).filter(Boolean).length;

  if (missingBefore.length >= 2 && wordCount >= 7) return true;
  if (!draft.department && !localPatch.department && wordCount >= 5) return true;
  if (!draft.location && !localPatch.location && wordCount >= 6) return true;
  return false;
}

async function callDeepSeekChatbotExtraction({ message, draft, imageDescription }) {
  if (!appConfig.deepseekApiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appConfig.deepseekApiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.2,
        max_tokens: 220,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You extract structured municipal complaint fields from a single citizen message. Return JSON only with keys department, location, description, ward_number, phone, language. Never invent facts. If a field is not explicit or strongly implied, use an empty string or null.",
          },
          {
            role: "user",
            content: JSON.stringify({
              draft,
              message,
              image_description: imageDescription || "",
            }),
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const inferredDepartment = inferDepartmentFromText(parsed.department || parsed.description || message);

    return {
      department: parsed.department ? sanitizeChatbotText(parsed.department, 80) : "",
      location: parsed.location ? sanitizeChatbotLocation(parsed.location) : "",
      description: parsed.description ? sanitizeChatbotDescription(parsed.description) : "",
      ward_number: parsed.ward_number ?? null,
      phone: parsed.phone ? sanitizeChatbotText(parsed.phone, 30) : "",
      language: parsed.language === "ne" ? "ne" : draft.language,
      categoryHint: inferredDepartment?.category || "",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildChatbotReply(draft, language, { confirmed = false } = {}) {
  const missing = identifyChatbotMissingRequired(draft);
  if (missing[0] === "department") {
    return language === "ne"
      ? "कृपया समस्या कुन विभागसँग सम्बन्धित छ भन्नुहोस्। उदाहरण: सडक, पानी, बत्ती, सरसफाई, स्वास्थ्य वा शिक्षा।"
      : "Please tell me which department this issue belongs to. For example: road, water, electricity, sanitation, health, or education.";
  }

  if (missing[0] === "location") {
    return language === "ne"
      ? "कृपया स्थान बताउनुहोस्। वडा नम्बर, टोल, वा नजिकको चिनारी उल्लेख गर्न सक्नुहुन्छ।"
      : "Please share the location. You can mention the ward number, area, or a nearby landmark.";
  }

  if (missing[0] === "description") {
    return language === "ne"
      ? "अब समस्याको छोटो तर स्पष्ट विवरण दिनुहोस्, ताकि सही रूपमा दर्ता गर्न सकियोस्।"
      : "Now please describe the problem clearly so I can prepare the complaint accurately.";
  }

  if (!draft.phone && !draft.phoneSkipped && !confirmed) {
    return language === "ne"
      ? "यदि चाहनुहुन्छ भने अपडेटका लागि फोन नम्बर दिनुहोस्। दिन नचाहे 'skip' वा 'स्किप' भन्न सक्नुहुन्छ।"
      : "If you want updates, you can share a phone number now. If you prefer not to, reply with 'skip'.";
  }

  const jsonBlock = buildChatbotJsonBlock(draft);
  if (confirmed) {
    return language === "ne"
      ? `धन्यवाद। मैले अन्तिम दर्ताका लागि विवरण तयार गरेको छु:\n\n${jsonBlock}\n\nतलको बटन थिचेर गुनासो दर्ता गर्नुहोस्।`
      : `Thanks. I have prepared the final complaint draft:\n\n${jsonBlock}\n\nUse the button below to register the complaint.`;
  }

  return language === "ne"
    ? `मैले हालसम्म यो विवरण संकलन गरेको छु:\n\n${jsonBlock}\n\nयदि सबै ठीक छ भने 'confirm', 'yes', वा 'पुष्टि' लेख्नुहोस्। केही सच्याउनुपर्छ भने त्यसैगरी लेख्नुहोस्।`
    : `I have collected the following complaint details so far:\n\n${jsonBlock}\n\nIf everything looks correct, reply with 'confirm' or 'yes'. If something should change, just tell me what to update.`;
}

function determineDepartmentRoute(category, text) {
  const primary = directDepartmentMap[category] || null;
  const normalized = normalizeText(text);

  let matched = [];
  for (const rule of routingRules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      matched.push({ divisionName: rule.divisionName, sectionName: rule.sectionName });
    }
  }

  // Pick primary: prefer explicit category map, then first keyword match
  const primaryRoute = primary || matched[0] || { divisionName: "Administration", sectionName: "Admin Section" };
  // Secondary: first keyword match that differs from primary
  const secondaryRoute = matched.find(
    (m) => m.divisionName !== primaryRoute.divisionName || m.sectionName !== primaryRoute.sectionName
  ) || null;

  return { primary: primaryRoute, secondary: secondaryRoute };
}

async function routeAndAssignComplaint(repositories, payload) {
  const wardNumber = inferWardNumber(payload.wardNumber, payload.locationText);
  const category = normalizeCategory(payload.category);
  const routingText = `${payload.subcategory} ${payload.description} ${payload.locationText}`;
  const currentWeek = getCurrentWeekKey();

  let officeType = "department";
  let divisionName = "";
  let sectionName = "";
  let routeBucket = "";

  if (wardNumber && ["garbage", "light", "other"].includes(category)) {
    officeType = "ward";
    routeBucket = `ward:${wardNumber}`;
  } else {
    const departmentRoute = determineDepartmentRoute(category, routingText);
    divisionName = departmentRoute.primary.divisionName;
    sectionName = departmentRoute.primary.sectionName;
    routeBucket = `department:${divisionName}:${sectionName}`;
    payload._secondaryDivisionName = departmentRoute.secondary?.divisionName || "";
    payload._secondarySectionName = departmentRoute.secondary?.sectionName || "";
  }

  const candidates = officeType === "ward"
    ? await repositories.officeAccounts.listByOfficeType("ward")
    : await repositories.officeAccounts.listByOfficeType("department");

  const matchingCandidates = candidates
    .filter((candidate) => isOfficerOnDutyThisWeek(candidate, currentWeek))
    .filter((candidate) => {
      if (officeType === "ward") {
        return String(candidate.wardNumber) === String(wardNumber);
      }

      return candidate.divisionName === divisionName && candidate.sectionName === sectionName;
    })
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

  if (!matchingCandidates.length) {
    return {
      officeType: "central_admin",
      role: "admin",
      wardNumber,
      divisionName,
      sectionName,
      routeBucket: "central-admin",
      assignmentReason: "No officer available in the routed office, escalated to central admin.",
      assignedOfficer: null,
    };
  }

  // Round-robin assignment:
  // Every routed office bucket keeps a sequence counter. We increment the bucket
  // and assign the complaint to the officer at `sequence % matchingCandidates.length`,
  // which spreads incoming complaints evenly among available officers.
  const sequence = await repositories.assignmentCounters.advanceCounter(routeBucket);
  const assignedOfficer = matchingCandidates[sequence % matchingCandidates.length];

  return {
    officeType,
    role: assignedOfficer.role,
    wardNumber,
    divisionName,
    sectionName,
    routeBucket,
    secondaryDivisionName: payload._secondaryDivisionName || "",
    secondarySectionName: payload._secondarySectionName || "",
    assignmentReason: `Automatically routed to ${officeType === "ward" ? `Ward ${wardNumber}` : `${divisionName} / ${sectionName}`}.`,
    assignedOfficer,
  };
}

async function assignSpecificOffice(repositories, target) {
  const officeType = target.officeType;
  const currentWeek = getCurrentWeekKey();
  const candidates = officeType === "ward"
    ? await repositories.officeAccounts.listByOfficeType("ward")
    : await repositories.officeAccounts.listByOfficeType("department");

  const matchingCandidates = candidates
    .filter((candidate) => isOfficerOnDutyThisWeek(candidate, currentWeek))
    .filter((candidate) => {
      if (officeType === "ward") {
        return String(candidate.wardNumber) === String(target.wardNumber);
      }

      return candidate.divisionName === target.divisionName && candidate.sectionName === target.sectionName;
    })
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

  if (!matchingCandidates.length) {
    return {
      officeType: "central_admin",
      assignedOfficer: null,
      divisionName: target.divisionName || "",
      sectionName: target.sectionName || "",
      wardNumber: target.wardNumber || "",
      routeBucket: "central-admin",
      assignmentReason: "No officer available in the selected forwarding target, escalated to central admin.",
    };
  }

  const routeBucket = officeType === "ward"
    ? `ward:${target.wardNumber}`
    : `department:${target.divisionName}:${target.sectionName}`;
  const sequence = await repositories.assignmentCounters.advanceCounter(routeBucket);
  const assignedOfficer = matchingCandidates[sequence % matchingCandidates.length];

  return {
    officeType,
    assignedOfficer,
    divisionName: target.divisionName || "",
    sectionName: target.sectionName || "",
    wardNumber: target.wardNumber || "",
    routeBucket,
    assignmentReason: "Complaint manually forwarded to selected office.",
  };
}

function complaintSummaryForCitizen(complaint) {
  return {
    tokenNumber: complaint.tokenNumber,
    title: complaint.title || complaint.subcategory || complaint.category,
    category: complaint.category,
    subcategory: complaint.subcategory,
    description: complaint.description,
    locationText: complaint.locationText,
    locationCoordinates: complaint.locationCoordinates || normalizeCoordinates(null, complaint.locationText),
    wardNumber: complaint.wardNumber || "",
    status: complaint.status,
    priority: complaint.priority,
    estimatedCompletionAt: complaint.estimatedCompletionAt || null,
    assignedOfficeLabel: complaint.assignedOfficeLabel,
    assignedDepartment: complaint.assignedDepartment || complaint.divisionName || "",
    forwardedTo: complaint.forwardedTo || "",
    escalated: Boolean(complaint.escalated),
    delayReason: complaint.delayReason || "",
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt || complaint.createdAt,
    firstResponseAt: complaint.firstResponseAt || null,
    slaDueAt: complaint.slaDueAt,
    assignedOfficerName: complaint.assignedOfficerName || "",
    isSlaBreached: !complaint.firstResponseAt && new Date(complaint.slaDueAt).getTime() < Date.now(),
    proofImage: complaint.proofImage ? { name: complaint.proofImage.name, mimeType: complaint.proofImage.mimeType, dataUrl: complaint.proofImage.dataUrl } : null,
    attachments: (complaint.attachments || []).map((attachment) => ({
      name: attachment.name,
      mimeType: attachment.mimeType,
      dataUrl: attachment.dataUrl,
    })),
    anonymous: Boolean(complaint.anonymous),
    rewardEligible: !Boolean(complaint.anonymous),
    anonymousTrackingToken: complaint.anonymousTrackingToken || null,
    citizenRating: complaint.citizenRating || 0,
    closureConfirmedAt: complaint.closureConfirmedAt || null,
    pointsAwarded: Number(complaint.pointsAwarded || 0),
    validityVerified: Boolean(complaint.validityVerified),
    acceptedAt: complaint.acceptedAt || null,
    acceptedByOfficerId: complaint.acceptedByOfficerId || "",
  };
}

function complaintSummaryForOfficer(complaint) {
  return {
    ...complaintSummaryForCitizen(complaint),
    citizenName: complaint.contactName || "Anonymous",
    citizenPhone: complaint.contactPhone || "",
    citizenEmail: complaint.contactEmail || "",
    assignedOfficerId: complaint.assignedOfficerId || "",
    assignedOfficerName: complaint.assignedOfficerName || "",
    routeBucket: complaint.routeBucket,
    officeType: complaint.officeType,
    history: complaint.history || [],
    comments: complaint.comments || [],
  };
}

function buildAuditEntry(tokenNumber, actor, action, message) {
  return {
    complaintToken: tokenNumber,
    actorRole: actor.role,
    actorName: actor.name,
    action,
    message,
    createdAt: new Date(),
  };
}

function pointsForComplaint(complaint) {
  if (complaint.anonymous) return 0;
  if (complaint.priority === "high") return 60;
  if (complaint.priority === "low") return 20;
  return 40;
}

function officerPointsForComplaint(complaint) {
  const base = complaint.priority === "high" ? 30 : complaint.priority === "low" ? 10 : 20;
  if (!complaint.acceptedAt || !complaint.updatedAt) return base;
  const resolutionHours = Math.max(1, Math.round((new Date(complaint.updatedAt).getTime() - new Date(complaint.acceptedAt).getTime()) / 3600000));
  return resolutionHours <= 48 ? base + 10 : base;
}

function computeOfficerPerformance(account, complaints) {
  const weekStart = startOfCurrentWeek().getTime();
  const handled = complaints.filter((item) => item.assignedOfficerId === String(account._id));
  const completed = handled.filter((item) => item.status === "solved");
  const accepted = handled.filter((item) => item.acceptedAt);
  const thisWeekReceived = handled.filter((item) => new Date(item.createdAt).getTime() >= weekStart);
  const thisWeekCompleted = completed.filter((item) => new Date(item.updatedAt || item.createdAt).getTime() >= weekStart);
  const responseTimes = accepted.map((item) => {
    const submitted = new Date(item.createdAt).getTime();
    const acceptedAt = new Date(item.acceptedAt).getTime();
    return Math.max(1, Math.round((acceptedAt - submitted) / 3600000));
  });
  const averageResponseTime = responseTimes.length
    ? `${Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)}h`
    : "-";
  const adjustments = account.performanceAdjustments || [];
  // Only count verified adjustments (or legacy entries without a status field)
  const verifiedAdjustments = adjustments.filter((entry) => !entry.status || entry.status === "verified");
  const allTimePoints = completed.reduce((sum, item) => sum + officerPointsForComplaint(item), 0)
    + verifiedAdjustments.reduce((sum, entry) => sum + Number(entry.points || 0), 0);
  const currentWeekPoints = thisWeekCompleted.reduce((sum, item) => sum + officerPointsForComplaint(item), 0)
    + verifiedAdjustments.filter((entry) => new Date(entry.createdAt || 0).getTime() >= weekStart).reduce((sum, entry) => sum + Number(entry.points || 0), 0);

  return {
    currentWeekPoints,
    allTimePoints,
    complaintsReceivedThisWeek: thisWeekReceived.length,
    complaintsCompletedThisWeek: thisWeekCompleted.length,
    averageResponseTime,
    history: handled.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()),
  };
}

function buildOfficerDashboard(account, complaints, allAccounts) {
  const weekKey = getCurrentWeekKey();
  const performance = computeOfficerPerformance(account, complaints);
  const currentOfficerId = String(account._id);
  const departmentComplaints = account.officeType === "ward"
    ? complaints.filter((item) => String(item.wardNumber) === String(account.wardNumber))
    : complaints.filter((item) => item.divisionName === account.divisionName);
  const newComplaints = departmentComplaints.filter((item) =>
    item.status === "pending" && (!item.acceptedByOfficerId || item.assignedOfficerId === currentOfficerId));
  const forwardedToMe = departmentComplaints.filter((item) =>
    item.status === "forwarded" && (!item.acceptedByOfficerId || item.assignedOfficerId === currentOfficerId || isWithinOfficerOfficeScope(account, item)));
  const myAccepted = departmentComplaints.filter((item) =>
    item.assignedOfficerId === currentOfficerId && ["in_progress", "delayed", "pending_admin_verification"].includes(item.status));
  const forwardedOrClosed = departmentComplaints.filter((item) =>
    (item.assignedOfficerId === currentOfficerId && ["solved", "escalated"].includes(item.status))
    || (item.history || []).some((entry) =>
      entry.officerName === account.name && ["forwarded", "escalated", "solved"].includes(entry.action)));
  const firstReviewAlerts = [...newComplaints, ...forwardedToMe].filter((item) => Date.now() - new Date(item.createdAt).getTime() > 12 * 3600000);
  const leaderboard = allAccounts
    .filter((item) => item.officeType === account.officeType && (
      account.officeType === "ward"
        ? String(item.wardNumber) === String(account.wardNumber)
        : item.divisionName === account.divisionName
    ))
    .map((item) => ({
      id: String(item._id),
      name: item.name,
      points: computeOfficerPerformance(item, complaints).currentWeekPoints,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
  const recentActivity = departmentComplaints
    .flatMap((item) => (item.history || []).map((entry) => ({
      complaintToken: item.tokenNumber,
      note: entry.note,
      action: entry.action,
      timestamp: entry.timestamp || entry.createdAt,
    })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  return {
    weekKey,
    header: {
      officerName: account.name,
      departmentName: account.officeType === "ward" ? `Ward ${account.wardNumber}` : `${account.divisionName} / ${account.sectionName}`,
      currentWeekPoints: performance.currentWeekPoints,
    },
    kpis: {
      complaintsReceivedThisWeek: performance.complaintsReceivedThisWeek,
      complaintsCompletedThisWeek: performance.complaintsCompletedThisWeek,
      averageResponseTime: performance.averageResponseTime,
    },
    alerts: {
      pendingFirstReviewCount: firstReviewAlerts.length,
    },
    tabs: {
      newComplaints: newComplaints.map(complaintSummaryForOfficer),
      forwardedToMe: forwardedToMe.map(complaintSummaryForOfficer),
      myAcceptedComplaints: myAccepted.map(complaintSummaryForOfficer),
      forwardedOrClosed: forwardedOrClosed.map(complaintSummaryForOfficer),
    },
    recentActivity,
    leaderboard,
    performance: {
      currentWeekPoints: performance.currentWeekPoints,
      allTimePoints: performance.allTimePoints,
      pointsEarnedThisWeek: performance.currentWeekPoints,
      history: performance.history.map((item) => ({
        tokenNumber: item.tokenNumber,
        title: item.title || item.subcategory || item.category,
        status: item.status,
        points: item.status === "solved" ? officerPointsForComplaint(item) : 0,
        updatedAt: item.updatedAt || item.createdAt,
      })),
      feedback: (account.performanceAdjustments || []).slice(-5).reverse(),
    },
  };
}

async function appendCommentAndHistory(repositories, complaint, actor, commentText, visibility = "internal") {
  if (!commentText) return;

  const comment = {
    complaintToken: complaint.tokenNumber,
    actorRole: actor.role,
    actorName: actor.name,
    actorId: actor.principalId,
    visibility,
    message: commentText,
    createdAt: new Date(),
  };

  await repositories.comments.addComment(comment);
  await repositories.complaints.addCommentPointer(complaint.tokenNumber, {
    actorName: actor.name,
    message: commentText,
    createdAt: comment.createdAt,
  });
  await repositories.complaints.updateComplaint(complaint.tokenNumber, {
    comments: [
      ...(complaint.comments || []),
      {
        actorRole: actor.role,
        actorName: actor.name,
        actorId: actor.principalId,
        visibility,
        message: commentText,
        createdAt: comment.createdAt,
      },
    ],
  });
}

async function appendHistoryEntry(repositories, complaint, actor, action, note) {
  const historyEntry = {
    action,
    officerName: actor.name,
    officerRole: actor.role,
    timestamp: new Date(),
    note,
  };

  await repositories.complaints.logStatusHistory(buildAuditEntry(complaint.tokenNumber, actor, action, note));
  await repositories.complaints.updateComplaint(complaint.tokenNumber, {
    history: [...(complaint.history || []), historyEntry],
  });

  return historyEntry;
}

function isWithinOfficerOfficeScope(actor, complaint) {
  if (!actor || !complaint) return false;
  if (actor.role === "department") {
    // Allow access to any complaint in the same division — matches dashboard filter logic
    return complaint.officeType === "department"
      && complaint.divisionName === (actor.divisionName || "");
  }

  if (actor.role === "ward") {
    return complaint.officeType === "ward"
      && String(complaint.wardNumber || "") === String(actor.wardNumber || "");
  }

  return false;
}

function canAccessComplaint(actor, complaint) {
  if (!complaint) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "citizen") return complaint.citizenId === actor.principalId;

  if (
    ["solved", "pending_admin_verification"].includes(complaint.status)
    && isWithinOfficerOfficeScope(actor, complaint)
  ) {
    return true;
  }

  if (complaint.acceptedByOfficerId || complaint.acceptedAt) {
    return complaint.assignedOfficerId === actor.principalId || complaint.acceptedByOfficerId === actor.principalId;
  }

  return complaint.assignedOfficerId === actor.principalId || isWithinOfficerOfficeScope(actor, complaint);
}

async function enrichComplaint(repositories, complaint, viewerRole = "citizen") {
  const [comments, history] = await Promise.all([
    repositories.comments.listByComplaintToken(complaint.tokenNumber),
    repositories.complaints.listStatusHistory(complaint.tokenNumber),
  ]);
  const normalizedComments = comments.length ? comments : (complaint.comments || []);
  const normalizedHistory = (history.length ? history : (complaint.history || [])).map((entry) => ({
    ...entry,
    note: entry.note || entry.message || "",
    timestamp: entry.timestamp || entry.createdAt || null,
  }));

  return {
    ...(viewerRole === "citizen" ? complaintSummaryForCitizen(complaint) : complaintSummaryForOfficer(complaint)),
    comments: normalizedComments.filter((comment) => viewerRole !== "citizen" || comment.visibility === "public" || !comment.visibility),
    history: normalizedHistory,
  };
}

function aggregateCounts(items, keySelector) {
  const counts = new Map();
  items.forEach((item) => {
    const key = keySelector(item) || "Unassigned";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

const publicOpenStatuses = new Set(["pending", "in_progress", "delayed", "forwarded", "escalated", "pending_admin_verification"]);
const publicPendingStatuses = new Set(["pending", "delayed", "forwarded", "escalated", "pending_admin_verification"]);

function toTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getComplaintCreatedAtMs(complaint) {
  return toTimestamp(complaint.createdAt);
}

function getComplaintUpdatedAtMs(complaint) {
  return toTimestamp(complaint.updatedAt || complaint.createdAt);
}

function getComplaintCompletedAtMs(complaint) {
  return toTimestamp(complaint.closureConfirmedAt || complaint.updatedAt || complaint.createdAt);
}

function isComplaintOpenForPublic(complaint) {
  return publicOpenStatuses.has(String(complaint.status || ""));
}

function isComplaintPendingForPublic(complaint) {
  return publicPendingStatuses.has(String(complaint.status || ""));
}

function isComplaintOverdueForPublic(complaint) {
  const dueAt = toTimestamp(complaint.slaDueAt);
  return isComplaintOpenForPublic(complaint) && dueAt !== null && dueAt < Date.now();
}

function getSolvedComplaintDurationDays(complaint) {
  if (complaint.status !== "solved") return null;
  const startedAt = getComplaintCreatedAtMs(complaint);
  const completedAt = getComplaintCompletedAtMs(complaint);
  if (startedAt === null || completedAt === null || completedAt < startedAt) return null;
  return (completedAt - startedAt) / (1000 * 60 * 60 * 24);
}

function buildPublicPerformanceRows(complaints, groupSelector) {
  const groups = new Map();

  complaints.forEach((complaint) => {
    const group = groupSelector(complaint);
    if (!group?.key || !group?.label) return;

    if (!groups.has(group.key)) {
      groups.set(group.key, {
        key: group.key,
        label: group.label,
        wardNumber: String(group.wardNumber || ""),
        divisionName: String(group.divisionName || ""),
        items: [],
        focusLocationText: "",
        focusLocationCoordinates: null,
        focusUpdatedAt: -1,
      });
    }

    const entry = groups.get(group.key);
    entry.items.push(complaint);

    const candidateCoordinates = normalizeCoordinates(complaint.locationCoordinates, complaint.locationText);
    const candidateText = String(complaint.locationText || "").trim();
    const candidateUpdatedAt = getComplaintUpdatedAtMs(complaint) ?? -1;
    const hasLocation = Boolean(candidateCoordinates || candidateText);

    if (hasLocation && candidateUpdatedAt >= entry.focusUpdatedAt) {
      entry.focusLocationText = candidateText;
      entry.focusLocationCoordinates = candidateCoordinates;
      entry.focusUpdatedAt = candidateUpdatedAt;
    }
  });

  return [...groups.values()]
    .map((entry) => {
      const solvedComplaints = entry.items.filter((item) => item.status === "solved");
      const resolutionDurations = solvedComplaints
        .map(getSolvedComplaintDurationDays)
        .filter((value) => value !== null);
      const averageResolutionDays = resolutionDurations.length
        ? Math.round((resolutionDurations.reduce((sum, value) => sum + value, 0) / resolutionDurations.length) * 10) / 10
        : 0;

      return {
        key: entry.key,
        label: entry.label,
        wardNumber: entry.wardNumber,
        divisionName: entry.divisionName,
        total: entry.items.length,
        resolved: solvedComplaints.length,
        inProgress: entry.items.filter((item) => item.status === "in_progress").length,
        overdue: entry.items.filter(isComplaintOverdueForPublic).length,
        escalated: entry.items.filter((item) => item.status === "escalated" || item.status === "delayed").length,
        resolutionRate: entry.items.length ? Math.round((solvedComplaints.length / entry.items.length) * 100) : 0,
        averageResolutionDays,
        locationText: entry.focusLocationText,
        locationCoordinates: entry.focusLocationCoordinates,
      };
    })
    .filter((item) => item.total > 0)
    .sort((left, right) =>
      right.resolutionRate - left.resolutionRate
      || left.overdue - right.overdue
      || left.averageResolutionDays - right.averageResolutionDays
      || right.total - left.total);
}

function buildPublicComplaintFeed(complaints) {
  return [...complaints]
    .sort((left, right) => (getComplaintCreatedAtMs(right) ?? 0) - (getComplaintCreatedAtMs(left) ?? 0))
    .slice(0, 8)
    .map((complaint) => ({
      tokenNumber: complaint.tokenNumber,
      category: complaint.category || "other",
      categoryLabel: complaint.subcategory || complaint.category || "Other",
      wardNumber: String(complaint.wardNumber || ""),
      status: complaint.status,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt || complaint.createdAt,
      assignedOfficeLabel: complaint.assignedOfficeLabel || complaint.assignedDepartment || complaint.divisionName || "",
      overdue: isComplaintOverdueForPublic(complaint),
    }));
}

function buildAnalytics(complaints) {
  const unsolvedStatuses = new Set(["pending", "in_progress", "delayed", "forwarded", "escalated"]);
  const pendingComplaints = complaints.filter((complaint) => unsolvedStatuses.has(complaint.status) && new Date(complaint.slaDueAt).getTime() < Date.now());
  const forwardedComplaints = complaints.filter((complaint) => complaint.status === "forwarded");
  const centralAdminComplaints = complaints.filter((complaint) => complaint.officeType === "central_admin" || complaint.status === "escalated");
  const slaBreaches = complaints.filter((complaint) => !complaint.firstResponseAt && new Date(complaint.slaDueAt).getTime() < Date.now());

  return {
    departmentComplaints: aggregateCounts(complaints.filter((item) => item.divisionName), (item) => item.divisionName),
    wardComplaints: aggregateCounts(complaints.filter((item) => item.wardNumber), (item) => `Ward ${item.wardNumber}`),
    statusCounts: aggregateCounts(complaints, (item) => item.status),
    solvedRates: aggregateCounts(complaints.filter((item) => item.status === "solved"), (item) => item.divisionName || `Ward ${item.wardNumber}`),
    inProgressDepartments: aggregateCounts(complaints.filter((item) => item.status === "in_progress"), (item) => item.divisionName),
    inProgressWards: aggregateCounts(complaints.filter((item) => item.status === "in_progress"), (item) => `Ward ${item.wardNumber || "Unspecified"}`),
    pendingGraph: aggregateCounts(pendingComplaints, (item) => item.divisionName || `Ward ${item.wardNumber}`),
    pendingComplaints: pendingComplaints.map((item) => ({
      tokenNumber: item.tokenNumber,
      title: item.subcategory || item.category,
      department: item.divisionName || "Ward Office",
      ward: item.wardNumber ? `Ward ${item.wardNumber}` : "N/A",
      overdue: `${Math.max(1, Math.floor((Date.now() - new Date(item.slaDueAt).getTime()) / (1000 * 60 * 60)))}h overdue`,
      status: item.status,
    })),
    forwardedComplaints: forwardedComplaints.map((item) => ({
      tokenNumber: item.tokenNumber,
      title: item.subcategory || item.category,
      text: item.forwardedToLabel || "Forwarded complaint",
    })),
    centralAdminGraph: aggregateCounts(centralAdminComplaints, (item) => item.divisionName || "Central Admin"),
    centralAdminComplaints: centralAdminComplaints.map((item) => ({
      tokenNumber: item.tokenNumber,
      title: item.subcategory || item.category,
      text: item.forwardedToLabel || item.assignmentReason || "Assigned to central admin",
    })),
    slaBreaches: slaBreaches.map((item) => ({
      tokenNumber: item.tokenNumber,
      title: item.subcategory || item.category,
      text: `${item.assignedOfficeLabel} | overdue for first response`,
    })),
  };
}

function buildPublicOverview(complaints, departments, officers) {
  const solvedComplaints = complaints.filter((item) => item.status === "solved");
  const pendingComplaints = complaints.filter(isComplaintPendingForPublic);
  const overdueComplaints = complaints.filter(isComplaintOverdueForPublic);
  const inProgressComplaints = complaints.filter((item) => item.status === "in_progress");
  const resolutionRate = complaints.length ? Math.round((solvedComplaints.length / complaints.length) * 100) : 0;
  const firstResponseOnTimeCount = complaints.filter((item) => {
    if (!item.firstResponseAt || !item.slaDueAt) return false;
    return new Date(item.firstResponseAt).getTime() <= new Date(item.slaDueAt).getTime();
  }).length;
  const firstResponseRate = complaints.length ? Math.round((firstResponseOnTimeCount / complaints.length) * 100) : 0;
  const resolutionDurations = solvedComplaints.map(getSolvedComplaintDurationDays).filter((value) => value !== null);
  const averageResolutionDays = resolutionDurations.length
    ? Math.round((resolutionDurations.reduce((sum, value) => sum + value, 0) / resolutionDurations.length) * 10) / 10
    : 0;
  const weekStart = Date.now() - (1000 * 60 * 60 * 24 * 7);
  const completedThisWeek = solvedComplaints.filter((item) => {
    const completedAt = getComplaintCompletedAtMs(item);
    return completedAt !== null && completedAt >= weekStart;
  }).length;
  const activeWards = new Set(complaints.map((item) => String(item.wardNumber || "").trim()).filter(Boolean)).size;
  const activeDepartments = new Set(complaints.map((item) => String(item.divisionName || "").trim()).filter(Boolean)).size;
  const activeOfficers = officers.filter((item) => isOfficerOnDutyThisWeek(item)).length;
  const pendingFirstReview = complaints.filter((item) => !item.firstResponseAt && isComplaintPendingForPublic(item)).length;
  const resolvedWithTargetWindow = solvedComplaints.filter((item) => toTimestamp(item.estimatedCompletionAt) !== null);
  const resolvedWithinTarget = resolvedWithTargetWindow.filter((item) => {
    const completedAt = getComplaintCompletedAtMs(item);
    const targetAt = toTimestamp(item.estimatedCompletionAt);
    return completedAt !== null && targetAt !== null && completedAt <= targetAt;
  }).length;
  const resolvedWithinTargetRate = resolvedWithTargetWindow.length
    ? Math.round((resolvedWithinTarget / resolvedWithTargetWindow.length) * 100)
    : 0;
  const wardPerformance = buildPublicPerformanceRows(
    complaints.filter((item) => String(item.wardNumber || "").trim()),
    (item) => ({
      key: `ward:${item.wardNumber}`,
      label: `Ward ${item.wardNumber}`,
      wardNumber: item.wardNumber,
    }),
  );
  const departmentPerformance = buildPublicPerformanceRows(
    complaints.filter((item) => String(item.divisionName || "").trim()),
    (item) => ({
      key: `department:${item.divisionName}`,
      label: item.divisionName,
      divisionName: item.divisionName,
    }),
  );
  const hotspotWards = [...wardPerformance]
    .sort((left, right) => right.total - left.total || right.overdue - left.overdue || left.resolutionRate - right.resolutionRate)
    .slice(0, 6);
  const hotspotFocus = hotspotWards.find((item) => item.locationCoordinates || item.locationText) || hotspotWards[0] || null;

  return {
    totals: {
      complaints: complaints.length,
      resolved: solvedComplaints.length,
      inProgress: inProgressComplaints.length,
      pending: pendingComplaints.length,
      overdue: overdueComplaints.length,
      pendingOrOverdue: pendingComplaints.length + overdueComplaints.length,
      resolutionRate,
      averageResolutionDays,
      activeWards: activeWards || departments.length || 0,
      activeDepartments: departments.length || activeDepartments,
      activeOfficers,
    },
    liveQueue: {
      completedThisWeek,
      inProgress: inProgressComplaints.length,
      underReview: pendingComplaints.length,
      escalated: complaints.filter((item) => item.status === "escalated").length,
      pendingFirstReview,
      overdue: overdueComplaints.length,
      firstResponseRate,
    },
    sla: {
      firstResponseOnTime: firstResponseOnTimeCount,
      firstResponseRate,
      resolvedWithinTarget,
      resolvedWithinTargetRate,
      trackedResolvedCount: resolvedWithTargetWindow.length,
      escalatedOrDelayed: complaints.filter((item) => item.status === "escalated" || item.status === "delayed").length,
      overdueOpen: overdueComplaints.length,
    },
    departmentLoad: aggregateCounts(
      complaints.filter((item) => item.divisionName),
      (item) => item.divisionName,
    )
      .slice(0, 6)
      .map(([label, count]) => ({ label, count })),
    performance: {
      wards: wardPerformance,
      departments: departmentPerformance,
    },
    recentComplaints: buildPublicComplaintFeed(complaints),
    hotspots: {
      wards: hotspotWards,
      focus: hotspotFocus,
    },
  };
}

function buildSolvedChart(complaints, departments) {
  return departments.map((department) => {
    const total = complaints.filter((item) => item.divisionName === department.name).length;
    const solved = complaints.filter((item) => item.divisionName === department.name && item.status === "solved").length;
    const percent = total ? Math.round((solved / total) * 100) : 0;
    return {
      label: department.name,
      total,
      solved,
      percent,
    };
  }).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
}

function buildOversightQueue(complaints) {
  const byNewest = (left, right) =>
    new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime();
  const officerReviewCandidates = complaints.filter((item) => item.officerActionReview?.status === "pending");

  return {
    escalated: complaints
      .filter((item) => item.status === "escalated" || item.officeType === "central_admin")
      .sort(byNewest)
      .map(complaintSummaryForOfficer),
    invalidPending: complaints
      .filter((item) => item.status === "pending_admin_verification")
      .sort(byNewest)
      .map(complaintSummaryForOfficer),
    officerActionReviews: officerReviewCandidates
      .sort(byNewest)
      .map((complaint) => ({
        ...complaintSummaryForOfficer(complaint),
        reviewMeta: complaint.officerActionReview,
      })),
  };
}

function buildAdminDashboard(complaints, departments, officers, rotations) {
  const now = Date.now();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyComplaints = complaints.filter((item) => new Date(item.createdAt).getTime() >= monthStart.getTime());
  const solvedCount = monthlyComplaints.filter((item) => item.status === "solved").length;
  const solvedRate = monthlyComplaints.length ? Math.round((solvedCount / monthlyComplaints.length) * 100) : 0;
  const oversight = buildOversightQueue(complaints);
  const activeRotations = rotations.filter((rotation) =>
    new Date(rotation.startDate).getTime() <= now && new Date(rotation.endDate).getTime() >= now);

  return {
    overview: {
      totalComplaintsMonth: monthlyComplaints.length,
      solvedRate,
      pending: complaints.filter((item) => ["pending", "in_progress", "delayed", "forwarded", "pending_admin_verification", "escalated"].includes(item.status)).length,
      forwarded: complaints.filter((item) => item.status === "forwarded").length,
      escalated: oversight.escalated.length,
      departments: departments.length,
      officers: officers.filter((item) => isOfficerOnDutyThisWeek(item)).length,
      activeRotations: activeRotations.length,
    },
    officerGroups: {
      departments: officers
        .filter((item) => item.officeType === "department" && item.status !== "inactive")
        .map((item) => sanitizeOfficeAccount(item))
        .sort((a, b) => a.divisionName.localeCompare(b.divisionName) || a.name.localeCompare(b.name)),
      wards: officers
        .filter((item) => item.officeType === "ward" && item.status !== "inactive")
        .map((item) => sanitizeOfficeAccount(item))
        .sort((a, b) => Number(a.wardNumber) - Number(b.wardNumber) || a.name.localeCompare(b.name)),
    },
    charts: {
      complaintsByDepartment: aggregateCounts(
        complaints.filter((item) => item.divisionName),
        (item) => item.divisionName,
      ).map(([label, count]) => ({ label, count })),
      solvedByDepartment: buildSolvedChart(complaints, departments),
    },
    spotlight: {
      recentEscalations: oversight.escalated.slice(0, 5),
      recentInvalid: oversight.invalidPending.slice(0, 5),
      officerActionReviews: oversight.officerActionReviews.slice(0, 6),
    },
  };
}

function buildOfficerCatalog(accounts, complaints) {
  return accounts.map((account) => {
    const performance = computeOfficerPerformance(account, complaints);
    return {
      ...sanitizeOfficeAccount(account),
      complaintsHandled: performance.history.length,
      currentWeekPoints: performance.currentWeekPoints,
      allTimePoints: performance.allTimePoints,
      averageResponseTime: performance.averageResponseTime,
      complaintsCompletedThisWeek: performance.complaintsCompletedThisWeek,
      activationExpiresAt: account.activationExpiresAt || endOfCurrentWeek().toISOString(),
    };
  }).sort((a, b) => b.currentWeekPoints - a.currentWeekPoints || a.name.localeCompare(b.name));
}

async function applyPerformanceAdjustment(repositories, officerId, adjustment) {
  const officer = await repositories.officeAccounts.findById(officerId);
  if (!officer) return false;

  const nextAdjustments = [
    ...(officer.performanceAdjustments || []),
    {
      points: Number(adjustment.points || 0),
      message: adjustment.message || "",
      // pending=true means admin must verify before it counts toward points
      status: adjustment.pending ? "pending" : "verified",
      createdAt: new Date(),
    },
  ];

  await repositories.officeAccounts.updateOfficeAccount(officerId, {
    performanceAdjustments: nextAdjustments,
  });

  return true;
}

async function applyOfficerActionReviewDecision(repositories, complaint, validated, comment) {
  const reviewMeta = complaint.officerActionReview || null;
  if (!reviewMeta) return;

  if (validated) {
    if (reviewMeta.priorOfficerId) {
      await applyPerformanceAdjustment(repositories, reviewMeta.priorOfficerId, {
        points: -15,
        message: comment || "Admin validated officer action review. Automatic deduction applied.",
      });
    }

    if (reviewMeta.resolvingOfficerId && reviewMeta.resolvingOfficerId !== reviewMeta.priorOfficerId) {
      await applyPerformanceAdjustment(repositories, reviewMeta.resolvingOfficerId, {
        points: 15,
        message: comment || "Admin validated officer action review. Automatic reward applied.",
      });
    }
  }

  await repositories.complaints.updateComplaint(complaint.tokenNumber, {
    officerActionReview: {
      ...reviewMeta,
      status: validated ? "validated" : "dismissed",
      resolvedAt: new Date(),
      adminComment: comment || "",
    },
  });
}

function buildCitizenDashboard(user, complaints) {
  const recentComplaints = complaints.slice(0, 5).map(complaintSummaryForCitizen);
  const totalPoints = complaints.reduce((sum, complaint) => sum + Number(complaint.pointsAwarded || 0), 0);
  const pointsHistory = complaints
    .filter((item) => Number(item.pointsAwarded || 0) > 0)
    .map((item) => ({
      tokenNumber: item.tokenNumber,
      title: item.title || item.subcategory || item.category,
      points: Number(item.pointsAwarded || 0),
      awardedAt: item.updatedAt || item.closureConfirmedAt || item.createdAt,
    }))
    .slice(0, 8);

  return {
    user: {
      ...sanitizeCitizen(user),
      rewardPoints: totalPoints,
    },
    stats: {
      total: complaints.length,
      resolved: complaints.filter((item) => item.status === "solved").length,
      inProgress: complaints.filter((item) => item.status === "in_progress").length,
      underReview: complaints.filter((item) => ["pending", "forwarded", "escalated"].includes(item.status)).length,
    },
    recentComplaints,
    pointsHistory,
  };
}

async function handleComplaintCreate(req, res, repositories, actor, preParsedBody = null) {
  const body = preParsedBody ?? await readJsonBody(req);
  const title = String(body.title || "").trim();
  const category = String(body.category || "").trim();
  const subcategory = String(body.subcategory || "").trim();
  const locationText = String(body.locationText || "").trim();
  const description = String(body.description || "").trim();
  const priority = String(body.priority || "medium").trim().toLowerCase();
  const wardNumber = String(body.wardNumber || "").trim();
  const areaName = String(body.areaName || "").trim();
  const nearestLandmark = String(body.nearestLandmark || "").trim();
  const locationCoordinates = normalizeCoordinates(body.locationCoordinates, locationText);
  const anonymous = Boolean(body.anonymous);
  const contactOptIn = body.contactOptIn === true
    || String(body.contactOptIn || "").trim().toLowerCase() === "yes";

  if (!title || !category || !description || !locationText) {
    sendJson(res, 400, {
      success: false,
      message: "Title, category, location, and description are required.",
    });
    return;
  }

  const routing = await routeAndAssignComplaint(repositories, {
    category,
    subcategory,
    locationText,
    description,
    wardNumber,
  });

  const proofImage = sanitizeImagePayload(body.proofImage);
  const attachments = Array.isArray(body.attachments) ? body.attachments.map(sanitizeAttachmentPayload).filter(Boolean).slice(0, 5) : [];
  const now = new Date();
  const tokenNumber = generateComplaintToken();
  const complaint = {
    tokenNumber,
    citizenId: anonymous ? "" : actor.principalId,
    citizenMobileNumber: anonymous ? "" : actor.mobileNumber,
    title,
    category,
    subcategory,
    description,
    locationText,
    locationCoordinates,
    areaName,
    nearestLandmark,
    wardNumber: routing.wardNumber || wardNumber,
    priority: ["high", "medium", "low"].includes(priority) ? priority : "medium",
    status: routing.officeType === "central_admin" ? "escalated" : "pending",
    officeType: routing.officeType,
    divisionName: routing.divisionName || "",
    sectionName: routing.sectionName || "",
    secondaryDivisionName: routing.secondaryDivisionName || "",
    secondarySectionName: routing.secondarySectionName || "",
    routeBucket: routing.routeBucket,
    assignmentReason: routing.assignmentReason,
    assignedOfficerId: routing.assignedOfficer ? String(routing.assignedOfficer._id) : "",
    assignedOfficerName: routing.assignedOfficer ? routing.assignedOfficer.name : "Central Admin",
    assignedDepartment: routing.divisionName || (routing.officeType === "ward" ? `Ward ${routing.wardNumber}` : "Central Admin"),
    assignedOfficeLabel:
      routing.officeType === "ward"
        ? `Ward ${routing.wardNumber}`
        : routing.officeType === "central_admin"
          ? "Central Admin"
          : `${routing.divisionName} / ${routing.sectionName}`,
    forwardedTo: "",
    escalated: routing.officeType === "central_admin",
    delayReason: "",
    proofImage,
    attachments,
    anonymous,
    anonymousTrackingToken: anonymous ? crypto.randomBytes(12).toString("hex") : "",
    contactOptIn,
    contactName: anonymous ? "" : String(body.contactName || actor.name || "").trim(),
    contactPhone: anonymous ? "" : String(body.contactPhone || actor.mobileNumber || "").trim(),
    contactEmail: anonymous ? "" : String(body.contactEmail || actor.email || "").trim(),
    estimatedCompletionAt: null,
    slaDueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    firstResponseAt: null,
    createdAt: now,
    updatedAt: now,
    latestComments: [],
    comments: [],
    citizenRating: 0,
    closureConfirmedAt: null,
    pointsAwarded: 0,
    validityVerified: false,
    history: [
      {
        action: "submitted",
        officerName: actor.name,
        officerRole: actor.role,
        timestamp: now,
        note: "Complaint registered by citizen.",
      },
    ],
  };

  await repositories.complaints.createComplaint(complaint);
  await repositories.complaints.logStatusHistory(buildAuditEntry(tokenNumber, actor, "submitted", "Complaint registered by citizen."));

  sendJson(res, 201, {
    success: true,
    message: "Complaint submitted successfully.",
    complaint: complaintSummaryForCitizen(complaint),
    anonymousTrackingToken: complaint.anonymousTrackingToken || null,
  });
}

async function createServer({ repositories, runtime }) {
  return http.createServer(async (req, res) => {
    try {
      const { method = "GET", url = "/" } = req;
      const parsedUrl = new URL(url, `http://${req.headers.host || "localhost"}`);
      const pathname = parsedUrl.pathname;

      if (method === "OPTIONS") {
        sendJson(res, 200, { ok: true });
        return;
      }

      if (method === "GET" && pathname === "/health") {
        sendJson(res, runtime.mode === "mongo" ? 200 : 200, {
          status: runtime.mode === "mongo" ? "ok" : "degraded",
          database: runtime.mode === "mongo" ? "connected" : "local-fallback",
          app: "pnpp-backend",
          message: runtime.mode === "mongo" ? "MongoDB connected." : runtime.message,
        });
        return;
      }

      if (method === "GET" && pathname === "/routes") {
        sendJson(res, 200, { routes });
        return;
      }

      if (method === "POST" && pathname === "/api/auth/register") {
        const body = await readJsonBody(req);
        const name = String(body.name || "").trim();
        const mobileNumber = String(body.mobileNumber || "").trim();
        const email = normalizeEmail(body.email || "");
        const password = String(body.password || "").trim();
        const registerAnonymously = Boolean(body.registerAnonymously);

        if ((!name && !registerAnonymously) || !mobileNumber || !email || !password) {
          sendJson(res, 400, {
            success: false,
            message: "Email, mobile number, and password are required. Name is required unless registering anonymously.",
          });
          return;
        }

        const existingUserByEmail = await repositories.users.findByEmail?.(email);
        if (existingUserByEmail) {
          sendJson(res, 409, { success: false, message: "A user with this email already exists." });
          return;
        }

        const existingUser = await repositories.users.findByMobileNumber(mobileNumber);
        if (existingUser) {
          sendJson(res, 409, { success: false, message: "A user with this mobile number already exists." });
          return;
        }

        let citizenCode = "";
        do {
          citizenCode = generateCitizenCode();
        } while (await repositories.users.findByCitizenCode?.(citizenCode));

        const userPayload = {
          name: registerAnonymously ? "Anonymous Citizen" : name,
          mobileNumber,
          email,
          citizenCode,
          isAnonymousRegistered: registerAnonymously,
          rewardPoints: 0,
          passwordHash: hashPassword(password),
          role: "citizen",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await repositories.users.createUser(userPayload);
        const createdUser = { _id: result.insertedId, ...userPayload };
        const session = await createSession(repositories, {
          principalId: String(result.insertedId),
          role: "citizen",
          name: createdUser.name,
          mobileNumber: createdUser.mobileNumber,
          email: createdUser.email,
          citizenCode: createdUser.citizenCode,
        });

        sendJson(res, 201, {
          success: true,
          message: "User registered successfully.",
          token: session.token,
          expiresAt: session.expiresAt,
          anonymousCitizenCode: registerAnonymously ? citizenCode : "",
          user: sanitizeCitizen(createdUser),
        });
        return;
      }

      if (method === "POST" && pathname === "/api/auth/login") {
        const body = await readJsonBody(req);
        const identifier = String(body.identifier || "").trim();
        const password = String(body.password || "").trim();
        const normalizedIdentifier = identifier.includes("@")
          ? normalizeEmail(identifier)
          : identifier.toUpperCase();
        const user = normalizedIdentifier.includes("@")
          ? await repositories.users.findByEmail?.(normalizedIdentifier)
          : await repositories.users.findByCitizenCode(normalizedIdentifier);

        if (!user || user.role !== "citizen" || user.passwordHash !== hashPassword(password)) {
          sendJson(res, 401, { success: false, message: "Invalid email / citizen ID or password." });
          return;
        }

        const session = await createSession(repositories, {
          principalId: String(user._id),
          role: "citizen",
          name: user.name,
          mobileNumber: user.mobileNumber,
          email: user.email || "",
          citizenCode: user.citizenCode || "",
        });

        sendJson(res, 200, {
          success: true,
          message: "Login successful.",
          token: session.token,
          expiresAt: session.expiresAt,
          user: sanitizeCitizen(user),
        });
        return;
      }

      if (method === "GET" && pathname === "/api/citizen/dashboard") {
        const actor = await requireAuth(req, res, repositories, ["citizen"]);
        if (!actor) return;

        const [user, complaints] = await Promise.all([
          repositories.users.findById(actor.principalId),
          repositories.complaints.findByCitizenId(actor.principalId),
        ]);

        sendJson(res, 200, {
          success: true,
          dashboard: buildCitizenDashboard(user || {
            _id: actor.principalId,
            name: actor.name,
            mobileNumber: actor.mobileNumber,
            citizenCode: actor.citizenCode || "",
            rewardPoints: 0,
            role: "citizen",
          }, complaints),
        });
        return;
      }

      if (method === "POST" && pathname === "/api/auth/admin-login") {
        const body = await readJsonBody(req);
        const loginId = String(body.loginId || "").trim();
        const password = String(body.password || "").trim();

        const validAdminLogins = new Set([adminCredentials.loginId, "admin"]);
        if (!validAdminLogins.has(loginId) || password !== adminCredentials.password) {
          sendJson(res, 401, { success: false, message: "Invalid admin login credentials." });
          return;
        }

        const session = await createSession(repositories, {
          principalId: "central-admin",
          role: "admin",
          name: adminCredentials.name,
          loginId: adminCredentials.loginId,
        });

        sendJson(res, 200, {
          success: true,
          message: "Admin login successful.",
          token: session.token,
          expiresAt: session.expiresAt,
          user: {
            loginId: adminCredentials.loginId,
            role: "admin",
            name: adminCredentials.name,
          },
        });
        return;
      }

      if (method === "POST" && pathname === "/api/auth/department-login") {
        const body = await readJsonBody(req);
        const officeType = String(body.officeType || "").trim();
        const divisionName = String(body.divisionName || "").trim();
        const sectionName = String(body.sectionName || "").trim();
        const wardNumber = String(body.wardNumber || "").trim();
        const loginId = String(body.loginId || "").trim();
        const password = String(body.password || "").trim();

        if (!loginId || !password) {
          sendJson(res, 400, { success: false, message: "Login ID and password are required." });
          return;
        }

        let officeAccount = null;
        if (["department", "ward"].includes(officeType)) {
          officeAccount = await repositories.officeAccounts.findByOfficeTypeAndLoginId(officeType, loginId);
        }

        if (!officeAccount) {
          officeAccount = await repositories.officeAccounts.findByLoginId(loginId);
        }

        if (!officeAccount || officeAccount.passwordHash !== hashPassword(password)) {
          sendJson(res, 401, { success: false, message: "Invalid office login credentials." });
          return;
        }

        const resolvedOfficeType = officeAccount.officeType;
        const effectiveAssignmentWeeks = getEffectiveAssignmentWeeks(officeAccount);
        if (!effectiveAssignmentWeeks.includes(getCurrentWeekKey())) {
          sendJson(res, 403, { success: false, message: "No active duty this week" });
          return;
        }

        if (
          resolvedOfficeType === "department"
          && divisionName
          && (
            officeAccount.divisionName !== divisionName
            || (officeAccount.sectionName && officeAccount.sectionName !== sectionName)
          )
        ) {
          sendJson(res, 401, {
            success: false,
            message: "Selected department details do not match the assigned login credentials.",
          });
          return;
        }

        if (resolvedOfficeType === "ward" && wardNumber && String(officeAccount.wardNumber) !== String(wardNumber)) {
          sendJson(res, 401, {
            success: false,
            message: "Selected ward does not match the assigned login credentials.",
          });
          return;
        }

        const session = await createSession(repositories, {
          principalId: String(officeAccount._id),
          role: officeAccount.role,
          name: officeAccount.name,
          officeType: resolvedOfficeType,
          loginId: officeAccount.loginId,
          divisionName: officeAccount.divisionName || "",
          sectionName: officeAccount.sectionName || "",
          wardNumber: officeAccount.wardNumber || "",
          assignmentWeeks: effectiveAssignmentWeeks,
        });

        sendJson(res, 200, {
          success: true,
          message: `${resolvedOfficeType === "ward" ? "Ward" : "Department"} login successful.`,
          token: session.token,
          expiresAt: session.expiresAt,
          user: sanitizeOfficeAccount(officeAccount),
        });
        return;
      }

      if (method === "POST" && pathname === "/api/auth/logout") {
        const rawToken = extractBearerToken(req);
        if (rawToken) {
          await repositories.sessions.revokeSession(hashValue(rawToken));
        }
        sendJson(res, 200, { success: true, message: "Logged out." });
        return;
      }

      if (method === "GET" && pathname === "/api/admin/dashboard") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        const [complaints, departments, officers, rotations] = await Promise.all([
          repositories.complaints.listAll(),
          repositories.departments.listDepartments(),
          repositories.officeAccounts.listAll(),
          repositories.admin.listRotations(),
        ]);

        sendJson(res, 200, {
          success: true,
          dashboard: buildAdminDashboard(complaints, departments, officers, rotations),
        });
        return;
      }

      if (pathname === "/api/admin/departments") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        if (method === "GET") {
          const departments = await repositories.departments.listDepartments();
          sendJson(res, 200, {
            success: true,
            departments: departments.map(sanitizeDepartment),
          });
          return;
        }

        if (method === "POST") {
          const body = await readJsonBody(req);
          const code = String(body.code || "").trim().toUpperCase();
          const name = String(body.name || "").trim();
          const type = String(body.type || "Mahashakha").trim();
          const wards = Array.isArray(body.wards) ? body.wards.map((item) => String(item).trim()).filter(Boolean) : [];
          const description = String(body.description || "").trim();

          if (!code || !name) {
            sendJson(res, 400, { success: false, message: "Department code and name are required." });
            return;
          }

          const existing = await repositories.departments.findByCode(code);
          if (existing) {
            sendJson(res, 409, { success: false, message: "Department code already exists." });
            return;
          }

          const payload = {
            code,
            name,
            type,
            wards,
            description,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await repositories.departments.createDepartment(payload);
          await repositories.admin.logAdminAction({
            action: "create_department",
            code,
            createdBy: actor.name,
            createdAt: new Date(),
          });

          sendJson(res, 201, {
            success: true,
            department: sanitizeDepartment({ _id: result.insertedId, ...payload }),
          });
          return;
        }
      }

      if (pathname === "/api/admin/officers") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        if (method === "GET") {
          const [accounts, complaints] = await Promise.all([
            repositories.officeAccounts.listAll(),
            repositories.complaints.listAll(),
          ]);

          sendJson(res, 200, {
            success: true,
            officers: buildOfficerCatalog(accounts, complaints),
          });
          return;
        }

        if (method === "POST") {
          const body = await readJsonBody(req);
          const officeType = String(body.officeType || "department").trim();
          const name = String(body.name || "").trim();
          const loginId = String(body.loginId || "").trim();
          const password = String(body.password || "").trim();
          const email = String(body.email || "").trim();
          const phone = String(body.phone || "").trim();
          const departmentCode = String(body.departmentCode || "").trim().toUpperCase();
          const divisionName = String(body.divisionName || "").trim();
          const sectionName = String(body.sectionName || "").trim();
          const wardNumber = String(body.wardNumber || "").trim();
          const active = body.active !== false;
          const activationStartAt = new Date();
          const activationExpiresAt = endOfCurrentWeek();
          const departmentRecords = officeType === "department" ? await repositories.departments.listDepartments() : [];
          const resolvedDepartment = officeType === "department"
            ? resolveDepartmentRoutingTarget(departmentRecords, { departmentCode, divisionName, sectionName })
            : { departmentCode: "", divisionName: "", sectionName: "" };

          if (!name || !loginId || !password) {
            sendJson(res, 400, { success: false, message: "Name, login ID, and password are required." });
            return;
          }

          if (officeType === "department" && (!resolvedDepartment.departmentCode || !resolvedDepartment.divisionName || !resolvedDepartment.sectionName)) {
            sendJson(res, 400, { success: false, message: "Department and sub-department are required for department officers." });
            return;
          }

          if (officeType === "ward" && !wardNumber) {
            sendJson(res, 400, { success: false, message: "Ward number is required for ward officers." });
            return;
          }

          const existingOfficeAccount = await repositories.officeAccounts.findByLoginId(loginId);
          if (existingOfficeAccount) {
            sendJson(res, 409, { success: false, message: "This login ID is already in use." });
            return;
          }

          const payload = {
            role: officeType === "ward" ? "ward" : "department",
            officeType,
            departmentCode: officeType === "department" ? resolvedDepartment.departmentCode : "",
            divisionName: officeType === "department" ? resolvedDepartment.divisionName : "",
            sectionName: officeType === "department" ? resolvedDepartment.sectionName : "",
            wardNumber: officeType === "ward" ? wardNumber : "",
            name,
            email,
            phone,
            loginId,
            passwordHash: hashPassword(password),
            status: active ? "active" : "inactive",
            assignmentWeeks: active ? [getCurrentWeekKey()] : [],
            activationStartAt: active ? activationStartAt : null,
            activationExpiresAt: active ? activationExpiresAt : null,
            currentWeekPoints: 0,
            allTimePoints: 0,
            performanceAdjustments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await repositories.officeAccounts.createOfficeAccount(payload);
          await repositories.admin.logAdminAction({
            action: "create_officer",
            officerName: name,
            loginId,
            createdBy: actor.name,
            createdAt: new Date(),
          });

          sendJson(res, 201, {
            success: true,
            officer: sanitizeOfficeAccount({ _id: result.insertedId, ...payload }),
          });
          return;
        }
      }

      if (pathname === "/api/admin/rotations") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        if (method === "GET") {
          const rotations = await repositories.admin.listRotations();
          sendJson(res, 200, {
            success: true,
            rotations: rotations.map(sanitizeRotation),
          });
          return;
        }

        if (method === "POST") {
          const body = await readJsonBody(req);
          const officerId = String(body.officerId || "").trim();
          const startDate = String(body.startDate || "").trim();
          const endDate = String(body.endDate || "").trim();

          if (!officerId || !startDate || !endDate) {
            sendJson(res, 400, { success: false, message: "Officer, start date, and end date are required." });
            return;
          }

          const officer = await repositories.officeAccounts.findById(officerId);
          if (!officer) {
            sendJson(res, 404, { success: false, message: "Officer not found." });
            return;
          }

          const weekKeys = getWeekKeysBetween(startDate, endDate);
          const rotationPayload = {
            officerId,
            officerName: officer.name,
            officeType: officer.officeType,
            departmentCode: officer.departmentCode || "",
            divisionName: officer.divisionName || "",
            sectionName: officer.sectionName || "",
            wardNumber: officer.wardNumber || "",
            startDate,
            endDate,
            weekKeys,
            active: new Date(startDate).getTime() <= Date.now() && new Date(endDate).getTime() >= Date.now(),
            createdBy: actor.name,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const currentWeeks = new Set(officer.assignmentWeeks || []);
          weekKeys.forEach((key) => currentWeeks.add(key));
          await repositories.officeAccounts.updateOfficeAccount(officerId, {
            assignmentWeeks: [...currentWeeks].sort(),
            status: officer.status || "active",
          });
          const result = await repositories.admin.createRotation(rotationPayload);

          sendJson(res, 201, {
            success: true,
            rotation: sanitizeRotation({ _id: result.insertedId, ...rotationPayload }),
          });
          return;
        }
      }

      if (method === "GET" && pathname === "/api/admin/oversight") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        const complaints = await repositories.complaints.listAll();
        sendJson(res, 200, {
          success: true,
          oversight: buildOversightQueue(complaints),
        });
        return;
      }

      if (pathname === "/api/admin/office-accounts") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        if (method === "GET") {
          const [departments, wards] = await Promise.all([
            repositories.officeAccounts.listByOfficeType("department"),
            repositories.officeAccounts.listByOfficeType("ward"),
          ]);

          sendJson(res, 200, {
            success: true,
            officeAccounts: {
              departments: departments.map(sanitizeOfficeAccount),
              wards: wards.map(sanitizeOfficeAccount),
            },
          });
          return;
        }

        if (method === "POST") {
          const body = await readJsonBody(req);
          const officeType = String(body.officeType || "").trim();
          const divisionName = String(body.divisionName || "").trim();
          const sectionName = String(body.sectionName || "").trim();
          const wardNumber = String(body.wardNumber || "").trim();
          const name = String(body.name || "").trim();
          const loginId = String(body.loginId || "").trim();
          const password = String(body.password || "").trim();

          if (!officeType || !name || !loginId || !password) {
            sendJson(res, 400, { success: false, message: "Office type, name, login ID, and password are required." });
            return;
          }

          if (officeType === "department" && (!divisionName || !sectionName)) {
            sendJson(res, 400, { success: false, message: "Division and section are required for department accounts." });
            return;
          }

          if (officeType === "ward" && !wardNumber) {
            sendJson(res, 400, { success: false, message: "Ward number is required for ward accounts." });
            return;
          }

          const existingOfficeAccount = await repositories.officeAccounts.findByLoginId(loginId);
          if (existingOfficeAccount) {
            sendJson(res, 409, { success: false, message: "This login ID is already in use." });
            return;
          }

          const officePayload = {
            role: officeType === "ward" ? "ward" : "department",
            officeType,
            divisionName: officeType === "department" ? divisionName : "",
            sectionName: officeType === "department" ? sectionName : "",
            wardNumber: officeType === "ward" ? wardNumber : "",
            name,
            loginId,
            passwordHash: hashPassword(password),
            status: "active",
            assignmentWeeks: [getCurrentWeekKey()],
            currentWeekPoints: 0,
            allTimePoints: 0,
            performanceAdjustments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await repositories.officeAccounts.createOfficeAccount(officePayload);
          await repositories.admin.logAdminAction({
            action: "create_office_account",
            officeType,
            loginId,
            createdBy: actor.name,
            createdAt: new Date(),
          });

          sendJson(res, 201, {
            success: true,
            message: "Office admin account created successfully.",
            officeAdmin: sanitizeOfficeAccount({ _id: result.insertedId, ...officePayload }),
          });
          return;
        }
      }

      if (method === "GET" && pathname === "/api/complaints/track") {
        const query = String(parsedUrl.searchParams.get("query") || "").trim();
        if (!query) {
          sendJson(res, 400, { success: false, message: "Complaint token number, anonymous code, email, or mobile number is required." });
          return;
        }

        const normalizedQuery = query.includes("@") ? normalizeEmail(query) : query;
        let complaint = await repositories.complaints.findByTokenNumber(query);
        if (!complaint) {
          complaint = await repositories.complaints.findByAnonymousTrackingToken?.(query) || null;
        }
        if (!complaint) {
          const citizen = normalizedQuery.includes("@")
            ? await repositories.users.findByEmail?.(normalizedQuery)
            : await repositories.users.findByMobileNumber(query);
          if (citizen) {
            const complaints = await repositories.complaints.findByCitizenId(String(citizen._id));
            complaint = complaints[0] || null;
          }
        }

        if (!complaint) {
          sendJson(res, 404, { success: false, message: "Complaint not found." });
          return;
        }

        sendJson(res, 200, {
          success: true,
          complaint: await enrichComplaint(repositories, complaint, "citizen"),
        });
        return;
      }

      if (method === "GET" && pathname === "/api/public/overview") {
        const [complaints, departments, officers] = await Promise.all([
          repositories.complaints.listAll(),
          repositories.departments.listDepartments(),
          repositories.officeAccounts.listAll(),
        ]);

        sendJson(res, 200, {
          success: true,
          overview: buildPublicOverview(complaints, departments, officers),
        });
        return;
      }

      if (method === "GET" && pathname === "/api/complaints/mine") {
        const actor = await requireAuth(req, res, repositories, ["citizen"]);
        if (!actor) return;

        const complaints = await repositories.complaints.findByCitizenId(actor.principalId);
        sendJson(res, 200, {
          success: true,
          complaints: complaints.map(complaintSummaryForCitizen),
        });
        return;
      }

      if (method === "POST" && pathname === "/api/complaints/anonymous") {
        const ip = getClientIp(req);
        if (!checkRateLimit(anonymousComplaintRateLimiter, ip, 5)) {
          sendJson(res, 429, { success: false, message: "Too many anonymous complaints. Try again in an hour." });
          return;
        }
        const anonBody = await readJsonBody(req);
        anonBody.title = String(anonBody.title || anonBody.description || "Anonymous Complaint").trim().slice(0, 120);
        anonBody.category = String(anonBody.category || "other").trim();
        anonBody.locationText = String(anonBody.location || anonBody.locationText || "").trim();
        anonBody.anonymous = true;
        anonBody.contactPhone = String(anonBody.phone || "").trim();
        anonBody.contactName = "";
        anonBody.contactEmail = "";
        if (anonBody.ward_number) anonBody.wardNumber = String(anonBody.ward_number);
        if (!anonBody.description || !anonBody.locationText) {
          sendJson(res, 400, { success: false, message: "Description and location are required." });
          return;
        }
        const syntheticActor = {
          principalId: "",
          role: "citizen",
          name: "Anonymous",
          mobileNumber: anonBody.contactPhone,
          email: "",
          citizenCode: "",
        };
        await handleComplaintCreate(req, res, repositories, syntheticActor, anonBody);
        return;
      }

      if (method === "POST" && pathname === "/api/complaints") {
        const actor = await requireAuth(req, res, repositories, ["citizen"]);
        if (!actor) return;
        await handleComplaintCreate(req, res, repositories, actor);
        return;
      }

      if (method === "GET" && pathname === "/api/officer/complaints") {
        const actor = await requireAuth(req, res, repositories, ["department", "ward", "admin"]);
        if (!actor) return;

        const complaints = actor.role === "admin"
          ? await repositories.complaints.listAll()
          : await repositories.complaints.findAssignedToOfficer(actor.principalId);

        sendJson(res, 200, {
          success: true,
          complaints: complaints.map(complaintSummaryForOfficer),
        });
        return;
      }

      if (method === "GET" && pathname === "/api/officer/dashboard") {
        const actor = await requireAuth(req, res, repositories, ["department", "ward"]);
        if (!actor) return;

        const [account, complaints, officers] = await Promise.all([
          repositories.officeAccounts.findById(actor.principalId),
          repositories.complaints.listAll(),
          repositories.officeAccounts.listByOfficeType(actor.officeType),
        ]);

        sendJson(res, 200, {
          success: true,
          dashboard: buildOfficerDashboard(account, complaints, officers),
        });
        return;
      }

      if (method === "GET" && pathname === "/api/officer/handover-queue") {
        const actor = await requireAuth(req, res, repositories, ["department", "ward"]);
        if (!actor) return;

        const [account, allComplaints] = await Promise.all([
          repositories.officeAccounts.findById(actor.principalId),
          repositories.complaints.listAll(),
        ]);

        // Find complaints that were resolved by officers in the same office scope
        // but whose assignment week was NOT the current week (i.e., outgoing rotation).
        const currentWeek = getCurrentWeekKey();
        const previousWeekSolvedComplaints = allComplaints.filter((complaint) => {
          if (complaint.status !== "solved") return false;
          // Must belong to the same office scope as the incoming officer
          if (actor.officeType === "ward") {
            return String(complaint.wardNumber) === String(account?.wardNumber || actor.wardNumber);
          }
          return complaint.divisionName === (account?.divisionName || actor.divisionName)
            && complaint.sectionName === (account?.sectionName || actor.sectionName);
        }).filter((complaint) => {
          // Resolved before this week started (i.e., by previous rotation)
          const resolvedAt = complaint.updatedAt || complaint.createdAt;
          const weekStart = startOfCurrentWeek();
          return new Date(resolvedAt).getTime() < weekStart.getTime();
        });

        sendJson(res, 200, {
          success: true,
          handoverComplaints: previousWeekSolvedComplaints.map(complaintSummaryForOfficer),
          currentWeek,
        });
        return;
      }

      if (method === "GET" && pathname === "/api/admin/analytics") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        const complaints = await repositories.complaints.listAll();
        sendJson(res, 200, {
          success: true,
          analytics: buildAnalytics(complaints),
        });
        return;
      }

      if (method === "GET" && pathname === "/api/admin/complaints") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        const bucket = String(parsedUrl.searchParams.get("bucket") || "all").trim();
        const complaints = await repositories.complaints.listAll();
        const filtered = complaints.filter((complaint) => {
          if (bucket === "pending") return new Date(complaint.slaDueAt).getTime() < Date.now() && complaint.status !== "solved";
          if (bucket === "forwarded") return complaint.status === "forwarded";
          if (bucket === "central-admin") return complaint.officeType === "central_admin" || complaint.status === "escalated";
          if (bucket === "solved") return complaint.status === "solved";
          if (bucket === "in-progress") return complaint.status === "in_progress";
          return true;
        });

        sendJson(res, 200, {
          success: true,
          complaints: filtered.map(complaintSummaryForOfficer),
        });
        return;
      }

      const departmentCodeMatch = pathname.match(/^\/api\/admin\/departments\/([^/]+)$/);
      const officerIdMatch = pathname.match(/^\/api\/admin\/officers\/([^/]+)$/);
      const officerAdjustmentMatch = pathname.match(/^\/api\/admin\/officers\/([^/]+)\/adjustments\/(\d+)$/);
      const oversightDecisionMatch = pathname.match(/^\/api\/admin\/oversight\/([^/]+)$/);
      const complaintTokenMatch = pathname.match(/^\/api\/complaints\/([^/]+)$/);
      const complaintCommentMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/comments$/);
      const complaintStatusMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/status$/);
      const complaintEtaMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/eta$/);
      const complaintForwardMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/forward$/);
      const complaintFeedbackMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/feedback$/);
      const complaintHandoverFlagMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/handover-flag$/);

      if (departmentCodeMatch) {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        const code = decodeURIComponent(departmentCodeMatch[1]);

        if (method === "PATCH") {
          const department = await repositories.departments.findByCode(code);
          if (!department) {
            sendJson(res, 404, { success: false, message: "Department not found." });
            return;
          }

          const body = await readJsonBody(req);
          const patch = {
            name: String(body.name || department.name).trim(),
            type: String(body.type || department.type || "Mahashakha").trim(),
            wards: Array.isArray(body.wards) ? body.wards.map((item) => String(item).trim()).filter(Boolean) : department.wards || [],
            description: body.description !== undefined ? String(body.description || "").trim() : department.description || "",
            active: body.active === undefined ? department.active !== false : Boolean(body.active),
          };

          await repositories.departments.updateDepartment(code, patch);
          sendJson(res, 200, {
            success: true,
            department: sanitizeDepartment({ ...department, ...patch }),
          });
          return;
        }

        if (method === "DELETE") {
          await repositories.departments.deleteDepartment(code);
          sendJson(res, 200, { success: true, message: "Department deleted." });
          return;
        }
      }

      if (officerIdMatch && method === "PATCH") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        const officer = await repositories.officeAccounts.findById(officerIdMatch[1]);
        if (!officer) {
          sendJson(res, 404, { success: false, message: "Officer not found." });
          return;
        }

        const body = await readJsonBody(req);
        const requestedLoginId = body.loginId !== undefined ? String(body.loginId || "").trim() : officer.loginId;
        if (requestedLoginId && requestedLoginId !== officer.loginId) {
          const existingLogin = await repositories.officeAccounts.findByLoginId(requestedLoginId);
          if (existingLogin && String(existingLogin._id) !== String(officer._id)) {
            sendJson(res, 409, { success: false, message: "This login ID is already in use." });
            return;
          }
        }
        const nextWeeks = Array.isArray(body.assignmentWeeks)
          ? body.assignmentWeeks.map((item) => String(item).trim()).filter(Boolean)
          : getEffectiveAssignmentWeeks(officer);
        const isActive = body.active === undefined ? officer.status === "active" : Boolean(body.active);
        const nextOfficeType = body.officeType !== undefined ? String(body.officeType || officer.officeType).trim() : officer.officeType;
        const departmentRecords = nextOfficeType === "department" ? await repositories.departments.listDepartments() : [];
        const resolvedDepartment = nextOfficeType === "department"
          ? resolveDepartmentRoutingTarget(departmentRecords, {
            departmentCode: body.departmentCode !== undefined ? String(body.departmentCode || "").trim().toUpperCase() : officer.departmentCode || "",
            divisionName: body.divisionName !== undefined ? String(body.divisionName || "").trim() : officer.divisionName || "",
            sectionName: body.sectionName !== undefined ? String(body.sectionName || "").trim() : officer.sectionName || "",
          })
          : { departmentCode: "", divisionName: "", sectionName: "" };
        const patch = {
          role: nextOfficeType === "ward" ? "ward" : "department",
          officeType: nextOfficeType,
          name: body.name !== undefined ? String(body.name || "").trim() : officer.name,
          loginId: requestedLoginId,
          email: body.email !== undefined ? String(body.email || "").trim() : officer.email || "",
          phone: body.phone !== undefined ? String(body.phone || "").trim() : officer.phone || "",
          departmentCode: nextOfficeType === "department"
            ? resolvedDepartment.departmentCode
            : "",
          divisionName: nextOfficeType === "department"
            ? resolvedDepartment.divisionName
            : "",
          sectionName: nextOfficeType === "department"
            ? resolvedDepartment.sectionName
            : "",
          wardNumber: nextOfficeType === "ward"
            ? (body.wardNumber !== undefined ? String(body.wardNumber || "").trim() : officer.wardNumber || "")
            : "",
          status: isActive ? "active" : "inactive",
          assignmentWeeks: isActive ? (nextWeeks.length ? nextWeeks : [getCurrentWeekKey()]) : [],
          activationStartAt: isActive ? (officer.activationStartAt || new Date()) : null,
          activationExpiresAt: isActive ? (officer.activationExpiresAt || endOfCurrentWeek()) : null,
        };

        if (nextOfficeType === "department" && (!patch.departmentCode || !patch.divisionName || !patch.sectionName)) {
          sendJson(res, 400, { success: false, message: "Department and sub-department are required for department officers." });
          return;
        }

        if (nextOfficeType === "ward" && !patch.wardNumber) {
          sendJson(res, 400, { success: false, message: "Ward number is required for ward officers." });
          return;
        }

        if (body.password) {
          patch.passwordHash = hashPassword(String(body.password));
        }

        // Handle a single performanceAdjustment object sent alongside other fields
        if (body.performanceAdjustment && typeof body.performanceAdjustment === "object") {
          await applyPerformanceAdjustment(repositories, String(officer._id), {
            points: Number(body.performanceAdjustment.points || 0),
            message: String(body.performanceAdjustment.message || ""),
            pending: Boolean(body.performanceAdjustment.pending),
          });
        }

        await repositories.officeAccounts.updateOfficeAccount(String(officer._id), patch);
        sendJson(res, 200, {
          success: true,
          officer: sanitizeOfficeAccount({ ...officer, ...patch }),
        });
        return;
      }

      if (oversightDecisionMatch && method === "PATCH") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        const tokenNumber = oversightDecisionMatch[1];
        const complaint = await repositories.complaints.findByTokenNumber(tokenNumber);
        if (!complaint) {
          sendJson(res, 404, { success: false, message: "Complaint not found." });
          return;
        }

        const body = await readJsonBody(req);
        const action = String(body.action || "").trim();
        const comment = String(body.comment || "").trim();
        const targetDepartmentCode = String(body.targetDepartmentCode || "").trim().toUpperCase();
        const targetDivisionName = String(body.targetDivisionName || "").trim();
        const targetSectionName = String(body.targetSectionName || "").trim();

        if (action === "approve_invalid") {
          await repositories.complaints.updateComplaint(tokenNumber, {
            status: "closed_invalid",
            validityVerified: true,
            pointsAwarded: 0,
            closureConfirmedAt: new Date(),
            escalated: false,
          });
        } else if (action === "reject_invalid") {
          await repositories.complaints.updateComplaint(tokenNumber, {
            status: complaint.acceptedByOfficerId ? "in_progress" : "pending",
            validityVerified: false,
          });
        } else if (action === "transfer_higher_level") {
          await repositories.complaints.updateComplaint(tokenNumber, {
            status: "cannot_solve",
            closureConfirmedAt: new Date(),
            escalated: true,
            assignedDepartment: "Higher Level Authority",
            assignedOfficeLabel: "Higher Level Authority",
            forwardedTo: "Transferred to higher level authority",
            forwardedToLabel: "Transferred to higher level authority",
          });
        } else if (action === "transfer_department") {
          const departmentRecords = await repositories.departments.listDepartments();
          const resolvedTarget = resolveDepartmentRoutingTarget(departmentRecords, {
            departmentCode: targetDepartmentCode,
            divisionName: targetDivisionName,
            sectionName: targetSectionName,
          });

          if (!resolvedTarget.divisionName || !resolvedTarget.sectionName) {
            sendJson(res, 400, { success: false, message: "Target department and sub-department are required." });
            return;
          }

          const forwardingResult = await assignSpecificOffice(repositories, {
            officeType: "department",
            divisionName: resolvedTarget.divisionName,
            sectionName: resolvedTarget.sectionName,
          });

          await repositories.complaints.updateComplaint(tokenNumber, {
            status: forwardingResult.officeType === "central_admin" ? "escalated" : "pending",
            officeType: forwardingResult.officeType,
            divisionName: forwardingResult.divisionName || "",
            sectionName: forwardingResult.sectionName || "",
            wardNumber: forwardingResult.wardNumber || complaint.wardNumber || "",
            routeBucket: forwardingResult.routeBucket,
            assignedOfficerId: forwardingResult.assignedOfficer ? String(forwardingResult.assignedOfficer._id) : "",
            assignedOfficerName: forwardingResult.assignedOfficer ? forwardingResult.assignedOfficer.name : "",
            assignedDepartment: forwardingResult.divisionName || (forwardingResult.officeType === "ward" ? `Ward ${forwardingResult.wardNumber}` : "Central Admin"),
            assignedOfficeLabel:
              forwardingResult.officeType === "ward"
                ? `Ward ${forwardingResult.wardNumber}`
                : forwardingResult.officeType === "central_admin"
                  ? "Central Admin"
                  : `${forwardingResult.divisionName} / ${forwardingResult.sectionName}`,
            escalated: forwardingResult.officeType === "central_admin",
            forwardedTo: "Transferred by Central Admin",
            forwardedToLabel: "Transferred by Central Admin",
            acceptedAt: null,
            acceptedByOfficerId: "",
          });
        } else if (action === "validate_review") {
          await applyOfficerActionReviewDecision(repositories, complaint, true, comment);
        } else if (action === "dismiss_review") {
          await applyOfficerActionReviewDecision(repositories, complaint, false, comment);
        } else if (action === "verify_handover_flag") {
          // Admin confirms the incoming officer's flag is valid:
          // deduct points from outgoing officer, award points to flagging officer, re-open complaint
          if (!complaint.handoverFlag) {
            sendJson(res, 400, { success: false, message: "No handover flag on this complaint." });
            return;
          }
          const outgoingOfficerId = complaint.assignedOfficerId;
          const flaggingOfficerId = complaint.handoverFlag.flaggedByOfficerId;
          if (outgoingOfficerId) {
            await applyPerformanceAdjustment(repositories, outgoingOfficerId, {
              points: -15,
              message: `Handover flag verified: ${complaint.handoverFlag.reason}`,
            });
          }
          if (flaggingOfficerId) {
            await applyPerformanceAdjustment(repositories, flaggingOfficerId, {
              points: 10,
              message: "Points awarded for valid handover flag catch.",
            });
          }
          await repositories.complaints.updateComplaint(tokenNumber, {
            handoverFlagStatus: "verified",
            status: "in_progress",
            escalated: false,
          });
        } else if (action === "reject_handover_flag") {
          // Admin dismisses the flag — complaint stays solved, no point changes
          if (!complaint.handoverFlag) {
            sendJson(res, 400, { success: false, message: "No handover flag on this complaint." });
            return;
          }
          await repositories.complaints.updateComplaint(tokenNumber, {
            handoverFlagStatus: "rejected",
            status: "solved",
            escalated: false,
          });
        } else {
          sendJson(res, 400, { success: false, message: "Invalid oversight action." });
          return;
        }

        if (comment) {
          await appendCommentAndHistory(repositories, complaint, actor, comment, "public");
        }
        await appendHistoryEntry(
          repositories,
          complaint,
          actor,
          "admin_decision",
          `${action}${comment ? ` | ${comment}` : ""}`,
        );

        sendJson(res, 200, { success: true, message: "Admin decision recorded." });
        return;
      }

      if (complaintTokenMatch && method === "GET") {
        const actor = await requireAuth(req, res, repositories, ["citizen", "department", "ward", "admin"]);
        if (!actor) return;

        const complaint = await repositories.complaints.findByTokenNumber(complaintTokenMatch[1]);
        if (!canAccessComplaint(actor, complaint)) {
          sendJson(res, complaint ? 403 : 404, { success: false, message: complaint ? "Access denied." : "Complaint not found." });
          return;
        }

        sendJson(res, 200, {
          success: true,
          complaint: await enrichComplaint(repositories, complaint, actor.role === "citizen" ? "citizen" : "officer"),
        });
        return;
      }

      if (complaintCommentMatch && method === "POST") {
        const actor = await requireAuth(req, res, repositories, ["department", "ward", "admin"]);
        if (!actor) return;

        const complaint = await repositories.complaints.findByTokenNumber(complaintCommentMatch[1]);
        if (!canAccessComplaint(actor, complaint) && actor.role !== "admin") {
          sendJson(res, complaint ? 403 : 404, { success: false, message: complaint ? "Access denied." : "Complaint not found." });
          return;
        }

        const body = await readJsonBody(req);
        const comment = String(body.comment || "").trim();
        const visibility = body.visibility === "public" ? "public" : "internal";

        if (!comment) {
          sendJson(res, 400, { success: false, message: "Comment text is required." });
          return;
        }

        await appendCommentAndHistory(repositories, complaint, actor, comment, visibility);
        if (!complaint.firstResponseAt) {
          await repositories.complaints.updateComplaint(complaint.tokenNumber, { firstResponseAt: new Date() });
        }
        await appendHistoryEntry(repositories, complaint, actor, "comment", comment);
        sendJson(res, 200, { success: true, message: "Comment added successfully." });
        return;
      }

      if (complaintFeedbackMatch && method === "PATCH") {
        const actor = await requireAuth(req, res, repositories, ["citizen"]);
        if (!actor) return;

        const complaint = await repositories.complaints.findByTokenNumber(complaintFeedbackMatch[1]);
        if (!complaint || complaint.citizenId !== actor.principalId) {
          sendJson(res, complaint ? 403 : 404, { success: false, message: complaint ? "Access denied." : "Complaint not found." });
          return;
        }

        if (complaint.status !== "solved") {
          sendJson(res, 400, { success: false, message: "Feedback can only be submitted after resolution." });
          return;
        }

        const body = await readJsonBody(req);
        const rating = Math.max(0, Math.min(5, Number(body.rating || 0)));
        const closureComment = String(body.comment || "").trim();
        const confirmedAt = new Date();

        await repositories.complaints.updateComplaint(complaint.tokenNumber, {
          citizenRating: rating,
          closureConfirmedAt: confirmedAt,
        });

        if (closureComment) {
          await appendCommentAndHistory(repositories, complaint, actor, closureComment, "public");
        }
        await appendHistoryEntry(repositories, complaint, actor, "citizen_feedback", `Citizen rated resolution ${rating || 0}/5.`);
        sendJson(res, 200, { success: true, message: "Resolution feedback saved." });
        return;
      }

      if (complaintStatusMatch && method === "PATCH") {
        const actor = await requireAuth(req, res, repositories, ["department", "ward", "admin"]);
        if (!actor) return;

        const complaint = await repositories.complaints.findByTokenNumber(complaintStatusMatch[1]);
        if (!canAccessComplaint(actor, complaint) && actor.role !== "admin") {
          sendJson(res, complaint ? 403 : 404, { success: false, message: complaint ? "Access denied." : "Complaint not found." });
          return;
        }

        const body = await readJsonBody(req);
        const status = String(body.status || "").trim().toLowerCase();
        const comment = String(body.comment || "").trim();
        const validStatuses = ["pending", "in_progress", "solved", "delayed", "pending_admin_verification"];

        if (!validStatuses.includes(status)) {
          sendJson(res, 400, { success: false, message: "Invalid complaint status." });
          return;
        }

        if (status === "delayed" && !comment) {
          sendJson(res, 400, { success: false, message: "Delay reason comment is required." });
          return;
        }

        const patch = {
          status,
          firstResponseAt: complaint.firstResponseAt || new Date(),
          delayReason: status === "delayed" ? comment : "",
          acceptedAt: complaint.acceptedAt || (status === "in_progress" ? new Date() : null),
          acceptedByOfficerId: complaint.acceptedByOfficerId || (status === "in_progress" ? actor.principalId : ""),
          assignedOfficerId: status === "in_progress" ? actor.principalId : complaint.assignedOfficerId || "",
          assignedOfficerName: status === "in_progress" ? actor.name : complaint.assignedOfficerName || "",
        };

        if (status === "solved" && !complaint.validityVerified) {
          patch.validityVerified = true;
          patch.pointsAwarded = pointsForComplaint(complaint);
        }

        if (status === "solved" && complaint.officerActionReview?.status === "pending") {
          patch.officerActionReview = {
            ...complaint.officerActionReview,
            resolvingOfficerId: actor.principalId,
            resolvingOfficerName: actor.name,
          };
        }

        await repositories.complaints.updateComplaint(complaint.tokenNumber, patch);

        // Award citizen points when solved
        if (status === "solved" && !complaint.validityVerified && !complaint.anonymous && complaint.citizenId) {
          const citizenPoints = pointsForComplaint(complaint);
          try {
            const citizenUser = await repositories.users.findById(complaint.citizenId);
            if (citizenUser) {
              const currentPoints = Number(citizenUser.rewardPoints || 0);
              await repositories.users.updateUser(complaint.citizenId, { rewardPoints: currentPoints + citizenPoints });
            }
          } catch {}
        }

        // Award officer points when solved
        if (status === "solved" && !complaint.validityVerified && actor.role !== "admin") {
          const officerPoints = officerPointsForComplaint({ ...complaint, updatedAt: new Date() });
          try {
            const officerAccount = await repositories.officeAccounts.findById(actor.principalId);
            if (officerAccount) {
              const existing = officerAccount.performanceAdjustments || [];
              await repositories.officeAccounts.updateOfficeAccount(actor.principalId, {
                performanceAdjustments: [
                  ...existing,
                  {
                    points: officerPoints,
                    message: `Solved complaint ${complaint.tokenNumber} (+${officerPoints} pts)`,
                    status: "verified",
                    createdAt: new Date(),
                  },
                ],
              });
            }
          } catch {}
        }

        if (comment) {
          await appendCommentAndHistory(repositories, complaint, actor, comment, "public");
        }
        await appendHistoryEntry(
          repositories,
          { ...complaint, comments: [...(complaint.comments || [])] },
          actor,
          status === "solved" ? "solved" : status === "delayed" ? "delayed" : status === "pending_admin_verification" ? "invalid_request" : "status_update",
          status === "delayed"
            ? `Marked delayed: ${comment}`
            : status === "pending_admin_verification"
              ? `Marked invalid pending admin verification: ${comment}`
              : `Status changed to ${status}.`,
        );
        sendJson(res, 200, { success: true, message: "Complaint status updated." });
        return;
      }

      if (complaintEtaMatch && method === "PATCH") {
        const actor = await requireAuth(req, res, repositories, ["department", "ward", "admin"]);
        if (!actor) return;

        const complaint = await repositories.complaints.findByTokenNumber(complaintEtaMatch[1]);
        if (!canAccessComplaint(actor, complaint) && actor.role !== "admin") {
          sendJson(res, complaint ? 403 : 404, { success: false, message: complaint ? "Access denied." : "Complaint not found." });
          return;
        }

        const body = await readJsonBody(req);
        const estimatedCompletionAt = String(body.estimatedCompletionAt || "").trim();
        if (!estimatedCompletionAt) {
          sendJson(res, 400, { success: false, message: "Estimated completion time is required." });
          return;
        }

        await repositories.complaints.updateComplaint(complaint.tokenNumber, {
          estimatedCompletionAt,
          firstResponseAt: complaint.firstResponseAt || new Date(),
        });
        await appendHistoryEntry(repositories, complaint, actor, "eta_update", `Estimated completion set to ${estimatedCompletionAt}.`);
        sendJson(res, 200, { success: true, message: "Estimated completion updated." });
        return;
      }

      if (complaintForwardMatch && method === "PATCH") {
        const actor = await requireAuth(req, res, repositories, ["department", "ward", "admin"]);
        if (!actor) return;

        const complaint = await repositories.complaints.findByTokenNumber(complaintForwardMatch[1]);
        if (!canAccessComplaint(actor, complaint) && actor.role !== "admin") {
          sendJson(res, complaint ? 403 : 404, { success: false, message: complaint ? "Access denied." : "Complaint not found." });
          return;
        }

        const body = await readJsonBody(req);
        const comment = String(body.comment || "").trim();
        const escalateToCentralAdmin = Boolean(body.escalateToCentralAdmin);
        const targetOfficeType = String(body.targetOfficeType || "").trim();
        const targetDivisionName = String(body.targetDivisionName || "").trim();
        const targetSectionName = String(body.targetSectionName || "").trim();
        const targetWardNumber = String(body.targetWardNumber || "").trim();

        let forwardingResult;
        if (escalateToCentralAdmin) {
          forwardingResult = {
            officeType: "central_admin",
            assignedOfficer: null,
            divisionName: "",
            sectionName: "",
            wardNumber: "",
            routeBucket: "central-admin",
            assignmentReason: "Escalated to central admin.",
          };
        } else {
          if (targetOfficeType === "department" && targetDivisionName && targetSectionName) {
            forwardingResult = await assignSpecificOffice(repositories, {
              officeType: "department",
              divisionName: targetDivisionName,
              sectionName: targetSectionName,
            });
          } else if (targetOfficeType === "ward" && targetWardNumber) {
            forwardingResult = await assignSpecificOffice(repositories, {
              officeType: "ward",
              wardNumber: targetWardNumber,
            });
          } else {
            forwardingResult = await routeAndAssignComplaint(repositories, {
              category: complaint.category,
              subcategory: complaint.subcategory,
              locationText: complaint.locationText,
              description: comment || complaint.description,
              wardNumber: complaint.wardNumber,
            });
          }
        }

        const forwardedToLabel =
          forwardingResult.officeType === "ward"
            ? `Forwarded to Ward ${forwardingResult.wardNumber}`
            : forwardingResult.officeType === "central_admin"
              ? "Escalated to Central Admin"
              : `Forwarded to ${forwardingResult.divisionName} / ${forwardingResult.sectionName}`;

        const officerActionReview = actor.role === "admin"
          ? complaint.officerActionReview || null
          : {
            status: "pending",
            priorOfficerId: actor.principalId,
            priorOfficerName: actor.name,
            resolvingOfficerId: "",
            resolvingOfficerName: "",
            createdAt: new Date(),
            note: comment || (escalateToCentralAdmin ? "Officer escalated complaint to central admin." : "Officer forwarded complaint to another office."),
          };

        await repositories.complaints.updateComplaint(complaint.tokenNumber, {
          status: escalateToCentralAdmin ? "escalated" : "forwarded",
          officeType: forwardingResult.officeType,
          divisionName: forwardingResult.divisionName || "",
          sectionName: forwardingResult.sectionName || "",
          wardNumber: forwardingResult.wardNumber || complaint.wardNumber || "",
          routeBucket: forwardingResult.routeBucket,
          assignedOfficerId: forwardingResult.assignedOfficer ? String(forwardingResult.assignedOfficer._id) : "",
          assignedOfficerName: forwardingResult.assignedOfficer ? forwardingResult.assignedOfficer.name : "Central Admin",
          assignedDepartment: forwardingResult.divisionName || (forwardingResult.officeType === "ward" ? `Ward ${forwardingResult.wardNumber}` : "Central Admin"),
          assignedOfficeLabel:
            forwardingResult.officeType === "ward"
              ? `Ward ${forwardingResult.wardNumber}`
              : forwardingResult.officeType === "central_admin"
                ? "Central Admin"
                : `${forwardingResult.divisionName} / ${forwardingResult.sectionName}`,
          forwardedTo: forwardedToLabel,
          escalated: escalateToCentralAdmin,
          forwardedToLabel,
          firstResponseAt: complaint.firstResponseAt || new Date(),
          acceptedAt: null,
          acceptedByOfficerId: "",
          officerActionReview,
        });

        if (comment) {
          await appendCommentAndHistory(repositories, complaint, actor, comment, "public");
        }

        await appendHistoryEntry(
          repositories,
          complaint,
          actor,
          escalateToCentralAdmin ? "escalated" : "forwarded",
          `${forwardedToLabel}${comment ? ` | ${comment}` : ""}`,
        );
        sendJson(res, 200, { success: true, message: "Complaint forwarded successfully." });
        return;
      }

      // PATCH /api/admin/officers/:id/adjustments/:index — verify or reject a pending point adjustment
      if (officerAdjustmentMatch && method === "PATCH") {
        const actor = await requireAuth(req, res, repositories, ["admin"]);
        if (!actor) return;

        const officerId = officerAdjustmentMatch[1];
        const adjustmentIndex = parseInt(officerAdjustmentMatch[2], 10);
        const officer = await repositories.officeAccounts.findById(officerId);
        if (!officer) {
          sendJson(res, 404, { success: false, message: "Officer not found." });
          return;
        }

        const adjustments = Array.isArray(officer.performanceAdjustments) ? officer.performanceAdjustments : [];
        if (adjustmentIndex < 0 || adjustmentIndex >= adjustments.length) {
          sendJson(res, 400, { success: false, message: "Invalid adjustment index." });
          return;
        }

        const body = await readJsonBody(req);
        const action = String(body.action || "").trim();
        if (!["verify", "reject"].includes(action)) {
          sendJson(res, 400, { success: false, message: "Action must be 'verify' or 'reject'." });
          return;
        }

        const nextAdjustments = adjustments.map((entry, idx) =>
          idx === adjustmentIndex ? { ...entry, status: action === "verify" ? "verified" : "rejected" } : entry
        );

        await repositories.officeAccounts.updateOfficeAccount(officerId, {
          performanceAdjustments: nextAdjustments,
        });

        sendJson(res, 200, { success: true, message: `Adjustment ${action === "verify" ? "verified" : "rejected"}.` });
        return;
      }

      // POST /api/complaints/:tokenNumber/handover-flag
      if (complaintHandoverFlagMatch && method === "POST") {
        const actor = await requireAuth(req, res, repositories, ["department", "ward"]);
        if (!actor) return;

        const tokenNumber = complaintHandoverFlagMatch[1];
        const complaint = await repositories.complaints.findByTokenNumber(tokenNumber);

        if (!complaint) {
          sendJson(res, 404, { success: false, message: "Complaint not found." });
          return;
        }
        if (complaint.status !== "solved") {
          sendJson(res, 400, { success: false, message: "Only solved complaints can be flagged during handover." });
          return;
        }
        if (complaint.handoverFlagStatus === "pending") {
          sendJson(res, 409, { success: false, message: "This complaint already has a pending handover flag." });
          return;
        }

        // Verify the flagging officer is in the same routing bucket as the complaint
        const inSameBucket = actor.role === "ward"
          ? String(complaint.wardNumber) === String(actor.wardNumber)
          : complaint.divisionName === actor.divisionName && complaint.sectionName === actor.sectionName;

        if (!inSameBucket) {
          sendJson(res, 403, { success: false, message: "You can only flag complaints assigned to your department/ward." });
          return;
        }

        const body = await readJsonBody(req);
        const reason = String(body.reason || "").trim();
        if (!reason) {
          sendJson(res, 400, { success: false, message: "A reason is required when flagging a complaint." });
          return;
        }

        await repositories.complaints.updateComplaint(tokenNumber, {
          handoverFlag: {
            flaggedByOfficerId: actor.principalId,
            flaggedByOfficerName: actor.name,
            reason,
            flaggedAt: new Date(),
          },
          handoverFlagStatus: "pending",
          status: "pending_admin_verification",
        });

        await appendHistoryEntry(repositories, complaint, actor, "handover_flagged", `Flagged during handover: ${reason}`);

        sendJson(res, 200, { success: true, message: "Complaint flagged for admin review." });
        return;
      }

      if (method === "POST" && pathname === "/api/chatbot") {
        const ip = getClientIp(req);
        if (!checkRateLimit(chatbotRateLimiter, ip, 30)) {
          sendJson(res, 429, { success: false, message: "Rate limit exceeded. Try again in an hour." });
          return;
        }
        const chatBody = await readJsonBody(req);
        const latestUserMessage = typeof chatBody.message === "string"
          ? chatBody.message
          : Array.isArray(chatBody.messages)
            ? [...chatBody.messages].reverse().find((entry) => entry?.role === "user" && typeof entry.content === "string")?.content || ""
            : "";
        const imageDescription = typeof chatBody.image_description === "string"
          ? chatBody.image_description.trim().slice(0, 200)
          : "";

        if (latestUserMessage.length > 1000) {
          sendJson(res, 400, { success: false, message: "Message is too long." });
          return;
        }

        const fallbackLanguage = chatBody.language === "ne" ? "ne" : "en";
        let draft = parseChatbotDraft(chatBody.draft || {}, fallbackLanguage);
        draft = mergeChatbotDraft(draft, { language: detectChatbotLanguage(latestUserMessage, draft.language || fallbackLanguage) }, fallbackLanguage);

        if (isChatbotCancelText(latestUserMessage)) {
          const reply = draft.language === "ne"
            ? "ठीक छ। यो गुनासो संवाद यहीं रोकियो। फेरि सुरु गर्न चाहनुहुन्छ भने नयाँ सन्देश पठाउनुहोस्।"
            : "Understood. I have cancelled this complaint conversation. Send a new message whenever you want to start again.";
          sendJson(res, 200, {
            success: true,
            reply,
            draft: parseChatbotDraft({}, draft.language),
            readyToSubmit: false,
            cancelled: true,
            language: draft.language,
          });
          return;
        }

        if (!latestUserMessage.trim() && imageDescription) {
          const reply = draft.language === "ne"
            ? "मैले तस्बिर संलग्न भएको देखेँ। कृपया समस्या के हो र कहाँ हो भन्ने छोटो विवरण पनि दिनुहोस्।"
            : "I can see that an image has been attached. Please also tell me what the issue is and where it is located.";
          sendJson(res, 200, {
            success: true,
            reply,
            draft,
            readyToSubmit: false,
            cancelled: false,
            language: draft.language,
          });
          return;
        }

        const missingBefore = identifyChatbotMissingRequired(draft);
        const canInterpretConfirmation = missingBefore.length === 0;
        const wantsConfirmation = canInterpretConfirmation && isChatbotConfirmationText(latestUserMessage);
        const wantsPhoneSkip = missingBefore.length === 0 && !draft.phone && isChatbotPhoneSkipText(latestUserMessage);

        const localPatch = buildLocalChatbotPatch(latestUserMessage, draft, fallbackLanguage);
        if (wantsPhoneSkip) {
          localPatch.phoneSkipped = true;
        }

        let aiPatch = null;
        if (shouldUseDeepSeekForChatbot(latestUserMessage, draft, localPatch)) {
          aiPatch = await callDeepSeekChatbotExtraction({
            message: latestUserMessage,
            draft,
            imageDescription,
          });
        }

        const mergedPatch = {
          ...(aiPatch || {}),
          language: localPatch.language || aiPatch?.language || draft.language,
          categoryHint: localPatch.categoryHint || aiPatch?.categoryHint || "",
          department: localPatch.department || aiPatch?.department || "",
          location: (localPatch.location && (!aiPatch?.location || aiPatch.location === aiPatch.description))
            ? localPatch.location
            : (aiPatch?.location || localPatch.location || ""),
          description: aiPatch?.description || localPatch.description || "",
          ward_number: localPatch.ward_number ?? aiPatch?.ward_number ?? null,
          phone: localPatch.phone || aiPatch?.phone || "",
          phoneSkipped: localPatch.phoneSkipped || false,
        };

        draft = mergeChatbotDraft(draft, mergedPatch, fallbackLanguage);

        if (!draft.department) {
          const inferredFromDescription = inferDepartmentFromText(`${draft.description} ${latestUserMessage}`);
          if (inferredFromDescription) {
            draft = mergeChatbotDraft(draft, {
              categoryHint: inferredFromDescription.category,
              department: labelChatbotDepartment(inferredFromDescription, draft.language),
            }, draft.language);
          }
        }

        let readyToSubmit = false;
        if (identifyChatbotMissingRequired(draft).length === 0 && wantsConfirmation) {
          if (!draft.phone) {
            draft = mergeChatbotDraft(draft, { phoneSkipped: true }, draft.language);
          }
          readyToSubmit = true;
        }

        const reply = buildChatbotReply(draft, draft.language, { confirmed: readyToSubmit });
        sendJson(res, 200, {
          success: true,
          reply,
          draft,
          readyToSubmit,
          cancelled: false,
          language: draft.language,
        });
        return;
      }

      sendJson(res, 404, {
        success: false,
        message: "Route not found.",
        requested: `${method} ${pathname}`,
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        message: error.message || "Internal server error.",
      });
    }
  });
}

async function startServer() {
  let repositories;
  let runtime = {
    mode: "mongo",
    message: "MongoDB connected.",
  };

  try {
    await connectToDatabase();
    const database = getDatabase();
    const collections = getCollections();
    repositories = {
      users: getUserRepository(),
      officeAccounts: getOfficeAccountRepository(),
      sessions: getSessionRepository(),
      assignmentCounters: getAssignmentCounterRepository(),
      comments: getCommentRepository(),
      complaints: getComplaintRepository(),
      departments: getDepartmentRepository(),
      wards: getWardRepository(),
      admin: getAdminRepository(),
    };

    console.log(`PNPP backend scaffold ready on port ${appConfig.port}`);
    console.log(`Connected database: ${database.databaseName}`);
    console.log(`Centralized collections: ${Object.keys(collections).join(", ")}`);
  } catch (error) {
    runtime = {
      mode: "local",
      message: `MongoDB unavailable. Using local fallback store. Original error: ${error.message}`,
    };
    repositories = createLocalRepositories();
    console.warn(runtime.message);
  }

  console.log(`Repositories ready: ${Object.keys(repositories).join(", ")}`);
  const server = await createServer({ repositories, runtime });
  server.listen(appConfig.port, () => {
    console.log(`HTTP server listening on http://localhost:${appConfig.port}`);
    console.log(`Storage mode: ${runtime.mode}`);
    console.log("Planned routes:");
    routes.forEach((route) => console.log(`- ${route}`));
  });
}

startServer();
