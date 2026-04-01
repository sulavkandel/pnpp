export const UserModelShape = {
  role: "citizen | ward | department | admin",
  mobileNumber: "string",
  passwordHash: "string",
  department: "optional string",
  wardNumber: "optional number",
};
