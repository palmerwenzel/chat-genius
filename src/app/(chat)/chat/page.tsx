import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ChatProvider } from "@/contexts/chat";
import { handleSupabaseError } from "@/utils/supabase/helpers";
import { ChannelService } from "@/services/channels";

/**
 * Server Component for the main chat page
 * Redirects to the first available channel or shows a welcome screen
 */
export default async function ChatPage() {
  const supabase = await createServerSupabaseClient();
  const channelService = new ChannelService(supabase);
  
  try {
    // Get the first available channel
    const firstChannel = await channelService.getFirstChannel();

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
  } catch (error) {
    console.error('Error fetching first channel:', handleSupabaseError(error));
    return (
      <ChatProvider>
        <ChatInterface
          channelId=""
          title="Error"
          subtitle="There was an error loading the chat"
        >
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive text-center">
              Unable to load channels. Please try again later.
            </p>
          </div>
        </ChatInterface>
      </ChatProvider>
    );
  }
} 