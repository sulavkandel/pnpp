import { notFound } from "next/navigation";
import { CitizenDashboardClient } from "../../../src/components/citizen/CitizenDashboardClient.jsx";

const sectionMap = {
  dashboard: "dashboard",
  "new-complaint": "file",
  complaints: "complaints",
  profile: "profile",
};

export default async function CitizenSectionPage({ params }) {
  const resolvedParams = await params;
  const section = sectionMap[resolvedParams.section];

  if (!section) {
    notFound();
  }

  return <CitizenDashboardClient initialSection={section} />;
}
