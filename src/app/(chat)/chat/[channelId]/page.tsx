import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { MessageList } from "@/components/messages/MessageList";
import { MessagesContainer } from "@/components/messages/MessagesContainer";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { createServerSupabase } from "@/lib/server-supabase";
import { notFound, redirect } from "next/navigation";
import { ChatProvider } from "@/contexts/chat";

type Props = {
  params: {
    channelId: string;
  };
  searchParams: {
    message?: string;
  };
};

export default async function ChannelPage({ params, searchParams }: Props) {
  const supabase = await createServerSupabase();

  // Verify auth status
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    redirect('/login');
  }

  // Verify user exists in database
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', session.user.id)
    .single();

  if (userError || !user) {
    // Clear auth cookies and redirect
    await supabase.auth.signOut();
    redirect('/login');
  }

  // Get basic channel info synchronously
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('id, name, description')
    .eq('name', params.channelId)
    .single();

  if (channelError) {
    console.error('Error fetching channel:', channelError);
    return notFound();
  }

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
} 