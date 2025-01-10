import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/server-supabase";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ChatProvider } from "@/contexts/chat";

export default async function ChatPage() {
  const supabase = await createServerSupabase();
  
  // Get the first available channel
  const { data: firstChannel } = await supabase
    .from('channels')
    .select('name')
    .order('name')
    .limit(1)
    .single();

  // If there's a channel available, redirect to it
  if (firstChannel) {
    redirect(`/chat/${firstChannel.name}`);
  }

  // If no channels exist, show the welcome screen
  return (
    <ChatProvider>
      <ChatInterface
        channelId=""
        title="Welcome to Chat"
        subtitle="Select a channel from the sidebar to start chatting, or create a new one"
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-center">
            No channels available. Create a channel to start chatting!
          </p>
        </div>
      </ChatInterface>
    </ChatProvider>
  );
} 