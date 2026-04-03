import { AdminPanelClient } from "../../src/components/admin/AdminPanelClient.jsx";

export default async function AdminPage() {
  return <AdminPanelClient initialSection="dashboard" initialOversightTab="escalated" />;
}
