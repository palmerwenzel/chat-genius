import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Messages } from "@/components/messages/Messages";
import { MessageList } from "@/components/messages/MessageList";
import { createServerSupabase } from "@/lib/server-supabase";
import { notFound } from "next/navigation";

type Props = {
  params: {
    channelId: string;
  };
};

export default async function ChannelPage({ params }: Props) {
  // Get basic channel info synchronously
  const supabase = await createServerSupabase();
  const { data: channel } = await supabase
    .from('channels')
    .select('id, name, description')
    .eq('name', params.channelId)
    .single();

  if (!channel) {
    return notFound();
  }

  return (
    <ChatInterface
      channelId={channel.id}
      title={`#${channel.name}`}
      subtitle={channel.description}
    >
      <MessageList channelId={channel.id}>
        <Suspense>
          <Messages channelId={params.channelId} />
        </Suspense>
      </MessageList>
    </ChatInterface>
  );
} 