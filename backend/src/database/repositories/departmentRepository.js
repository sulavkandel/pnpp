import { collectionNames, getCollection } from "../collections.js";

export function getDepartmentRepository() {
  const collection = getCollection(collectionNames.departments);

  return {
    collection,
    listDepartments() {
      return collection.find({}).toArray();
    },
    findByCode(code) {
      return collection.findOne({ code });
    },
    createDepartment(payload) {
      return collection.insertOne(payload);
    },
    updateDepartment(code, patch) {
      return collection.updateOne(
        { code },
        {
          $set: {
            ...patch,
            updatedAt: new Date(),
          },
        },
      );
    },
    deleteDepartment(code) {
      return collection.deleteOne({ code });
    },
  };
}
