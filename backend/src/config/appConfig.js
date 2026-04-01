export const appConfig = {
  port: process.env.PORT || 4000,
  mongodbUri: process.env.MONGODB_URI || "",
  mongodbDbName: process.env.MONGODB_DB_NAME || "pnpp_portal",
  jwtSecret: process.env.JWT_SECRET || "",
};
