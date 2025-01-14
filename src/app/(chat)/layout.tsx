import { Sidebar } from "@/components/sidebar/Sidebar";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { handleSupabaseError } from "@/utils/supabase/helpers";
import { ChannelService } from "@/services/channels";
import { redirect } from "next/navigation";

/**
 * Server Component for the chat layout
 * Provides the sidebar with channel list and main content area
 */
export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient();
  
  // Verify auth status first
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    console.error('Auth error:', handleSupabaseError(sessionError));
    redirect('/login');
  }

  const channelService = new ChannelService(supabase);
  
  try {
    const channels = await channelService.getAllChannels();

    return (
      <div className="fixed inset-0 flex">
        {/* Sidebar */}
        <aside className="w-[var(--sidebar-width-sm)] md:w-[var(--sidebar-width)] flex-shrink-0">
          <Sidebar channels={channels} />
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    );
  } catch (error) {
    console.error('Error fetching channels:', handleSupabaseError(error));
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <p className="text-destructive">
          Unable to load channels. Please try again later.
        </p>
      </div>
    );
  }
} 