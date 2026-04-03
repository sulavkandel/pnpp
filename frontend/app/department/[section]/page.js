import { notFound } from "next/navigation";
import { DepartmentDashboardClient } from "../../../src/components/department/DepartmentDashboardClient.jsx";

const sectionMap = {
  new: "new",
  forwarded: "forwarded",
  accepted: "accepted",
  closed: "closed",
  handover: "handover",
  performance: "performance",
};

export default async function DepartmentSectionPage({ params }) {
  const resolvedParams = await params;
  const section = sectionMap[resolvedParams.section];

  if (!section) {
    notFound();
  }

  return <DepartmentDashboardClient initialTab={section} />;
}
