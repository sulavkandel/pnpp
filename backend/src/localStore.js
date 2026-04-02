import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function currentWeekKey() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const day = Math.floor((now - start) / 86400000);
  const week = Math.ceil((day + start.getUTCDay() + 1) / 7);
  return `${now.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "local-store.json");

const defaultStore = {
  users: [],
  officeAccounts: [
    {
      _id: "office-road-admin-demo",
      officeType: "department",
      role: "department",
      name: "Road Admin Test",
      loginId: "road_admin_demo_2026",
      passwordHash: crypto.createHash("sha256").update("roadpass123").digest("hex"),
      divisionName: "Infrastructure Development",
      sectionName: "Road Section",
      wardNumber: "",
      status: "active",
      assignmentWeeks: [currentWeekKey()],
      performanceAdjustments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "office-ward-17-demo",
      officeType: "ward",
      role: "ward",
      name: "Ward Seventeen Admin",
      loginId: "ward17_demo_2026",
      passwordHash: crypto.createHash("sha256").update("wardpass123").digest("hex"),
      divisionName: "",
      sectionName: "",
      wardNumber: "17",
      status: "active",
      assignmentWeeks: [currentWeekKey()],
      performanceAdjustments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  sessions: [],
  assignmentCounters: [],
  complaints: [],
  complaintComments: [],
  complaintStatusHistory: [],
  adminLogs: [],
};

function ensureStoreFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultStore, null, 2));
  }
}

function readStore() {
  ensureStoreFile();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function writeStore(store) {
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function makeId(prefix) {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

export function createLocalRepositories() {
  return {
    users: {
      async findByMobileNumber(mobileNumber) {
        return readStore().users.find((user) => user.mobileNumber === mobileNumber) || null;
      },
      async findByCitizenCode(citizenCode) {
        return readStore().users.find((user) => user.citizenCode === citizenCode) || null;
      },
      async findById(id) {
        return readStore().users.find((user) => String(user._id) === String(id)) || null;
      },
      async createUser(user) {
        const store = readStore();
        const insertedId = makeId("user");
        store.users.push({ _id: insertedId, ...user });
        writeStore(store);
        return { insertedId };
      },
      async updateUser(id, patch) {
        const store = readStore();
        const user = store.users.find((item) => String(item._id) === String(id));
        if (user) {
          Object.assign(user, patch, { updatedAt: new Date().toISOString() });
        }
        writeStore(store);
        return { acknowledged: true };
      },
    },
    officeAccounts: {
      async findByLoginId(loginId) {
        return readStore().officeAccounts.find((item) => item.loginId === loginId) || null;
      },
      async findByOfficeTypeAndLoginId(officeType, loginId) {
        return readStore().officeAccounts.find((item) => item.officeType === officeType && item.loginId === loginId) || null;
      },
      async createOfficeAccount(account) {
        const store = readStore();
        const insertedId = makeId("office");
        store.officeAccounts.push({ _id: insertedId, ...account });
        writeStore(store);
        return { insertedId };
      },
      async findById(id) {
        return readStore().officeAccounts.find((item) => String(item._id) === String(id)) || null;
      },
      async updateOfficeAccount(id, patch) {
        const store = readStore();
        const office = store.officeAccounts.find((item) => String(item._id) === String(id));
        if (office) {
          Object.assign(office, patch, { updatedAt: new Date().toISOString() });
        }
        writeStore(store);
        return { acknowledged: true };
      },
      async listByOfficeType(officeType) {
        return readStore().officeAccounts.filter((item) => item.officeType === officeType);
      },
    },
    sessions: {
      async createSession(session) {
        const store = readStore();
        store.sessions.push(session);
        writeStore(store);
        return { acknowledged: true };
      },
      async findByTokenHash(tokenHash) {
        return readStore().sessions.find((session) => session.tokenHash === tokenHash && session.revokedAt === null) || null;
      },
      async revokeSession(tokenHash) {
        const store = readStore();
        const session = store.sessions.find((item) => item.tokenHash === tokenHash && item.revokedAt === null);
        if (session) session.revokedAt = new Date().toISOString();
        writeStore(store);
        return { acknowledged: true };
      },
    },
    assignmentCounters: {
      async advanceCounter(bucketKey) {
        const store = readStore();
        let counter = store.assignmentCounters.find((item) => item.bucketKey === bucketKey);
        if (!counter) {
          counter = { bucketKey, sequence: 0, createdAt: new Date().toISOString() };
          store.assignmentCounters.push(counter);
          writeStore(store);
          return 0;
        }

        const previous = counter.sequence;
        counter.sequence += 1;
        writeStore(store);
        return previous;
      },
    },
    comments: {
      async addComment(comment) {
        const store = readStore();
        const insertedId = makeId("comment");
        store.complaintComments.push({ _id: insertedId, ...comment });
        writeStore(store);
        return { insertedId };
      },
      async listByComplaintToken(complaintToken) {
        return readStore().complaintComments
          .filter((comment) => comment.complaintToken === complaintToken)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },
    },
    complaints: {
      async listAll() {
        return readStore().complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      async findByTokenNumber(tokenNumber) {
        return readStore().complaints.find((item) => item.tokenNumber === tokenNumber) || null;
      },
      async findByCitizenId(citizenId) {
        return readStore().complaints
          .filter((item) => item.citizenId === citizenId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      async findAssignedToOfficer(assignedOfficerId) {
        return readStore().complaints
          .filter((item) => item.assignedOfficerId === assignedOfficerId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      async createComplaint(payload) {
        const store = readStore();
        const insertedId = makeId("complaint");
        store.complaints.push({ _id: insertedId, ...payload });
        writeStore(store);
        return { insertedId };
      },
      async updateComplaint(tokenNumber, patch) {
        const store = readStore();
        const complaint = store.complaints.find((item) => item.tokenNumber === tokenNumber);
        if (complaint) {
          Object.assign(complaint, patch, { updatedAt: new Date().toISOString() });
        }
        writeStore(store);
        return { acknowledged: true };
      },
      async addCommentPointer(tokenNumber, commentSummary) {
        const store = readStore();
        const complaint = store.complaints.find((item) => item.tokenNumber === tokenNumber);
        if (complaint) {
          complaint.latestComments = [...(complaint.latestComments || []), commentSummary].slice(-5);
          complaint.updatedAt = new Date().toISOString();
        }
        writeStore(store);
        return { acknowledged: true };
      },
      async logStatusHistory(entry) {
        const store = readStore();
        const insertedId = makeId("history");
        store.complaintStatusHistory.push({ _id: insertedId, ...entry });
        writeStore(store);
        return { insertedId };
      },
      async listStatusHistory(tokenNumber) {
        return readStore().complaintStatusHistory
          .filter((entry) => entry.complaintToken === tokenNumber)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },
    },
    departments: {},
    wards: {},
    admin: {
      async logAdminAction(payload) {
        const store = readStore();
        const insertedId = makeId("adminlog");
        store.adminLogs.push({ _id: insertedId, ...payload });
        writeStore(store);
        return { insertedId };
      },
    },
  };
}
