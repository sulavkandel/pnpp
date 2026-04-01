export const ComplaintModelShape = {
  complaintId: "string",
  category: "string",
  subCategory: "string",
  location: {
    gps: "optional { lat, lng }",
    wardNumber: "optional number",
    areaName: "string",
    nearestLandmark: "string",
  },
  media: ["photo or video urls"],
  description: "string",
  priority: "high | medium | low",
  contactDetails: {
    name: "optional string",
    phone: "optional string",
    email: "optional string",
  },
  isAnonymous: "boolean",
  currentDepartment: "string",
  currentWard: "optional number",
  status: "received | assigned | in_progress | resolved | forwarded",
};
