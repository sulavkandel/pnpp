import "dotenv/config";
import crypto from "node:crypto";
import http from "node:http";
import { appConfig } from "./config/appConfig.js";
import {
  connectToDatabase,
  getDatabase,
  getCollections,
  getUserRepository,
  getComplaintRepository,
  getDepartmentRepository,
  getWardRepository,
  getAdminRepository,
} from "./config/db.js";

const routes = [
  "POST /api/auth/login",
  "POST /api/auth/register",
  "GET /api/complaints",
  "POST /api/complaints",
  "PATCH /api/complaints/:id/status",
  "PATCH /api/complaints/:id/forward",
  "GET /api/admin/analytics",
];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });

    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function sanitizeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    mobileNumber: user.mobileNumber,
    role: user.role,
  };
}

function createServer({ repositories }) {
  return http.createServer(async (req, res) => {
    const { method = "GET", url = "/" } = req;

    if (method === "OPTIONS") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (method === "GET" && url === "/health") {
      sendJson(res, 200, {
        status: "ok",
        database: "connected",
        app: "pnpp-backend",
      });
      return;
    }

    if (method === "GET" && url === "/routes") {
      sendJson(res, 200, { routes });
      return;
    }

    if (method === "POST" && url === "/api/auth/register") {
      try {
        const body = await readJsonBody(req);
        const name = String(body.name || "").trim();
        const mobileNumber = String(body.mobileNumber || "").trim();
        const password = String(body.password || "").trim();

        if (!name || !mobileNumber || !password) {
          sendJson(res, 400, {
            success: false,
            message: "Name, mobile number, and password are required.",
          });
          return;
        }

        const existingUser = await repositories.users.findByMobileNumber(mobileNumber);
        if (existingUser) {
          sendJson(res, 409, {
            success: false,
            message: "A user with this mobile number already exists.",
          });
          return;
        }

        const userPayload = {
          name,
          mobileNumber,
          passwordHash: hashPassword(password),
          role: "citizen",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await repositories.users.createUser(userPayload);
        sendJson(res, 201, {
          success: true,
          message: "User registered successfully.",
          user: {
            id: String(result.insertedId),
            name,
            mobileNumber,
            role: "citizen",
          },
        });
      } catch (error) {
        sendJson(res, 500, {
          success: false,
          message: error.message || "Failed to register user.",
        });
      }
      return;
    }

    if (method === "POST" && url === "/api/auth/login") {
      try {
        const body = await readJsonBody(req);
        const mobileNumber = String(body.mobileNumber || "").trim();
        const password = String(body.password || "").trim();

        if (!mobileNumber || !password) {
          sendJson(res, 400, {
            success: false,
            message: "Mobile number and password are required.",
          });
          return;
        }

        const user = await repositories.users.findByMobileNumber(mobileNumber);
        if (!user || user.role !== "citizen") {
          sendJson(res, 401, {
            success: false,
            message: "Invalid mobile number or password.",
          });
          return;
        }

        const passwordHash = hashPassword(password);
        if (user.passwordHash !== passwordHash) {
          sendJson(res, 401, {
            success: false,
            message: "Invalid mobile number or password.",
          });
          return;
        }

        sendJson(res, 200, {
          success: true,
          message: "Login successful.",
          user: sanitizeUser(user),
        });
      } catch (error) {
        sendJson(res, 500, {
          success: false,
          message: error.message || "Failed to log in.",
        });
      }
      return;
    }

    sendJson(res, 200, {
      message: "PNPP backend is live.",
      requested: `${method} ${url}`,
    });
  });
}

async function startServer() {
  try {
    await connectToDatabase();
    const database = getDatabase();
    const collections = getCollections();
    const repositories = {
      users: getUserRepository(),
      complaints: getComplaintRepository(),
      departments: getDepartmentRepository(),
      wards: getWardRepository(),
      admin: getAdminRepository(),
    };

    console.log(`PNPP backend scaffold ready on port ${appConfig.port}`);
    console.log(`Connected database: ${database.databaseName}`);
    console.log(`Centralized collections: ${Object.keys(collections).join(", ")}`);
    console.log(`Repositories ready: ${Object.keys(repositories).join(", ")}`);
    const server = createServer({ repositories });
    server.listen(appConfig.port, () => {
      console.log(`HTTP server listening on http://localhost:${appConfig.port}`);
      console.log("Planned routes:");
      routes.forEach((route) => console.log(`- ${route}`));
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exitCode = 1;
  }
}

startServer();
