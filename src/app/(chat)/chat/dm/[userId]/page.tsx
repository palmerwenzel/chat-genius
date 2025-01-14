import { notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { getSupabaseServer } from "@/lib/supabase/supabase-server";

interface DMPageProps {
  params: {
    userId: string;
  };
}

export default async function DMPage({ params }: DMPageProps) {
  const supabase = await getSupabaseServer();

  // Validate the session
  const {
    data: { user },
    error: sessionError
  } = await supabase.auth.getUser();

  if (!user || sessionError) {
    return notFound();
  }

  // For example, fetch the user you’re DMing:
  const { data: foundUser, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.userId)
    .single();

  if (!foundUser || error) {
    return notFound();
  }

  return (
    <ChatInterface
      title={foundUser.name ?? foundUser.id}
      subtitle="Direct messages will appear here"
      channelId={`dm-${foundUser.id}`} // or however you track DMs
      groupId="dm-group" // or anything else
    >
      {/* Put your message list or other client components */}
    </ChatInterface>
  );
}