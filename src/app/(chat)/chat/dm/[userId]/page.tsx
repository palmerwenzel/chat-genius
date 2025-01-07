import { notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";

interface DMPageProps {
  params: {
    userId: string;
  };
}

export default async function DMPage({ params }: DMPageProps) {
  // In a real app, fetch user data here
  const user = await Promise.resolve(null);
  if (!user) return notFound();

  return (
    <ChatInterface
      title={params.userId}
      subtitle="Direct messages will appear here"
    />
  );
} 