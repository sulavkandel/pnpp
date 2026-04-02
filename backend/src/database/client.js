import { MongoClient } from "mongodb";
import { appConfig } from "../config/appConfig.js";

let client;
let database;

export async function connectDatabase() {
  if (database) return database;

  if (!appConfig.mongodbUri) {
    throw new Error("MONGODB_URI is missing. Add your MongoDB Atlas connection string to backend/.env.");
  }

  client = new MongoClient(appConfig.mongodbUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    maxPoolSize: 10,
  });
  await client.connect();
  database = client.db(appConfig.mongodbDbName);
  await database.command({ ping: 1 });
  await Promise.all([
    database.collection("users").createIndex({ mobileNumber: 1 }, { unique: true, sparse: true }),
    database.collection("users").createIndex({ loginId: 1 }, { unique: true, sparse: true }),
    database.collection("office_accounts").createIndex({ loginId: 1 }, { unique: true }),
    database.collection("office_accounts").createIndex({ officeType: 1, divisionName: 1, sectionName: 1 }),
    database.collection("office_accounts").createIndex({ officeType: 1, wardNumber: 1 }),
    database.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    database.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection("assignment_counters").createIndex({ bucketKey: 1 }, { unique: true }),
    database.collection("complaints").createIndex({ tokenNumber: 1 }, { unique: true }),
    database.collection("complaints").createIndex({ citizenId: 1, createdAt: -1 }),
    database.collection("complaints").createIndex({ assignedOfficerId: 1, createdAt: -1 }),
    database.collection("complaints").createIndex({ routeBucket: 1, createdAt: -1 }),
    database.collection("complaint_comments").createIndex({ complaintToken: 1, createdAt: 1 }),
  ]);
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
