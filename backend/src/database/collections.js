import { getDatabase } from "./client.js";

export const collectionNames = {
  users: "users",
  complaints: "complaints",
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
    complaints: getCollection(collectionNames.complaints),
    departments: getCollection(collectionNames.departments),
    wards: getCollection(collectionNames.wards),
    adminLogs: getCollection(collectionNames.adminLogs),
    complaintStatusHistory: getCollection(collectionNames.complaintStatusHistory),
  };
}
