import { collectionNames, getCollection } from "../collections.js";

export function getAdminRepository() {
  const adminLogs = getCollection(collectionNames.adminLogs);
  const complaints = getCollection(collectionNames.complaints);
  const rotations = getCollection(collectionNames.rotations);

  return {
    adminLogs,
    complaints,
    rotations,
    logAdminAction(payload) {
      return adminLogs.insertOne(payload);
    },
    getComplaintVolumeByDepartment() {
      return complaints
        .aggregate([
          { $group: { _id: "$currentDepartment", total: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ])
        .toArray();
    },
    getComplaintVolumeByWard() {
      return complaints
        .aggregate([
          { $group: { _id: "$currentWard", total: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ])
        .toArray();
    },
    listRotations() {
      return rotations.find({}).sort({ startDate: -1 }).toArray();
    },
    createRotation(payload) {
      return rotations.insertOne(payload);
    },
  };
}
