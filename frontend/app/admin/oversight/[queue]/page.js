import { notFound } from "next/navigation";
import { AdminPanelClient } from "../../../../src/components/admin/AdminPanelClient.jsx";

const queueMap = {
  escalated: "escalated",
  invalid: "invalid",
  reviews: "reviews",
};

export default async function AdminOversightQueuePage({ params }) {
  const resolvedParams = await params;
  const queue = queueMap[resolvedParams.queue];

  if (!queue) {
    notFound();
  }

  return <AdminPanelClient initialSection="oversight" initialOversightTab={queue} />;
}
