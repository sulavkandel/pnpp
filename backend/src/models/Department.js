export const DepartmentModelShape = {
  id: "ObjectId|string",
  code: "string unique code",
  name: "string",
  type: "Mahashakha | Upa-Sakha | Ward Office",
  wards: ["string ward numbers"],
  subDepartments: ["string sub department names"],
  description: "optional string",
  active: "boolean",
  createdAt: "Date",
  updatedAt: "Date",
};
