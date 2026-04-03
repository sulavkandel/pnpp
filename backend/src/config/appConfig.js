export const appConfig = {
  port: process.env.PORT || 4000,
  mongodbUri: process.env.MONGODB_URI || "",
  mongodbDirectUri: process.env.MONGODB_DIRECT_URI || "",
  mongodbDbName: process.env.MONGODB_DB_NAME || "pnpp_portal",
  mongodbForceIpv4: String(process.env.MONGODB_FORCE_IPV4 || "").trim().toLowerCase() === "true",
  mongodbPublicDnsRetry: String(process.env.MONGODB_USE_PUBLIC_DNS_ON_SRV_FAILURE || "true").trim().toLowerCase() !== "false",
  mongodbDnsServers: String(process.env.MONGODB_DNS_SERVERS || "1.1.1.1,8.8.8.8")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
};
