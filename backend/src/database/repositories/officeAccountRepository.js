import { ObjectId } from "mongodb";
import { collectionNames, getCollection } from "../collections.js";

export function getOfficeAccountRepository() {
  const collection = getCollection(collectionNames.officeAccounts);

  return {
    collection,
    findByLoginId(loginId) {
      return collection.findOne({ loginId });
    },
    findByOfficeTypeAndLoginId(officeType, loginId) {
      return collection.findOne({ officeType, loginId });
    },
    findById(id) {
      return collection.findOne({ _id: new ObjectId(id) });
    },
    createOfficeAccount(account) {
      return collection.insertOne(account);
    },
    updateOfficeAccount(id, patch) {
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
    listByOfficeType(officeType) {
      return collection.find({ officeType }).toArray();
    },
    listAll() {
      return collection.find({}).toArray();
    },
  };
}
