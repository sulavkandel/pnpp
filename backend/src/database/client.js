import { MongoClient } from "mongodb";
import { appConfig } from "../config/appConfig.js";

let client;
let database;

export async function connectDatabase() {
  if (database) return database;

  if (!appConfig.mongodbUri) {
    throw new Error("MONGODB_URI is missing. Add your MongoDB Atlas connection string to backend/.env.");
  }

  client = new MongoClient(appConfig.mongodbUri);
  await client.connect();
  database = client.db(appConfig.mongodbDbName);
  return database;
}

export function getDatabase() {
  if (!database) {
    throw new Error("Database is not connected yet.");
  }

  return database;
}

export function getMongoClient() {
  if (!client) {
    throw new Error("Mongo client is not connected yet.");
  }

  return client;
}
