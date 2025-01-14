import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { MessageList } from "@/components/messages/MessageList";
import { MessagesContainer } from "@/components/messages/MessagesContainer";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChatProvider } from "@/contexts/chat";
import { handleSupabaseError } from "@/utils/supabase/helpers";
import { ChannelService } from "@/services/channels";
import { UserService } from "@/services/users";

interface Props {
  params: {
    channelId: string;
  };
  searchParams: {
    message?: string;
  };
}

/**
 * Server Component for rendering a specific channel page
 * Handles authentication, channel verification, and layout
 */
export default async function ChannelPage({ params, searchParams }: Props) {
  const supabase = await createServerSupabaseClient();
  const channelService = new ChannelService(supabase);
  const userService = new UserService(supabase);

  // Verify auth status
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('Error fetching session:', handleSupabaseError(sessionError));
    redirect('/login');
  }
  
  if (!session?.user) {
    redirect('/login');
  }

  // Verify user exists in database
  try {
    const user = await userService.getUserById(session.user.id);
    if (!user) {
      await supabase.auth.signOut();
      redirect('/login');
    }
  } catch (error) {
    console.error('Error fetching user:', handleSupabaseError(error));
    await supabase.auth.signOut();
    redirect('/login');
  }

  // Get basic channel info
  try {
    const channel = await channelService.getChannelByName(params.channelId);
    if (!channel) {
      return notFound();
    }

    // Verify channel ID format
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(channel.id)) {
      console.error('Invalid channel ID format:', channel.id);
      return notFound();
    }

    return (
      <div className="flex h-full min-h-0">
        <div className="flex-1 min-w-0">
          <ChatProvider>
            <ChatInterface
              channelId={channel.id}
              title={`#${channel.name}`}
              subtitle={channel.description}
            >
              <MessageList channelId={channel.id}>
                <Suspense>
                  <MessagesContainer 
                    channelId={params.channelId} 
                    highlightMessageId={searchParams.message}
                  />
                </Suspense>
              </MessageList>
            </ChatInterface>
          </ChatProvider>
        </div>
        <ChannelSidebar channelId={channel.id} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching channel:', handleSupabaseError(error));
    return notFound();
  }
} 