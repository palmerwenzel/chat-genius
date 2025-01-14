import { Sidebar } from "@/components/sidebar/SidebarNew";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch any data needed by the chat layout
  const supabase = getSupabaseServer();
  const { data: channelsData } = await supabase
    .from("channels")
    .select("id, name, visibility")
    .order("name");

  const channels = channelsData ?? [];

  return (
    <div className="fixed inset-0 flex">
      <aside className="w-64 flex-shrink-0 border-r border-gray-300">
        <Sidebar channels={channels} />
      </aside>
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}