import { collectionNames, getCollection } from "../collections.js";

export function getUserRepository() {
  const collection = getCollection(collectionNames.users);

  return {
    collection,
    findByMobileNumber(mobileNumber) {
      return collection.findOne({ mobileNumber });
    },
    findByLoginId(loginId) {
      return collection.findOne({ loginId });
    },
    findByRole(role) {
      return collection.find({ role }).toArray();
    },
    findByRoleAndLoginId(role, loginId) {
      return collection.findOne({ role, loginId });
    },
    createUser(user) {
      return collection.insertOne(user);
    },
    findById(id) {
      return collection.findOne({ _id: id });
    },
  };
}
