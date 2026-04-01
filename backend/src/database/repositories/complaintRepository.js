import { collectionNames, getCollection } from "../collections.js";

export function getComplaintRepository() {
  const collection = getCollection(collectionNames.complaints);
  const historyCollection = getCollection(collectionNames.complaintStatusHistory);

  return {
    collection,
    historyCollection,
    listAll() {
      return collection.find({}).toArray();
    },
    findByComplaintId(complaintId) {
      return collection.findOne({ complaintId });
    },
    createComplaint(payload) {
      return collection.insertOne(payload);
    },
    updateStatus(id, status) {
      return collection.updateOne({ _id: id }, { $set: { status } });
    },
    forwardComplaint(id, targetDepartment) {
      return collection.updateOne({ _id: id }, { $set: { currentDepartment: targetDepartment, status: "forwarded" } });
    },
    logStatusHistory(entry) {
      return historyCollection.insertOne(entry);
    },
  };
}
