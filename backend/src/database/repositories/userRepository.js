import { ObjectId } from "mongodb";
import { collectionNames, getCollection } from "../collections.js";

export function getUserRepository() {
  const collection = getCollection(collectionNames.users);

  return {
    collection,
    findByEmail(email) {
      return collection.findOne({ email });
    },
    findByMobileNumber(mobileNumber) {
      return collection.findOne({ mobileNumber });
    },
    findByCitizenCode(citizenCode) {
      return collection.findOne({ citizenCode });
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
      return collection.findOne({ _id: new ObjectId(id) });
    },
    updateUser(id, patch) {
      return collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...patch,
            updatedAt: new Date(),
          },
        },
      );
    },
  };
}
