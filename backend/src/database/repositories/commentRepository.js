import { collectionNames, getCollection } from "../collections.js";

export function getCommentRepository() {
  const collection = getCollection(collectionNames.complaintComments);

  return {
    collection,
    addComment(comment) {
      return collection.insertOne(comment);
    },
    listByComplaintToken(complaintToken) {
      return collection.find({ complaintToken }).sort({ createdAt: 1 }).toArray();
    },
  };
}
