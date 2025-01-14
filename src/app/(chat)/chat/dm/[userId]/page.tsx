import { notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterfaceNew";

interface DMPageProps {
  params: {
    userId: string;
  };
}

export default async function DMPage({ params }: DMPageProps) {
  // Example: fetch user data here or check if the user is valid
  const user = null; 
  if (!user) return notFound();

  return (
    <ChatInterface title={params.userId} subtitle="Direct messages will appear here">
      <div className="p-4">DM placeholder for {params.userId}</div>
    </ChatInterface>
  );
}