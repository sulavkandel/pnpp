import { collectionNames, getCollection } from "../collections.js";

export function getAssignmentCounterRepository() {
  const collection = getCollection(collectionNames.assignmentCounters);

  return {
    collection,
    async advanceCounter(bucketKey) {
      const result = await collection.findOneAndUpdate(
        { bucketKey },
        { $inc: { sequence: 1 }, $setOnInsert: { bucketKey, createdAt: new Date() } },
        { upsert: true, returnDocument: "before" },
      );

      return result?.sequence || 0;
    },
  };
}
