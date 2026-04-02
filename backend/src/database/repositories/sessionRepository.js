import { collectionNames, getCollection } from "../collections.js";

export function getSessionRepository() {
  const collection = getCollection(collectionNames.sessions);

  return {
    collection,
    createSession(session) {
      return collection.insertOne(session);
    },
    findByTokenHash(tokenHash) {
      return collection.findOne({ tokenHash, revokedAt: null });
    },
    revokeSession(tokenHash) {
      return collection.updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
    },
  };
}
