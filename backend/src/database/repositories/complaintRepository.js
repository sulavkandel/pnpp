import { ObjectId } from "mongodb";
import { collectionNames, getCollection } from "../collections.js";

export function getComplaintRepository() {
  const collection = getCollection(collectionNames.complaints);
  const historyCollection = getCollection(collectionNames.complaintStatusHistory);

  return {
    collection,
    historyCollection,
    listAll() {
      return collection.find({}).sort({ createdAt: -1 }).toArray();
    },
    findByTokenNumber(tokenNumber) {
      return collection.findOne({ tokenNumber });
    },
    findByCitizenId(citizenId) {
      return collection.find({ citizenId }).sort({ createdAt: -1 }).toArray();
    },
    findAssignedToOfficer(assignedOfficerId) {
      return collection.find({ assignedOfficerId }).sort({ createdAt: -1 }).toArray();
    },
    findById(id) {
      return collection.findOne({ _id: new ObjectId(id) });
    },
    createComplaint(payload) {
      return collection.insertOne(payload);
    },
    updateComplaint(tokenNumber, patch) {
      return collection.updateOne(
        { tokenNumber },
        {
          $set: {
            ...patch,
            updatedAt: new Date(),
          },
        },
      );
    },
    async addCommentPointer(tokenNumber, commentSummary) {
      return collection.updateOne(
        { tokenNumber },
        {
          $set: { updatedAt: new Date() },
          $push: { latestComments: { $each: [commentSummary], $slice: -5 } },
        },
      );
    },
    listByFilter(filter = {}) {
      return collection.find(filter).sort({ createdAt: -1 }).toArray();
    },
    logStatusHistory(entry) {
      return historyCollection.insertOne(entry);
    },
    listStatusHistory(tokenNumber) {
      return historyCollection.find({ complaintToken: tokenNumber }).sort({ createdAt: 1 }).toArray();
    },
  };
}
