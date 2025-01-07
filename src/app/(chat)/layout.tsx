import { Sidebar } from "@/components/sidebar/Sidebar";
import { createServerSupabase } from "@/lib/server-supabase";

interface Channel {
  id: string;
  name: string;
}

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase();
  
  const { data: channelsData } = await supabase
    .from('channels')
    .select('id, name')
    .order('name')
    .throwOnError();

  const channels: Channel[] = channelsData?.map(channel => ({
    id: channel.id,
    name: channel.name
  })) || [];

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r">
        <Sidebar channels={channels} />
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
} 