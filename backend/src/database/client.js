import dns from "node:dns";
import { MongoClient, ServerApiVersion } from "mongodb";
import { appConfig } from "../config/appConfig.js";

let client;
let database;

function getPreferredMongoUri() {
  return appConfig.mongodbDirectUri || appConfig.mongodbUri;
}

function shouldUseSrvUri(uri) {
  return String(uri || "").startsWith("mongodb+srv://");
}

function buildMongoClientOptions() {
  const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    maxPoolSize: 10,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    tls: true,
  };

  if (appConfig.mongodbForceIpv4) {
    options.family = 4;
  }

  return options;
}

function isSrvDnsFailure(error) {
  const message = String(error?.message || "");
  return message.includes("querySrv")
    || message.includes("_mongodb._tcp")
    || message.includes("ENOTFOUND")
    || message.includes("ECONNREFUSED");
}

function buildMongoConnectionError(error) {
  const uri = getPreferredMongoUri();
  const hints = [];

  if (isSrvDnsFailure(error) && String(uri || "").startsWith("mongodb+srv://")) {
    hints.push("SRV DNS lookup failed in this environment.");
    hints.push("Use a standard Atlas connection string in MONGODB_DIRECT_URI if SRV records are blocked.");
    hints.push("If possible, run the backend on Node 20 or Node 22 LTS instead of Node 25.");
  }

  if (!hints.length) {
    hints.push(error?.message || "Unknown MongoDB connection failure.");
  }

  return new Error(hints.join(" "));
}

function warnIfUnsupportedNodeRuntime() {
  const major = Number(process.versions?.node?.split(".")[0] || 0);
  if (major > 22) {
    console.warn(
      `Warning: Node ${process.version} is newer than the commonly supported MongoDB Atlas LTS runtime range. Prefer Node 20 or 22 if Atlas connectivity is unstable.`,
    );
  }
}

async function closeMongoConnection() {
  if (client) {
    await client.close().catch(() => {});
    client = undefined;
  }
  database = undefined;
}

async function connectWithMongoClient(mongoUri, dnsServers = null) {
  const previousDnsServers = dns.getServers();
  if (dnsServers?.length) {
    dns.setServers(dnsServers);
  }

  client = new MongoClient(mongoUri, buildMongoClientOptions());

  try {
    await client.connect();
    database = client.db(appConfig.mongodbDbName);
    await database.command({ ping: 1 });
    await Promise.all([
      database.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true }),
      database.collection("users").createIndex({ mobileNumber: 1 }, { unique: true, sparse: true }),
      database.collection("users").createIndex({ citizenCode: 1 }, { unique: true, sparse: true }),
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
  } catch (error) {
    await closeMongoConnection();
    throw error;
  } finally {
    if (dnsServers?.length) {
      try {
        dns.setServers(previousDnsServers);
      } catch {
        // Ignore DNS restoration failures and preserve the latest connection error instead.
      }
    }
  }
}

export async function connectDatabase() {
  if (database) return database;

  const mongoUri = getPreferredMongoUri();
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add your MongoDB Atlas connection string to backend/.env.");
  }

  warnIfUnsupportedNodeRuntime();

  try {
    return await connectWithMongoClient(mongoUri);
  } catch (error) {
    const shouldRetryWithPublicDns = shouldUseSrvUri(mongoUri)
      && appConfig.mongodbPublicDnsRetry
      && appConfig.mongodbDnsServers.length
      && isSrvDnsFailure(error);

    if (shouldRetryWithPublicDns) {
      console.warn(
        `MongoDB SRV lookup failed. Retrying with explicit DNS servers: ${appConfig.mongodbDnsServers.join(", ")}`,
      );
      try {
        return await connectWithMongoClient(mongoUri, appConfig.mongodbDnsServers);
      } catch (dnsRetryError) {
        throw buildMongoConnectionError(dnsRetryError);
      }
    }

    throw buildMongoConnectionError(error);
  }
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
