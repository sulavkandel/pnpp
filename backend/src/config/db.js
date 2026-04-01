export { connectDatabase as connectToDatabase, getDatabase, getMongoClient } from "../database/client.js";
export {
  collectionNames,
  getCollection,
  getCollections,
  getUserRepository,
  getComplaintRepository,
  getDepartmentRepository,
  getWardRepository,
  getAdminRepository,
} from "../database/index.js";
