import { getDatabase } from "./client.js";

export const collectionNames = {
  users: "users",
  officeAccounts: "office_accounts",
  sessions: "sessions",
  assignmentCounters: "assignment_counters",
  complaints: "complaints",
  complaintComments: "complaint_comments",
  departments: "departments",
  wards: "wards",
  adminLogs: "admin_logs",
  complaintStatusHistory: "complaint_status_history",
};

export function getCollection(name) {
  return getDatabase().collection(name);
}

export function getCollections() {
  return {
    users: getCollection(collectionNames.users),
    officeAccounts: getCollection(collectionNames.officeAccounts),
    sessions: getCollection(collectionNames.sessions),
    assignmentCounters: getCollection(collectionNames.assignmentCounters),
    complaints: getCollection(collectionNames.complaints),
    complaintComments: getCollection(collectionNames.complaintComments),
    departments: getCollection(collectionNames.departments),
    wards: getCollection(collectionNames.wards),
    adminLogs: getCollection(collectionNames.adminLogs),
    complaintStatusHistory: getCollection(collectionNames.complaintStatusHistory),
  };
}
