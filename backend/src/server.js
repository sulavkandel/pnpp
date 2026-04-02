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
  "GET /api/citizen/dashboard",
  "GET /api/officer/dashboard",
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
  { keywords: ["road", "pothole", "bridge", "blacktop"], divisionName: "Infrastructure Development", sectionName: "Road Section" },
  { keywords: ["water", "pipe", "sewer", "drain", "drainage"], divisionName: "Infrastructure Development", sectionName: "Water & Sewer" },
  { keywords: ["garbage", "waste", "sanitation", "trash"], divisionName: "Urban Dev & Environment", sectionName: "Sanitation/Waste" },
  { keywords: ["tree", "park", "greenery", "tourism"], divisionName: "Urban Dev & Environment", sectionName: "Greenery Units" },
  { keywords: ["school", "teacher", "education"], divisionName: "Education", sectionName: "School Management / Education Programs" },
  { keywords: ["hospital", "clinic", "health", "medicine"], divisionName: "Health", sectionName: "Health Services / Health Center Coordination" },
  { keywords: ["tax", "revenue", "procurement", "audit"], divisionName: "Finance & Revenue", sectionName: "Revenue/Tax Units" },
  { keywords: ["job", "employment", "business", "agri", "livestock"], divisionName: "Economic Development", sectionName: "Employment" },
  { keywords: ["law", "legal", "dispute"], divisionName: "Legal", sectionName: "Legal Advice / Dispute Management" },
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
    wards: department.wards || [],
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

function startOfCurrentWeek() {
  const date = new Date();
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
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

function determineDepartmentRoute(category, text) {
  if (directDepartmentMap[category]) {
    return directDepartmentMap[category];
  }

  const normalized = normalizeText(text);
  for (const rule of routingRules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return {
        divisionName: rule.divisionName,
        sectionName: rule.sectionName,
      };
    }
  }

  return {
    divisionName: "Administration",
    sectionName: "Admin Section",
  };
}

async function routeAndAssignComplaint(repositories, payload) {
  const wardNumber = inferWardNumber(payload.wardNumber, payload.locationText);
  const category = normalizeCategory(payload.category);
  const routingText = `${payload.subcategory} ${payload.description} ${payload.locationText}`;

  let officeType = "department";
  let divisionName = "";
  let sectionName = "";
  let routeBucket = "";

  if (wardNumber && ["garbage", "light", "other"].includes(category)) {
    officeType = "ward";
    routeBucket = `ward:${wardNumber}`;
  } else {
    const departmentRoute = determineDepartmentRoute(category, routingText);
    divisionName = departmentRoute.divisionName;
    sectionName = departmentRoute.sectionName;
    routeBucket = `department:${divisionName}:${sectionName}`;
  }

  const candidates = officeType === "ward"
    ? await repositories.officeAccounts.listByOfficeType("ward")
    : await repositories.officeAccounts.listByOfficeType("department");

  const matchingCandidates = candidates
    .filter((candidate) => candidate.status !== "inactive")
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
    assignmentReason: `Automatically routed to ${officeType === "ward" ? `Ward ${wardNumber}` : `${divisionName} / ${sectionName}`}.`,
    assignedOfficer,
  };
}

async function assignSpecificOffice(repositories, target) {
  const officeType = target.officeType;
  const candidates = officeType === "ward"
    ? await repositories.officeAccounts.listByOfficeType("ward")
    : await repositories.officeAccounts.listByOfficeType("department");

  const matchingCandidates = candidates
    .filter((candidate) => candidate.status !== "inactive")
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
  const allTimePoints = completed.reduce((sum, item) => sum + officerPointsForComplaint(item), 0)
    + adjustments.reduce((sum, entry) => sum + Number(entry.points || 0), 0);
  const currentWeekPoints = thisWeekCompleted.reduce((sum, item) => sum + officerPointsForComplaint(item), 0)
    + adjustments.filter((entry) => new Date(entry.createdAt || 0).getTime() >= weekStart).reduce((sum, entry) => sum + Number(entry.points || 0), 0);

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
    ["pending", "forwarded"].includes(item.status) && (!item.acceptedByOfficerId || item.assignedOfficerId === currentOfficerId));
  const myAccepted = departmentComplaints.filter((item) =>
    item.assignedOfficerId === currentOfficerId && ["in_progress", "delayed", "pending_admin_verification"].includes(item.status));
  const forwardedOrClosed = departmentComplaints.filter((item) =>
    item.assignedOfficerId === currentOfficerId && ["solved", "escalated"].includes(item.status));
  const firstReviewAlerts = newComplaints.filter((item) => Date.now() - new Date(item.createdAt).getTime() > 12 * 3600000);
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
    return complaint.officeType === "department"
      && complaint.divisionName === (actor.divisionName || "")
      && (
        !actor.sectionName
        || complaint.sectionName === (actor.sectionName || "")
      );
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

  return {
    ...(viewerRole === "citizen" ? complaintSummaryForCitizen(complaint) : complaintSummaryForOfficer(complaint)),
    comments: comments.filter((comment) => viewerRole !== "citizen" || comment.visibility === "public"),
    history,
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
  const officerReviewCandidates = complaints.filter((item) =>
    item.status === "forwarded"
    || item.status === "escalated"
    || (item.history || []).some((entry) => ["forwarded", "escalated"].includes(entry.action)));

  return {
    escalated: complaints
      .filter((item) => item.status === "escalated" || item.officeType === "central_admin")
      .map(complaintSummaryForOfficer),
    invalidPending: complaints
      .filter((item) => item.status === "pending_admin_verification")
      .map(complaintSummaryForOfficer),
    officerActionReviews: officerReviewCandidates.map(complaintSummaryForOfficer),
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
      pending: complaints.filter((item) => ["pending", "in_progress", "delayed", "pending_admin_verification"].includes(item.status)).length,
      forwarded: complaints.filter((item) => item.status === "forwarded").length,
      escalated: complaints.filter((item) => item.status === "escalated").length,
      departments: departments.length,
      officers: officers.length,
      activeRotations: activeRotations.length,
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
      createdAt: new Date(),
    },
  ];

  await repositories.officeAccounts.updateOfficeAccount(officerId, {
    performanceAdjustments: nextAdjustments,
  });

  return true;
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

async function handleComplaintCreate(req, res, repositories, actor) {
  const body = await readJsonBody(req);
  const title = String(body.title || "").trim();
  const category = String(body.category || "").trim();
  const subcategory = String(body.subcategory || "").trim();
  const locationText = String(body.locationText || "").trim();
  const description = String(body.description || "").trim();
  const priority = String(body.priority || "medium").trim().toLowerCase();
  const wardNumber = String(body.wardNumber || "").trim();
  const areaName = String(body.areaName || "").trim();
  const nearestLandmark = String(body.nearestLandmark || "").trim();
  const anonymous = Boolean(body.anonymous);
  const contactOptIn = Boolean(body.contactOptIn);

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
    citizenId: actor.principalId,
    citizenMobileNumber: actor.mobileNumber,
    title,
    category,
    subcategory,
    description,
    locationText,
    areaName,
    nearestLandmark,
    wardNumber: routing.wardNumber || wardNumber,
    priority: ["high", "medium", "low"].includes(priority) ? priority : "medium",
    status: routing.officeType === "central_admin" ? "escalated" : "pending",
    officeType: routing.officeType,
    divisionName: routing.divisionName || "",
    sectionName: routing.sectionName || "",
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
    contactOptIn,
    contactName: anonymous ? "" : String(body.contactName || actor.name || "").trim(),
    contactPhone: anonymous ? "" : String(body.contactPhone || actor.mobileNumber || "").trim(),
    contactEmail: anonymous ? "" : String(body.contactEmail || "").trim(),
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
        const email = String(body.email || "").trim();
        const password = String(body.password || "").trim();
        const registerAnonymously = Boolean(body.registerAnonymously);

        if ((!name && !registerAnonymously) || !mobileNumber || !password) {
          sendJson(res, 400, { success: false, message: "Mobile number and password are required. Name is required unless registering anonymously." });
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
        const identifier = String(body.identifier || body.mobileNumber || "").trim();
        const password = String(body.password || "").trim();
        const user = identifier.startsWith("CIT-")
          ? await repositories.users.findByCitizenCode(identifier)
          : await repositories.users.findByMobileNumber(identifier);

        if (!user || user.role !== "citizen" || user.passwordHash !== hashPassword(password)) {
          sendJson(res, 401, { success: false, message: "Invalid mobile number / citizen ID or password." });
          return;
        }

        const session = await createSession(repositories, {
          principalId: String(user._id),
          role: "citizen",
          name: user.name,
          mobileNumber: user.mobileNumber,
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

          if (!name || !loginId || !password) {
            sendJson(res, 400, { success: false, message: "Name, login ID, and password are required." });
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
            departmentCode,
            divisionName: officeType === "department" ? divisionName : "",
            sectionName: officeType === "department" ? sectionName : "",
            wardNumber: officeType === "ward" ? wardNumber : "",
            name,
            email,
            phone,
            loginId,
            passwordHash: hashPassword(password),
            status: active ? "active" : "inactive",
            assignmentWeeks: active ? [getCurrentWeekKey()] : [],
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
          sendJson(res, 400, { success: false, message: "Complaint token number or mobile number is required." });
          return;
        }

        let complaint = await repositories.complaints.findByTokenNumber(query);
        if (!complaint) {
          const citizen = await repositories.users.findByMobileNumber(query);
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
      const oversightDecisionMatch = pathname.match(/^\/api\/admin\/oversight\/([^/]+)$/);
      const complaintTokenMatch = pathname.match(/^\/api\/complaints\/([^/]+)$/);
      const complaintCommentMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/comments$/);
      const complaintStatusMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/status$/);
      const complaintEtaMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/eta$/);
      const complaintForwardMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/forward$/);
      const complaintFeedbackMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/feedback$/);

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
        const patch = {
          name: body.name !== undefined ? String(body.name || "").trim() : officer.name,
          loginId: requestedLoginId,
          email: body.email !== undefined ? String(body.email || "").trim() : officer.email || "",
          phone: body.phone !== undefined ? String(body.phone || "").trim() : officer.phone || "",
          departmentCode: body.departmentCode !== undefined ? String(body.departmentCode || "").trim().toUpperCase() : officer.departmentCode || "",
          divisionName: body.divisionName !== undefined ? String(body.divisionName || "").trim() : officer.divisionName || "",
          sectionName: body.sectionName !== undefined ? String(body.sectionName || "").trim() : officer.sectionName || "",
          wardNumber: body.wardNumber !== undefined ? String(body.wardNumber || "").trim() : officer.wardNumber || "",
          status: body.active === undefined ? officer.status || "active" : (body.active ? "active" : "inactive"),
          assignmentWeeks: body.active === false ? [] : (nextWeeks.length ? nextWeeks : [getCurrentWeekKey()]),
        };

        if (body.password) {
          patch.passwordHash = hashPassword(String(body.password));
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
        const targetOfficeType = String(body.targetOfficeType || "").trim();
        const targetDivisionName = String(body.targetDivisionName || "").trim();
        const targetSectionName = String(body.targetSectionName || "").trim();
        const targetWardNumber = String(body.targetWardNumber || "").trim();
        const pointsAdjustments = Array.isArray(body.pointsAdjustments) ? body.pointsAdjustments : [];

        for (const adjustment of pointsAdjustments) {
          if (adjustment?.officerId) {
            await applyPerformanceAdjustment(repositories, String(adjustment.officerId), {
              points: Number(adjustment.points || 0),
              message: String(adjustment.message || comment || "Admin performance adjustment."),
            });
          }
        }

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
        } else if (action === "cannot_solve") {
          await repositories.complaints.updateComplaint(tokenNumber, {
            status: "cannot_solve",
            closureConfirmedAt: new Date(),
            escalated: false,
          });
        } else if (action === "reassign") {
          const forwardingResult = targetOfficeType === "ward" && targetWardNumber
            ? await assignSpecificOffice(repositories, {
              officeType: "ward",
              wardNumber: targetWardNumber,
            })
            : await assignSpecificOffice(repositories, {
              officeType: "department",
              divisionName: targetDivisionName,
              sectionName: targetSectionName,
            });

          await repositories.complaints.updateComplaint(tokenNumber, {
            status: "pending",
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
            forwardedTo: "Reassigned by Central Admin",
            forwardedToLabel: "Reassigned by Central Admin",
            acceptedAt: null,
            acceptedByOfficerId: "",
          });
        } else if (action === "restore_in_progress") {
          await repositories.complaints.updateComplaint(tokenNumber, {
            status: "in_progress",
            escalated: false,
          });
        } else if (action === "approve_forward") {
          await repositories.complaints.updateComplaint(tokenNumber, {
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

        await repositories.complaints.updateComplaint(complaint.tokenNumber, patch);
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
