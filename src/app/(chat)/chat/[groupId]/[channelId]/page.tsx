import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { MessageList } from "@/components/messages/message-list";
import { MessagesContainer } from "@/components/messages/messages-container";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { getSupabaseServer } from "@/app/lib/supabase/server";
import { notFound } from "next/navigation";
import { ChatProvider } from "@/contexts/chat";

export default async function ChannelPage({
  params,
  searchParams = {}
}: {
  params: {
    groupId: string;
    channelId: string;
  };
  searchParams?: {
    message?: string;
  };
}) {
  const supabase = await getSupabaseServer();
  // Middleware ensures session exists, but we double-check for SSR
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (!session?.user || sessionError) {
    return notFound();
  }

  // Check if user is a member of the group or if it's public
  const [{ data: memberGroup }, { data: publicGroup }] = await Promise.all([
    supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        visibility,
        group_members!inner (
          role,
          user_id
        )
      `)
      .eq('name', params.groupId)
      .eq('group_members.user_id', session.user.id)
      .single(),
    supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        visibility
      `)
      .eq('name', params.groupId)
      .eq('visibility', 'public')
      .single()
  ]);

  const group = memberGroup || publicGroup;
  if (!group) {
    console.error('Error fetching group: Group not found');
    return notFound();
  }

  // Check if user is a member of the channel or if it's public
  const [{ data: memberChannel }, { data: publicChannel }] = await Promise.all([
    supabase
      .from('channels')
      .select(`
        id,
        name,
        description,
        visibility,
        group_id,
        channel_members!inner (
          role,
          user_id
        )
      `)
      .eq('name', params.channelId)
      .eq('group_id', group.id)
      .eq('channel_members.user_id', session.user.id)
      .single(),
    supabase
      .from('channels')
      .select(`
        id,
        name,
        description,
        visibility,
        group_id
      `)
      .eq('name', params.channelId)
      .eq('group_id', group.id)
      .eq('visibility', 'public')
      .single()
  ]);

  const channel = memberChannel || publicChannel;
  if (!channel) {
    console.error('Error fetching channel: Channel not found');
    return notFound();
  }

  if (channel.group_id !== group.id) {
    console.error('Channel does not belong to group');
    return notFound();
  }

  // The outer structure is a server component, but
  // ChatInterface, MessagesContainer, etc. are client components.
  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 min-w-0">
        <ChatProvider>
          <ChatInterface
            channelId={channel.id}
            groupId={group.id}
            title={`#${channel.name}`}
            subtitle={channel.description}
          >
            <MessageList channelId={channel.id}>
              <Suspense>
                <MessagesContainer
                  channelId={channel.id}
                  highlightMessageId={searchParams.message}
                />
              </Suspense>
            </MessageList>
          </ChatInterface>
        </ChatProvider>
      </div>
      <ChannelSidebar groupId={group.id} channelId={channel.id} />
    </div>
  );
}