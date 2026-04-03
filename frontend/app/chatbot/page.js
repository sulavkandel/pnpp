import { ChatbotClient } from "../../src/components/public/ChatbotClient.jsx";

export const metadata = {
  title: "PNPP | AI Complaint Assistant",
  description: "File a municipal complaint conversationally using the PNPP AI chatbot.",
};

export default function ChatbotPage() {
  return <ChatbotClient />;
}
