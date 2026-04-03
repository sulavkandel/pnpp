import { AdminPanelClient } from "../../../src/components/admin/AdminPanelClient.jsx";

export default function AdminDashboardPage() {
  return <AdminPanelClient initialSection="dashboard" initialOversightTab="escalated" />;
}
