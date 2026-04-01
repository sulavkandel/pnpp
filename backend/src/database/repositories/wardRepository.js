import { collectionNames, getCollection } from "../collections.js";

export function getWardRepository() {
  const collection = getCollection(collectionNames.wards);

  return {
    collection,
    listWards() {
      return collection.find({}).toArray();
    },
    findByWardNumber(wardNumber) {
      return collection.findOne({ wardNumber });
    },
  };
}
