import { SidebarNav } from "@/components/sidebar/sidebar-nav";
import { getSupabaseServer } from "@/lib/supabase/supabase-server";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current user
  const supabase = await getSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return null; // Or redirect to login
  }

  return (
    <div className="fixed inset-0 flex">
      <aside className="w-64 flex-shrink-0 border-r border-gray-300">
        <SidebarNav 
          userId={session.user.id}
          currentGroupName={undefined}
          currentChannelName={undefined}
          directMessages={[]}
        />
      </aside>
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}