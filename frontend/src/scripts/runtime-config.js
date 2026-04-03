export const apiBase = globalThis?.window?.__PNPP_CONFIG__?.apiBaseUrl
  || "http://localhost:4000";

export const appRoutes = {
  home: "/",
  transparency: "/transparency",
  citizenLogin: "/citizen-login",
  register: "/register",
  submitComplaint: "/submit-complaint",
  track: "/track",
  citizen: "/citizen",
  citizenSections: {
    dashboard: "/citizen/dashboard",
    file: "/citizen/new-complaint",
    complaints: "/citizen/complaints",
    profile: "/citizen/profile",
  },
  departmentLogin: "/department-login",
  departmentPortal: "/department",
  departmentSections: {
    new: "/department/new",
    forwarded: "/department/forwarded",
    accepted: "/department/accepted",
    closed: "/department/closed",
    handover: "/department/handover",
    performance: "/department/performance",
  },
  adminLogin: "/admin-login",
  adminPanel: "/admin",
  adminSections: {
    dashboard: "/admin/dashboard",
    officers: "/admin/officers",
    oversight: "/admin/oversight",
    analytics: "/admin/analytics",
    departments: "/admin/departments",
  },
  adminOversightSections: {
    escalated: "/admin/oversight/escalated",
    invalid: "/admin/oversight/invalid",
    reviews: "/admin/oversight/reviews",
  },
  officeAdmin: "/add-department-admin",
  chatbot: "/chatbot",
};
