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
  };
}
