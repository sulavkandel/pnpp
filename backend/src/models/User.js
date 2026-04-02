export const UserModelShape = {
  id: "ObjectId|string",
  role: "citizen | ward | department | admin",
  name: "string",
  mobileNumber: "string",
  email: "optional string",
  citizenCode: "optional CIT-XXXX code for anonymous-capable citizen login",
  isAnonymousRegistered: "boolean",
  rewardPoints: "number",
  passwordHash: "string",
  createdAt: "Date",
  updatedAt: "Date",
};
