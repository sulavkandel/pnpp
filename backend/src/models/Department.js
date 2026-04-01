export const DepartmentModelShape = {
  name: "string",
  code: "string",
  receivesComplaints: true,
  forwardingTargets: ["department codes"],
};
