import { Suspense } from "react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ChannelSidebar } from "@/components/chat/ChannelSidebarNew";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { MessageList } from "@/components/messages/message-list/client";
import { MessagesContainer } from "@/components/messages/messages-container/client";
import { ChatProvider } from "@/contexts/chat";
import { notFound } from "next/navigation";

interface Props {
  params: {
    groupId: string;
    channelId: string;
  };
  searchParams?: {
    message?: string;
  };
}

interface PresenceData {
  status: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status?: string | null;
  last_active?: string;
}

interface PublicMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  presence: PresenceData[];
}

interface GroupMember {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  users: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    presence: PresenceData[];
  };
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member';
  status: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status?: string | null;
}

export default async function ChannelPage({ params, searchParams = {} }: Props) {
  const supabase = getSupabaseServer();

  // Get group visibility
  const { data: groupData } = await supabase
    .from('groups')
    .select('visibility, id, name, description')
    .eq('id', params.groupId)
    .single();

  if (!groupData) return notFound();

  const isPublicGroup = groupData.visibility === 'public';

  // Get channel data
  const { data: channelData } = await supabase
    .from('channels')
    .select('id, name, description')
    .eq('group_id', groupData.id)
    .eq('id', params.channelId)
    .single();

  if (!channelData) return notFound();

  // Get members based on group visibility
  const { data: members } = isPublicGroup
    ? await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          avatar_url,
          presence (
            status,
            custom_status,
            last_active
          )
        `)
        .order('name')
    : await supabase
        .from('group_members')
        .select(`
          user_id,
          role,
          users!inner (
            id,
            name,
            email,
            avatar_url,
            presence (
              status,
              custom_status,
              last_active
            )
          )
        `)
        .eq('group_id', params.groupId);

  if (!members) return notFound();

  // Format members for the client component
  const formattedMembers = (members as (PublicMember | GroupMember)[]).map(member => ({
    id: isPublicGroup ? (member as PublicMember).id : (member as GroupMember).users.id,
    name: isPublicGroup ? (member as PublicMember).name : (member as GroupMember).users.name,
    email: isPublicGroup ? (member as PublicMember).email : (member as GroupMember).users.email,
    avatar_url: isPublicGroup 
      ? (member as PublicMember).avatar_url || null
      : (member as GroupMember).users.avatar_url || null,
    role: isPublicGroup 
      ? ('member' as const) 
      : ((member as GroupMember).role as 'owner' | 'admin' | 'member'),
    status: (isPublicGroup 
      ? (member as PublicMember).presence?.[0]?.status 
      : (member as GroupMember).users.presence?.[0]?.status) || 'offline',
    custom_status: isPublicGroup
      ? (member as PublicMember).presence?.[0]?.custom_status || null
      : (member as GroupMember).users.presence?.[0]?.custom_status || null
  })) satisfies Member[];

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 min-w-0">
        <ChatProvider>
          <ChatInterface
            channelId={channelData.id}
            groupId={groupData.id}
            title={`#${channelData.name}`}
            subtitle={channelData.description}
          >
            <MessageList channelId={channelData.id}>
              <Suspense>
                <MessagesContainer
                  channelId={channelData.id}
                  highlightMessageId={searchParams.message}
                  initialMessages={[]}
                />
              </Suspense>
            </MessageList>
          </ChatInterface>
        </ChatProvider>
      </div>
      <ChannelSidebar members={formattedMembers} channelId={params.channelId} />
    </div>
  );
}