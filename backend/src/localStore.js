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

// 10 Mahasakhas (top-level divisions)
const seededDepartments = [
  {
    code: "ADMIN",
    name: "Administration",
    type: "Mahashakha",
    wards: [],
    subDepartments: ["Admin Section", "Inspection (Security)", "Fire & Emergency"],
    active: true,
    description: "General administration, human resources, and public services"
  },
  {
    code: "FIN",
    name: "Finance & Revenue",
    type: "Mahashakha",
    wards: [],
    subDepartments: ["Internal Audit", "Procurement", "Revenue/Tax Units"],
    active: true,
    description: "Tax collection, procurement, audit, and revenue management"
  },
  {
    code: "INFRA",
    name: "Infrastructure Development",
    type: "Mahashakha",
    wards: Array.from({ length: 33 }, (_, i) => String(i + 1)),
    subDepartments: ["Road Section", "Bridge Section", "Water & Sewer", "Buildings"],
    active: true,
    description: "Roads, bridges, drainage, water supply and sewerage"
  },
  {
    code: "URBAN",
    name: "Urban Dev & Environment",
    type: "Mahashakha",
    wards: Array.from({ length: 33 }, (_, i) => String(i + 1)),
    subDepartments: ["Tourism", "Sanitation/Waste", "Greenery Units"],
    active: true,
    description: "Urban planning, sanitation, waste management, and greenery"
  },
  {
    code: "PLANIT",
    name: "Planning, Monitoring & IT",
    type: "Mahashakha",
    wards: [],
    subDepartments: ["IT Section", "Data & Statistics", "Documentation"],
    active: true,
    description: "City planning, project monitoring, GIS and digital systems"
  },
  {
    code: "SOCIAL",
    name: "Social Development",
    type: "Mahashakha",
    wards: Array.from({ length: 33 }, (_, i) => String(i + 1)),
    subDepartments: ["Women/Child Program", "Social Security", "Community Development"],
    active: true,
    description: "Women, children, elderly, disability services, and social welfare"
  },
  {
    code: "HEALTH",
    name: "Health",
    type: "Mahashakha",
    wards: Array.from({ length: 33 }, (_, i) => String(i + 1)),
    subDepartments: ["Health Services / Health Center Coordination"],
    active: true,
    description: "Public health, hospitals, clinics, and health centers"
  },
  {
    code: "EDU",
    name: "Education",
    type: "Mahashakha",
    wards: Array.from({ length: 33 }, (_, i) => String(i + 1)),
    subDepartments: ["School Management / Education Programs"],
    active: true,
    description: "Schools, teachers, scholarships, and education programs"
  },
  {
    code: "ECON",
    name: "Economic Development",
    type: "Mahashakha",
    wards: Array.from({ length: 33 }, (_, i) => String(i + 1)),
    subDepartments: ["Business Promotion", "Employment", "Agri & Livestock"],
    active: true,
    description: "Agriculture, livestock, tourism, employment and business support"
  },
  {
    code: "LEGAL",
    name: "Legal",
    type: "Mahashakha",
    wards: [],
    subDepartments: ["Legal Advice / Dispute Management"],
    active: true,
    description: "Legal advice, dispute resolution, and regulatory compliance"
  },
].map((department) => ({
  ...department,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

// 25 Ranak Sakhas (sub-units under Mahasakhas)
const seededSubDepartments = [
  // Administration (ADMIN)
  { code: "ADMIN-GENERAL",    name: "General Administration Section",        type: "Ranak Sakha", parentCode: "ADMIN", wards: [], active: true, description: "Personnel, office management, and public correspondences" },
  { code: "ADMIN-SECURITY",   name: "Inspection (Security)",                 type: "Ranak Sakha", parentCode: "ADMIN", wards: [], active: true, description: "Municipal inspection, streetlight oversight, and public safety" },
  // Finance & Revenue (FIN)
  { code: "FIN-REVENUE",      name: "Revenue/Tax Units",                     type: "Ranak Sakha", parentCode: "FIN",   wards: [], active: true, description: "Property tax, business tax, and revenue collection" },
  { code: "FIN-PROCUREMENT",  name: "Procurement & Audit",                   type: "Ranak Sakha", parentCode: "FIN",   wards: [], active: true, description: "Public procurement, accounts, and internal audit" },
  // Infrastructure Development (INFRA)
  { code: "INFRA-ROAD",       name: "Road Section",                          type: "Ranak Sakha", parentCode: "INFRA", wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Roads, bridges, footpaths and blacktop maintenance" },
  { code: "INFRA-WATER",      name: "Water & Sewer",                         type: "Ranak Sakha", parentCode: "INFRA", wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Drinking water supply, drainage pipes, and sewerage management" },
  { code: "INFRA-BUILDING",   name: "Building & Construction",               type: "Ranak Sakha", parentCode: "INFRA", wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Public infrastructure construction and building permits" },
  // Urban Dev & Environment (URBAN)
  { code: "URBAN-SANITATION", name: "Sanitation/Waste",                      type: "Ranak Sakha", parentCode: "URBAN", wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Garbage collection, waste disposal, and sanitation" },
  { code: "URBAN-GREENERY",   name: "Greenery Units",                        type: "Ranak Sakha", parentCode: "URBAN", wards: [], active: true, description: "Parks, urban forestry, lake beautification and greenery" },
  { code: "URBAN-PLANNING",   name: "Urban Planning Section",                type: "Ranak Sakha", parentCode: "URBAN", wards: [], active: true, description: "Land use planning, zoning, and settlement management" },
  // Planning, Monitoring & IT (PLANIT)
  { code: "PLANIT-MONITOR",   name: "Project Monitoring Section",            type: "Ranak Sakha", parentCode: "PLANIT", wards: [], active: true, description: "Monitoring and evaluation of municipal projects" },
  { code: "PLANIT-GIS",       name: "GIS & Digital Services",               type: "Ranak Sakha", parentCode: "PLANIT", wards: [], active: true, description: "Geographic information systems, e-governance, and IT support" },
  // Social Development (SOCIAL)
  { code: "SOCIAL-WOMEN",     name: "Women & Children Services",             type: "Ranak Sakha", parentCode: "SOCIAL", wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Women's rights, child welfare, and social protection" },
  { code: "SOCIAL-ELDERLY",   name: "Senior Citizen & Disability Services",  type: "Ranak Sakha", parentCode: "SOCIAL", wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Senior citizen support, disability assistance, and social allowances" },
  // Health (HEALTH)
  { code: "HEALTH-SERVICES",  name: "Health Services / Health Center Coordination", type: "Ranak Sakha", parentCode: "HEALTH", wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Primary healthcare, health posts, and hospital coordination" },
  { code: "HEALTH-SANITATION",name: "Environmental Health Section",          type: "Ranak Sakha", parentCode: "HEALTH", wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Food safety, environmental health inspections, and epidemic control" },
  { code: "HEALTH-EMERGENCY", name: "Emergency Health Services",             type: "Ranak Sakha", parentCode: "HEALTH", wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Ambulance services, emergency response, and disaster health" },
  // Education (EDU)
  { code: "EDU-SCHOOLS",      name: "School Management / Education Programs", type: "Ranak Sakha", parentCode: "EDU",   wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "School management, teacher support, and education grants" },
  { code: "EDU-LITERACY",     name: "Literacy & Informal Education",          type: "Ranak Sakha", parentCode: "EDU",   wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Adult literacy programs and non-formal education" },
  // Economic Development (ECON)
  { code: "ECON-AGRI",        name: "Agriculture & Livestock",               type: "Ranak Sakha", parentCode: "ECON",  wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Farming, irrigation, livestock support, and agri-services" },
  { code: "ECON-TOURISM",     name: "Tourism & Heritage",                    type: "Ranak Sakha", parentCode: "ECON",  wards: [], active: true, description: "Tourism promotion, heritage conservation, and cultural sites" },
  { code: "ECON-EMPLOYMENT",  name: "Employment",                            type: "Ranak Sakha", parentCode: "ECON",  wards: [], active: true, description: "Skill development, employment, and business facilitation" },
  // Legal (LEGAL)
  { code: "LEGAL-ADVICE",     name: "Legal Advice / Dispute Management",     type: "Ranak Sakha", parentCode: "LEGAL", wards: [], active: true, description: "Legal counseling, mediation, and municipal legal disputes" },
  { code: "LEGAL-COMPLIANCE", name: "Regulatory Compliance",                 type: "Ranak Sakha", parentCode: "LEGAL", wards: [], active: true, description: "Bylaw enforcement, encroachment removal, and compliance" },
  // Ward Admin (special catch-all for ward-level complaints, one per ward)
  { code: "WARD-ADMIN",       name: "Ward Office Administration",            type: "Ranak Sakha", parentCode: "ADMIN", wards: Array.from({ length: 33 }, (_, i) => String(i + 1)), active: true, description: "Ward-level administrative services, local complaints, and citizen records" },
].map((department) => ({
  ...department,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

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
    {
      _id: "office-health-demo",
      officeType: "department",
      role: "department",
      name: "Health Services Officer",
      loginId: "health_admin_demo_2026",
      passwordHash: crypto.createHash("sha256").update("healthpass123").digest("hex"),
      divisionName: "Health",
      sectionName: "Health Services / Health Center Coordination",
      wardNumber: "",
      status: "active",
      assignmentWeeks: [currentWeekKey()],
      performanceAdjustments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "office-edu-demo",
      officeType: "department",
      role: "department",
      name: "Education Programs Officer",
      loginId: "edu_admin_demo_2026",
      passwordHash: crypto.createHash("sha256").update("edupass123").digest("hex"),
      divisionName: "Education",
      sectionName: "School Management / Education Programs",
      wardNumber: "",
      status: "active",
      assignmentWeeks: [currentWeekKey()],
      performanceAdjustments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "office-ward-1-demo",
      officeType: "ward",
      role: "ward",
      name: "Ward One Admin",
      loginId: "ward1_demo_2026",
      passwordHash: crypto.createHash("sha256").update("ward1pass123").digest("hex"),
      divisionName: "",
      sectionName: "",
      wardNumber: "1",
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
  departments: [...seededDepartments, ...seededSubDepartments],
  rotations: [],
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
  const parsed = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const merged = {
    ...defaultStore,
    ...parsed,
  };

  if (!Array.isArray(merged.departments) || !merged.departments.length) {
    merged.departments = seededDepartments;
  }

  merged.departments = (merged.departments || []).map((department) => {
    const seeded = seededDepartments.find((item) => item.code === department.code);
    return {
      ...seeded,
      ...department,
      subDepartments: Array.isArray(department.subDepartments) && department.subDepartments.length
        ? department.subDepartments
        : (seeded?.subDepartments || []),
    };
  });

  if (!Array.isArray(merged.rotations)) {
    merged.rotations = [];
  }

  ensureDemoData(merged);

  return merged;
}

function ensureDemoData(store) {
  store.users = store.users || [];
  store.officeAccounts = store.officeAccounts || [];
  store.complaints = store.complaints || [];
  store.rotations = store.rotations || [];
  store.complaintComments = store.complaintComments || [];
  store.complaintStatusHistory = store.complaintStatusHistory || [];

  const now = new Date();
  const currentWeek = currentWeekKey();
  const officerPasswordHash = crypto.createHash("sha256").update("Officer@123").digest("hex");
  const citizenPasswordHash = crypto.createHash("sha256").update("Citizen@123").digest("hex");
  const activationStartAt = new Date(now.getTime() - 24 * 3600000).toISOString();
  const activationExpiresAt = new Date(now.getTime() + 6 * 24 * 3600000).toISOString();
  const rotationStartDate = new Date(now.getTime() - 24 * 3600000).toISOString().slice(0, 10);
  const rotationEndDate = new Date(now.getTime() + 5 * 24 * 3600000).toISOString().slice(0, 10);

  const legacyOfficerLogins = new Set([
    "road_admin_demo_2026",
    "ward17_demo_2026",
    "health_admin_demo_2026",
    "edu_admin_demo_2026",
    "ward1_demo_2026",
    "2222",
  ]);
  const legacyOfficerIds = new Set([
    "office-road-admin-demo",
    "office-ward-17-demo",
    "office-health-demo",
    "office-edu-demo",
    "office-ward-1-demo",
  ]);
  const legacyComplaintTokens = new Set(["PMC-2026-990101", "PMC-2026-990102", "PMC-2026-990103"]);

  store.officeAccounts = store.officeAccounts.filter(
    (officer) => !legacyOfficerIds.has(String(officer._id || "")) && !legacyOfficerLogins.has(String(officer.loginId || "")),
  );
  store.complaints = store.complaints.filter(
    (complaint) => !legacyComplaintTokens.has(String(complaint.tokenNumber || "")) && !String(complaint._id || "").startsWith("complaint-demo-"),
  );
  store.complaintComments = store.complaintComments.filter(
    (comment) => !legacyComplaintTokens.has(String(comment.complaintToken || "")),
  );
  store.complaintStatusHistory = store.complaintStatusHistory.filter(
    (entry) => !legacyComplaintTokens.has(String(entry.complaintToken || "")),
  );

  const seededCitizens = [
    {
      _id: "seed-citizen-anjana",
      name: "Anjana Karki",
      email: "anjana.karki@pnpp.demo",
      mobileNumber: "9811100001",
      citizenCode: "CIT-8401",
      passwordHash: citizenPasswordHash,
      role: "citizen",
      rewardPoints: 40,
      isAnonymousRegistered: false,
      seededDemo: true,
      createdAt: new Date(now.getTime() - 20 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
    },
    {
      _id: "seed-citizen-bikash",
      name: "Bikash Gurung",
      email: "bikash.gurung@pnpp.demo",
      mobileNumber: "9811100002",
      citizenCode: "CIT-8402",
      passwordHash: citizenPasswordHash,
      role: "citizen",
      rewardPoints: 0,
      isAnonymousRegistered: false,
      seededDemo: true,
      createdAt: new Date(now.getTime() - 18 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now.getTime() - 12 * 3600000).toISOString(),
    },
    {
      _id: "seed-citizen-manisha",
      name: "Manisha Shrestha",
      email: "manisha.shrestha@pnpp.demo",
      mobileNumber: "9811100003",
      citizenCode: "CIT-8403",
      passwordHash: citizenPasswordHash,
      role: "citizen",
      rewardPoints: 20,
      isAnonymousRegistered: false,
      seededDemo: true,
      createdAt: new Date(now.getTime() - 15 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 3600000).toISOString(),
    },
    {
      _id: "seed-citizen-prabin",
      name: "Prabin Thapa",
      email: "prabin.thapa@pnpp.demo",
      mobileNumber: "9811100004",
      citizenCode: "CIT-8404",
      passwordHash: citizenPasswordHash,
      role: "citizen",
      rewardPoints: 0,
      isAnonymousRegistered: false,
      seededDemo: true,
      createdAt: new Date(now.getTime() - 12 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 3600000).toISOString(),
    },
    {
      _id: "seed-citizen-nirmala",
      name: "Nirmala Rana",
      email: "nirmala.rana@pnpp.demo",
      mobileNumber: "9811100005",
      citizenCode: "CIT-8405",
      passwordHash: citizenPasswordHash,
      role: "citizen",
      rewardPoints: 0,
      isAnonymousRegistered: false,
      seededDemo: true,
      createdAt: new Date(now.getTime() - 10 * 24 * 3600000).toISOString(),
      updatedAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
    },
  ];

  seededCitizens.forEach((seededUser) => {
    const existingUser = store.users.find(
      (user) =>
        String(user._id || "") === seededUser._id
        || String(user.email || "").toLowerCase() === seededUser.email.toLowerCase()
        || String(user.citizenCode || "").toUpperCase() === seededUser.citizenCode,
    );
    if (existingUser) {
      Object.assign(existingUser, seededUser, {
        rewardPoints: Number(existingUser.rewardPoints ?? seededUser.rewardPoints ?? 0),
        updatedAt: existingUser.updatedAt || seededUser.updatedAt,
      });
    } else {
      store.users.push({ ...seededUser });
    }
  });

  const seededOfficers = [
    ["seed-office-admin-section-01", "admin_section_01", "Saraswati Adhikari", "ADMIN", "Administration", "Admin Section", "sadhikari@pokharamun.gov.np"],
    ["seed-office-admin-section-02", "admin_section_02", "Nabin Khatri", "ADMIN", "Administration", "Admin Section", "nkhatri@pokharamun.gov.np"],
    ["seed-office-inspection-01", "inspection_officer_01", "Bishal Pariyar", "ADMIN", "Administration", "Inspection (Security)", "bpariyar@pokharamun.gov.np"],
    ["seed-office-inspection-02", "inspection_officer_02", "Rekha KC", "ADMIN", "Administration", "Inspection (Security)", "rkc@pokharamun.gov.np"],
    ["seed-office-finance-01", "revenue_officer_01", "Pramod Bhusal", "FIN", "Finance & Revenue", "Revenue/Tax Units", "pbhusal@pokharamun.gov.np"],
    ["seed-office-finance-02", "revenue_officer_02", "Laxmi Poudel", "FIN", "Finance & Revenue", "Revenue/Tax Units", "lpoudel@pokharamun.gov.np"],
    ["seed-office-road-01", "road_section_01", "Deepak Gurung", "INFRA", "Infrastructure Development", "Road Section", "dgurung@pokharamun.gov.np"],
    ["seed-office-road-02", "road_section_02", "Manoj Thapa", "INFRA", "Infrastructure Development", "Road Section", "mthapa@pokharamun.gov.np"],
    ["seed-office-water-01", "water_sewer_01", "Binod Sharma", "INFRA", "Infrastructure Development", "Water & Sewer", "bsharma@pokharamun.gov.np"],
    ["seed-office-water-02", "water_sewer_02", "Kritika Bista", "INFRA", "Infrastructure Development", "Water & Sewer", "kbista@pokharamun.gov.np"],
    ["seed-office-sanitation-01", "sanitation_01", "Suman BK", "URBAN", "Urban Dev & Environment", "Sanitation/Waste", "sbk@pokharamun.gov.np"],
    ["seed-office-sanitation-02", "sanitation_02", "Gita Gurung", "URBAN", "Urban Dev & Environment", "Sanitation/Waste", "ggurung@pokharamun.gov.np"],
    ["seed-office-health-01", "health_services_01", "Anusha KC", "HEALTH", "Health", "Health Services / Health Center Coordination", "akc@pokharamun.gov.np"],
    ["seed-office-health-02", "health_services_02", "Ramesh Poudel", "HEALTH", "Health", "Health Services / Health Center Coordination", "rpoudel@pokharamun.gov.np"],
    ["seed-office-education-01", "education_programs_01", "Milan Adhikari", "EDU", "Education", "School Management / Education Programs", "madhikari@pokharamun.gov.np"],
    ["seed-office-education-02", "education_programs_02", "Sushmita Rana", "EDU", "Education", "School Management / Education Programs", "srana@pokharamun.gov.np"],
    ["seed-office-employment-01", "employment_01", "Rajan Karki", "ECON", "Economic Development", "Employment", "rkarki@pokharamun.gov.np"],
    ["seed-office-employment-02", "employment_02", "Sabina Lama", "ECON", "Economic Development", "Employment", "slama@pokharamun.gov.np"],
    ["seed-office-legal-01", "legal_advice_01", "Aayush Shah", "LEGAL", "Legal", "Legal Advice / Dispute Management", "ashah@pokharamun.gov.np"],
    ["seed-office-legal-02", "legal_advice_02", "Nisha Bhandari", "LEGAL", "Legal", "Legal Advice / Dispute Management", "nbhandari@pokharamun.gov.np"],
  ].map(([id, loginId, name, departmentCode, divisionName, sectionName, email]) => ({
    _id: id,
    officeType: "department",
    role: "department",
    departmentCode,
    divisionName,
    sectionName,
    wardNumber: "",
    name,
    email,
    phone: "",
    loginId,
    passwordHash: officerPasswordHash,
    status: "active",
    assignmentWeeks: [currentWeek],
    activationStartAt,
    activationExpiresAt,
    performanceAdjustments: [],
    currentWeekPoints: 0,
    allTimePoints: 0,
    seededDemo: true,
    createdAt: new Date(now.getTime() - 14 * 24 * 3600000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
  }));

  seededOfficers.forEach((seededOfficer) => {
    const existingOfficer = store.officeAccounts.find(
      (officer) => String(officer._id || "") === seededOfficer._id || String(officer.loginId || "") === seededOfficer.loginId,
    );
    if (existingOfficer) {
      Object.assign(existingOfficer, seededOfficer, {
        performanceAdjustments: existingOfficer.performanceAdjustments || seededOfficer.performanceAdjustments,
        currentWeekPoints: Number(existingOfficer.currentWeekPoints ?? seededOfficer.currentWeekPoints ?? 0),
        allTimePoints: Number(existingOfficer.allTimePoints ?? seededOfficer.allTimePoints ?? 0),
      });
    } else {
      store.officeAccounts.push({ ...seededOfficer });
    }
  });

  const officerByLoginId = new Map(store.officeAccounts.map((officer) => [String(officer.loginId || ""), officer]));
  const citizenById = new Map(store.users.map((user) => [String(user._id || ""), user]));
  const hoursAgo = (value) => new Date(now.getTime() - value * 3600000).toISOString();
  const daysAgo = (value) => new Date(now.getTime() - value * 24 * 3600000).toISOString();

  const makeComment = (actorName, actorRole, message, createdAt) => ({
    actorName,
    actorRole,
    message,
    visibility: "public",
    createdAt,
  });

  const makeHistory = (action, officerName, officerRole, timestamp, note) => ({
    action,
    officerName,
    officerRole,
    timestamp,
    note,
  });

  const buildComplaint = ({
    id,
    tokenNumber,
    citizenId = "",
    anonymous = false,
    anonymousTrackingToken = "",
    title,
    category,
    subcategory,
    description,
    wardNumber,
    locationText,
    areaName = "",
    nearestLandmark = "",
    locationCoordinates = null,
    priority = "medium",
    status = "pending",
    officeType = "department",
    divisionName = "",
    sectionName = "",
    assignedOfficerLoginId = "",
    assignedOfficerName = "",
    assignmentReason = "",
    forwardedTo = "",
    forwardedToLabel = "",
    escalated = false,
    delayReason = "",
    estimatedCompletionAt = null,
    slaDueAt,
    firstResponseAt = null,
    acceptedAt = null,
    acceptedByOfficerId = "",
    createdAt,
    updatedAt,
    closureConfirmedAt = null,
    citizenRating = 0,
    pointsAwarded = 0,
    validityVerified = false,
    officerActionReview = null,
    comments = [],
    history = [],
  }) => {
    const citizen = citizenById.get(citizenId) || null;
    const officer = assignedOfficerLoginId ? officerByLoginId.get(assignedOfficerLoginId) : null;
    const currentOfficerName = assignedOfficerName || officer?.name || (officeType === "central_admin" ? "Central Admin" : "");
    const assignedDepartment = officeType === "central_admin"
      ? "Central Admin"
      : officeType === "ward"
        ? `Ward ${wardNumber}`
        : divisionName;
    const assignedOfficeLabel = officeType === "central_admin"
      ? "Central Admin"
      : officeType === "ward"
        ? `Ward ${wardNumber}`
        : `${divisionName} / ${sectionName}`;

    return {
      _id: id,
      tokenNumber,
      citizenId: anonymous ? "" : citizenId,
      citizenMobileNumber: anonymous ? "" : (citizen?.mobileNumber || ""),
      title,
      category,
      subcategory,
      description,
      locationText,
      locationCoordinates,
      areaName,
      nearestLandmark,
      wardNumber: String(wardNumber || ""),
      priority,
      status,
      officeType,
      divisionName,
      sectionName,
      routeBucket: officeType === "central_admin" ? "central-admin" : officeType === "ward" ? `ward:${wardNumber}` : `department:${divisionName}:${sectionName}`,
      assignmentReason,
      assignedOfficerId: officer ? String(officer._id) : "",
      assignedOfficerName: currentOfficerName,
      assignedDepartment,
      assignedOfficeLabel,
      forwardedTo,
      forwardedToLabel,
      escalated,
      delayReason,
      anonymous,
      anonymousTrackingToken,
      contactOptIn: !anonymous,
      contactName: anonymous ? "" : (citizen?.name || ""),
      contactPhone: anonymous ? "" : (citizen?.mobileNumber || ""),
      contactEmail: anonymous ? "" : (citizen?.email || ""),
      estimatedCompletionAt,
      slaDueAt,
      firstResponseAt,
      acceptedAt,
      acceptedByOfficerId: acceptedByOfficerId || (acceptedAt && officer ? String(officer._id) : ""),
      createdAt,
      updatedAt,
      latestComments: comments.slice(-3),
      comments,
      history,
      citizenRating,
      closureConfirmedAt,
      pointsAwarded,
      validityVerified,
      officerActionReview,
      attachments: [],
      proofImage: null,
      seededDemo: true,
    };
  };

  const seededComplaints = [
    buildComplaint({
      id: "seed-complaint-road-pending",
      tokenNumber: "PMC-2026-910101",
      citizenId: "seed-citizen-anjana",
      title: "Potholes expanding on Lakeside feeder road",
      category: "road",
      subcategory: "Road maintenance",
      description: "Fresh potholes are widening near the tourist bus stop and small vehicles are swerving into pedestrians.",
      wardNumber: "6",
      locationText: "Lakeside feeder road, bus stop curve",
      locationCoordinates: { latitude: 28.20931, longitude: 83.95942 },
      nearestLandmark: "Tourist bus park",
      priority: "high",
      status: "pending",
      divisionName: "Infrastructure Development",
      sectionName: "Road Section",
      assignedOfficerLoginId: "road_section_01",
      assignmentReason: "Automatically routed to Infrastructure Development / Road Section.",
      slaDueAt: hoursAgo(-6),
      createdAt: hoursAgo(18),
      updatedAt: hoursAgo(18),
      comments: [],
      history: [
        makeHistory("submitted", "Anjana Karki", "citizen", hoursAgo(18), "Complaint registered by citizen."),
      ],
    }),
    buildComplaint({
      id: "seed-complaint-water-progress",
      tokenNumber: "PMC-2026-910102",
      citizenId: "seed-citizen-bikash",
      title: "Drainage overflow in ward 8 market lane",
      category: "drainage",
      subcategory: "Drainage blockage",
      description: "Wastewater is flowing over the lane every evening and entering nearby shops.",
      wardNumber: "8",
      locationText: "Ward 8 market lane",
      locationCoordinates: { latitude: 28.21518, longitude: 83.9856 },
      priority: "medium",
      status: "in_progress",
      divisionName: "Infrastructure Development",
      sectionName: "Water & Sewer",
      assignedOfficerLoginId: "water_sewer_01",
      assignmentReason: "Automatically routed to Infrastructure Development / Water & Sewer.",
      estimatedCompletionAt: hoursAgo(-30),
      slaDueAt: hoursAgo(6),
      firstResponseAt: hoursAgo(20),
      acceptedAt: hoursAgo(19),
      createdAt: hoursAgo(30),
      updatedAt: hoursAgo(4),
      comments: [
        makeComment("Binod Sharma", "department", "Field inspection completed. Jetting team scheduled for tonight.", hoursAgo(4)),
      ],
      history: [
        makeHistory("submitted", "Bikash Gurung", "citizen", hoursAgo(30), "Complaint registered by citizen."),
        makeHistory("accepted", "Binod Sharma", "department", hoursAgo(19), "Complaint accepted for execution."),
        makeHistory("comment", "Binod Sharma", "department", hoursAgo(4), "Field inspection completed. Jetting team scheduled for tonight."),
      ],
    }),
    buildComplaint({
      id: "seed-complaint-sanitation-delayed",
      tokenNumber: "PMC-2026-910103",
      citizenId: "seed-citizen-manisha",
      title: "Missed garbage pickup in dense settlement",
      category: "garbage",
      subcategory: "Missed collection",
      description: "Garbage has piled up for three collection cycles and stray dogs are tearing the bags open.",
      wardNumber: "11",
      locationText: "Amarsingh chowk inner settlement",
      priority: "medium",
      status: "delayed",
      divisionName: "Urban Dev & Environment",
      sectionName: "Sanitation/Waste",
      assignedOfficerLoginId: "sanitation_01",
      assignmentReason: "Automatically routed to Urban Dev & Environment / Sanitation/Waste.",
      delayReason: "Collection vehicle is under repair and the route has been shifted to a backup team.",
      estimatedCompletionAt: hoursAgo(-14),
      slaDueAt: hoursAgo(36),
      firstResponseAt: hoursAgo(44),
      acceptedAt: hoursAgo(42),
      createdAt: hoursAgo(48),
      updatedAt: hoursAgo(3),
      comments: [
        makeComment("Suman BK", "department", "Backup compactor has been assigned. Clearance expected tomorrow morning.", hoursAgo(3)),
      ],
      history: [
        makeHistory("submitted", "Manisha Shrestha", "citizen", hoursAgo(48), "Complaint registered by citizen."),
        makeHistory("accepted", "Suman BK", "department", hoursAgo(42), "Complaint accepted for sanitation dispatch."),
        makeHistory("delayed", "Suman BK", "department", hoursAgo(3), "Collection delayed because the assigned vehicle is under maintenance."),
      ],
    }),
    buildComplaint({
      id: "seed-complaint-health-solved",
      tokenNumber: "PMC-2026-910104",
      citizenId: "seed-citizen-anjana",
      title: "Health post closed during service hours",
      category: "health",
      subcategory: "Service availability",
      description: "The ward health post remained closed for two consecutive afternoons despite posted service hours.",
      wardNumber: "4",
      locationText: "Ward 4 health post compound",
      priority: "medium",
      status: "solved",
      divisionName: "Health",
      sectionName: "Health Services / Health Center Coordination",
      assignedOfficerLoginId: "health_services_01",
      assignmentReason: "Automatically routed to Health / Health Services / Health Center Coordination.",
      estimatedCompletionAt: daysAgo(2),
      slaDueAt: daysAgo(5),
      firstResponseAt: daysAgo(5),
      acceptedAt: daysAgo(4),
      createdAt: daysAgo(6),
      updatedAt: daysAgo(1),
      closureConfirmedAt: hoursAgo(20),
      citizenRating: 5,
      pointsAwarded: 40,
      validityVerified: true,
      comments: [
        makeComment("Anusha KC", "department", "Attendance roster corrected and replacement staff assigned for afternoon duty.", daysAgo(1)),
      ],
      history: [
        makeHistory("submitted", "Anjana Karki", "citizen", daysAgo(6), "Complaint registered by citizen."),
        makeHistory("accepted", "Anusha KC", "department", daysAgo(4), "Complaint accepted and checked with the health post in-charge."),
        makeHistory("solved", "Anusha KC", "department", daysAgo(1), "Attendance roster corrected and service restored."),
      ],
    }),
    buildComplaint({
      id: "seed-complaint-education-forwarded",
      tokenNumber: "PMC-2026-910105",
      citizenId: "seed-citizen-prabin",
      title: "School scholarship form stuck between desks",
      category: "education",
      subcategory: "Scholarship paperwork",
      description: "The school says the scholarship papers were sent to municipality, but there has been no update for three weeks.",
      wardNumber: "9",
      locationText: "Ward 9 secondary school office",
      priority: "low",
      status: "forwarded",
      divisionName: "Administration",
      sectionName: "Admin Section",
      assignedOfficerLoginId: "admin_section_01",
      assignmentReason: "Transferred from Education for paperwork verification.",
      forwardedTo: "Transferred by Education section for administrative paperwork verification.",
      forwardedToLabel: "Forwarded to Administration / Admin Section",
      estimatedCompletionAt: hoursAgo(-18),
      slaDueAt: hoursAgo(22),
      firstResponseAt: hoursAgo(20),
      acceptedAt: hoursAgo(18),
      createdAt: hoursAgo(28),
      updatedAt: hoursAgo(2),
      comments: [
        makeComment("Saraswati Adhikari", "department", "Education desk forwarded the file log. Admin registry is tracing the physical submission entry.", hoursAgo(2)),
      ],
      history: [
        makeHistory("submitted", "Prabin Thapa", "citizen", hoursAgo(28), "Complaint registered by citizen."),
        makeHistory("forwarded", "Milan Adhikari", "department", hoursAgo(6), "Complaint forwarded to Administration / Admin Section for registry verification."),
      ],
    }),
    buildComplaint({
      id: "seed-complaint-revenue-pending",
      tokenNumber: "PMC-2026-910106",
      citizenId: "seed-citizen-nirmala",
      title: "Business tax receipt not reflected online",
      category: "tax",
      subcategory: "Revenue mismatch",
      description: "The payment was made at the counter but the online record still shows the business tax as unpaid.",
      wardNumber: "13",
      locationText: "New Road revenue counter",
      priority: "medium",
      status: "pending",
      divisionName: "Finance & Revenue",
      sectionName: "Revenue/Tax Units",
      assignedOfficerLoginId: "revenue_officer_01",
      assignmentReason: "Automatically routed to Finance & Revenue / Revenue/Tax Units.",
      slaDueAt: hoursAgo(-8),
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(8),
      comments: [],
      history: [
        makeHistory("submitted", "Nirmala Rana", "citizen", hoursAgo(8), "Complaint registered by citizen."),
      ],
    }),
    buildComplaint({
      id: "seed-complaint-employment-pending",
      tokenNumber: "PMC-2026-910107",
      citizenId: "seed-citizen-bikash",
      title: "Employment program callback never received",
      category: "job",
      subcategory: "Employment support",
      description: "Application was submitted for skill training but no acknowledgement has been sent from the municipality.",
      wardNumber: "15",
      locationText: "Employment facilitation desk",
      priority: "low",
      status: "pending",
      divisionName: "Economic Development",
      sectionName: "Employment",
      assignedOfficerLoginId: "employment_01",
      assignmentReason: "Automatically routed to Economic Development / Employment.",
      slaDueAt: hoursAgo(10),
      createdAt: hoursAgo(14),
      updatedAt: hoursAgo(14),
      comments: [],
      history: [
        makeHistory("submitted", "Bikash Gurung", "citizen", hoursAgo(14), "Complaint registered by citizen."),
      ],
    }),
    buildComplaint({
      id: "seed-complaint-legal-escalated",
      tokenNumber: "PMC-2026-910108",
      citizenId: "seed-citizen-manisha",
      title: "Encroachment dispute needs central decision",
      category: "legal",
      subcategory: "Footpath encroachment",
      description: "The local section reports that the issue requires joint legal and infrastructure direction before enforcement.",
      wardNumber: "10",
      locationText: "Chipledhunga frontage",
      priority: "high",
      status: "escalated",
      officeType: "central_admin",
      divisionName: "Legal",
      sectionName: "Legal Advice / Dispute Management",
      assignmentReason: "Escalated for central coordination and final decision.",
      forwardedTo: "Escalated to Central Admin",
      forwardedToLabel: "Escalated to Central Admin",
      escalated: true,
      slaDueAt: hoursAgo(52),
      firstResponseAt: hoursAgo(46),
      createdAt: hoursAgo(56),
      updatedAt: hoursAgo(1),
      comments: [
        makeComment("Aayush Shah", "department", "Requires coordinated order with enforcement and legal clearance from central admin.", hoursAgo(1)),
      ],
      history: [
        makeHistory("submitted", "Manisha Shrestha", "citizen", hoursAgo(56), "Complaint registered by citizen."),
        makeHistory("escalated", "Aayush Shah", "department", hoursAgo(1), "Escalated to central admin for final municipal direction."),
      ],
    }),
    buildComplaint({
      id: "seed-complaint-invalid-review",
      tokenNumber: "PMC-2026-910109",
      citizenId: "seed-citizen-prabin",
      title: "Streetlight outage reported with duplicate pole number",
      category: "light",
      subcategory: "Streetlight inspection",
      description: "Officer marked the report as likely duplicate because the same pole ID was already under repair.",
      wardNumber: "3",
      locationText: "Mahendrapool corridor",
      priority: "low",
      status: "pending_admin_verification",
      divisionName: "Administration",
      sectionName: "Inspection (Security)",
      assignedOfficerLoginId: "inspection_officer_01",
      assignmentReason: "Pending central verification of invalid marking.",
      slaDueAt: hoursAgo(20),
      firstResponseAt: hoursAgo(18),
      createdAt: hoursAgo(26),
      updatedAt: hoursAgo(2),
      comments: [
        makeComment("Bishal Pariyar", "department", "Pole already exists in the active repair register. Requesting admin verification before closure.", hoursAgo(2)),
      ],
      history: [
        makeHistory("submitted", "Prabin Thapa", "citizen", hoursAgo(26), "Complaint registered by citizen."),
        makeHistory("invalid_request", "Bishal Pariyar", "department", hoursAgo(2), "Marked invalid pending admin verification."),
      ],
    }),
    buildComplaint({
      id: "seed-complaint-road-review",
      tokenNumber: "PMC-2026-910110",
      citizenId: "seed-citizen-anjana",
      title: "Drain slab fixed after week-change review",
      category: "road",
      subcategory: "Roadside drainage slab",
      description: "Outgoing officer left the site unresolved; the incoming officer completed the work after review.",
      wardNumber: "7",
      locationText: "Ward 7 roadside drain crossing",
      priority: "medium",
      status: "solved",
      divisionName: "Infrastructure Development",
      sectionName: "Road Section",
      assignedOfficerLoginId: "road_section_02",
      assignmentReason: "Resolved after cross-week review by the next officer.",
      estimatedCompletionAt: daysAgo(1),
      slaDueAt: daysAgo(8),
      firstResponseAt: daysAgo(8),
      acceptedAt: daysAgo(7),
      createdAt: daysAgo(9),
      updatedAt: hoursAgo(12),
      closureConfirmedAt: hoursAgo(10),
      citizenRating: 4,
      pointsAwarded: 40,
      validityVerified: true,
      officerActionReview: {
        status: "pending",
        priorOfficerId: "seed-office-road-01",
        priorOfficerName: "Deepak Gurung",
        resolvingOfficerId: "seed-office-road-02",
        resolvingOfficerName: "Manoj Thapa",
        createdAt: hoursAgo(12),
        note: "Initial weekly assignee left the work open; the next officer completed the repair during handover review.",
      },
      comments: [
        makeComment("Manoj Thapa", "department", "Concrete slab replaced and roadside warning tape removed after curing.", hoursAgo(12)),
      ],
      history: [
        makeHistory("submitted", "Anjana Karki", "citizen", daysAgo(9), "Complaint registered by citizen."),
        makeHistory("forwarded", "Deepak Gurung", "department", daysAgo(8), "Marked outside immediate scope without site completion."),
        makeHistory("solved", "Manoj Thapa", "department", hoursAgo(12), "Resolved after the next weekly officer reviewed the site."),
      ],
    }),
    buildComplaint({
      id: "seed-complaint-anonymous-road",
      tokenNumber: "PMC-2026-910111",
      anonymous: true,
      anonymousTrackingToken: "ANON-910111",
      title: "Unsafe roadside edge near school walkway",
      category: "road",
      subcategory: "Safety barrier",
      description: "Anonymous citizen reported a missing protective edge near a student walking route.",
      wardNumber: "14",
      locationText: "Ward 14 school access road",
      priority: "high",
      status: "pending",
      divisionName: "Infrastructure Development",
      sectionName: "Road Section",
      assignedOfficerLoginId: "road_section_01",
      assignmentReason: "Automatically routed to Infrastructure Development / Road Section.",
      slaDueAt: hoursAgo(6),
      createdAt: hoursAgo(12),
      updatedAt: hoursAgo(12),
      comments: [],
      history: [
        makeHistory("submitted", "Anonymous", "citizen", hoursAgo(12), "Complaint registered anonymously."),
      ],
    }),
  ];

  seededComplaints.forEach((seededComplaint) => {
    const existingComplaint = store.complaints.find((complaint) => complaint.tokenNumber === seededComplaint.tokenNumber);
    if (existingComplaint) {
      existingComplaint.seededDemo = true;
      existingComplaint.locationCoordinates = existingComplaint.locationCoordinates || seededComplaint.locationCoordinates || null;
      existingComplaint.contactEmail = existingComplaint.contactEmail || seededComplaint.contactEmail || "";
      existingComplaint.attachments = existingComplaint.attachments || [];
      existingComplaint.comments = existingComplaint.comments || seededComplaint.comments || [];
      existingComplaint.history = existingComplaint.history || seededComplaint.history || [];
    } else {
      store.complaints.push(seededComplaint);
    }
  });

  seededComplaints.forEach((seededComplaint) => {
    if (!store.complaintComments.some((comment) => comment.complaintToken === seededComplaint.tokenNumber)) {
      seededComplaint.comments.forEach((comment, index) => {
        store.complaintComments.push({
          _id: `${seededComplaint._id}-comment-${index + 1}`,
          complaintToken: seededComplaint.tokenNumber,
          actorRole: comment.actorRole || "department",
          actorName: comment.actorName,
          actorId: "",
          visibility: comment.visibility || "public",
          message: comment.message,
          createdAt: comment.createdAt,
          seededDemo: true,
        });
      });
    }

    if (!store.complaintStatusHistory.some((entry) => entry.complaintToken === seededComplaint.tokenNumber)) {
      seededComplaint.history.forEach((entry, index) => {
        store.complaintStatusHistory.push({
          _id: `${seededComplaint._id}-history-${index + 1}`,
          complaintToken: seededComplaint.tokenNumber,
          actorRole: entry.officerRole || "system",
          actorName: entry.officerName,
          action: entry.action,
          message: entry.note,
          note: entry.note,
          createdAt: entry.timestamp,
          timestamp: entry.timestamp,
          seededDemo: true,
        });
      });
    }
  });

  seededOfficers.forEach((seededOfficer) => {
    if (!store.rotations.some((rotation) => String(rotation.officerId || "") === seededOfficer._id && (rotation.weekKeys || []).includes(currentWeek))) {
      store.rotations.push({
        _id: `seed-rotation-${seededOfficer._id}`,
        officerId: seededOfficer._id,
        officerName: seededOfficer.name,
        officeType: "department",
        departmentCode: seededOfficer.departmentCode,
        divisionName: seededOfficer.divisionName,
        sectionName: seededOfficer.sectionName,
        wardNumber: "",
        startDate: rotationStartDate,
        endDate: rotationEndDate,
        weekKeys: [currentWeek],
        active: true,
        createdBy: "system-seed",
        createdAt: activationStartAt,
        updatedAt: activationStartAt,
        seededDemo: true,
      });
    }
  });

  store.officeAccounts = store.officeAccounts.map((officer) => ({
    activationStartAt: officer.activationStartAt || new Date().toISOString(),
    activationExpiresAt: officer.activationExpiresAt || new Date(Date.now() + 6 * 24 * 3600000).toISOString(),
    performanceAdjustments: officer.performanceAdjustments || [],
    currentWeekPoints: Number(officer.currentWeekPoints || 0),
    allTimePoints: Number(officer.allTimePoints || 0),
    ...officer,
  }));
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
      async findByEmail(email) {
        return readStore().users.find((user) => user.email === email) || null;
      },
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
      async listAll() {
        return readStore().officeAccounts;
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
      async findByAnonymousTrackingToken(token) {
        return readStore().complaints.find((item) => item.anonymousTrackingToken === token) || null;
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
    departments: {
      async listDepartments() {
        return (readStore().departments || []).sort((a, b) => a.name.localeCompare(b.name));
      },
      async findByCode(code) {
        return (readStore().departments || []).find((item) => item.code === code) || null;
      },
      async createDepartment(payload) {
        const store = readStore();
        const insertedId = makeId("dept");
        store.departments = store.departments || [];
        store.departments.push({ _id: insertedId, ...payload });
        writeStore(store);
        return { insertedId };
      },
      async updateDepartment(code, patch) {
        const store = readStore();
        const department = (store.departments || []).find((item) => item.code === code);
        if (department) {
          Object.assign(department, patch, { updatedAt: new Date().toISOString() });
        }
        writeStore(store);
        return { acknowledged: true };
      },
      async deleteDepartment(code) {
        const store = readStore();
        store.departments = (store.departments || []).filter((item) => item.code !== code);
        writeStore(store);
        return { acknowledged: true };
      },
    },
    wards: {
      async listWards() {
        return Array.from({ length: 33 }, (_, index) => ({
          wardNumber: String(index + 1),
          chairperson: "",
          secretary: "",
          officeCode: `WARD-${index + 1}`,
        }));
      },
      async findByWardNumber(wardNumber) {
        return {
          wardNumber: String(wardNumber),
          chairperson: "",
          secretary: "",
          officeCode: `WARD-${wardNumber}`,
        };
      },
    },
    admin: {
      async logAdminAction(payload) {
        const store = readStore();
        const insertedId = makeId("adminlog");
        store.adminLogs.push({ _id: insertedId, ...payload });
        writeStore(store);
        return { insertedId };
      },
      async listRotations() {
        return (readStore().rotations || []).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      },
      async createRotation(payload) {
        const store = readStore();
        const insertedId = makeId("rotation");
        store.rotations = store.rotations || [];
        store.rotations.push({ _id: insertedId, ...payload });
        writeStore(store);
        return { insertedId };
      },
    },
  };
}
