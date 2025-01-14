import { getSupabaseServer } from "@/lib/supabase/supabase-server";
import { notFound } from "next/navigation";

type Props = {
  params: {
    groupId: string;
  };
};

export default async function GroupPage({ params }: Props) {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return notFound();
  }

  // Check if the user is a member of this group or if it is public
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
      .eq('group_members.user_id', user.id)
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
    console.error('Error fetching group: Group not found or no access');
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-2xl font-bold mb-4">{group.name}</h1>
      {group.description && (
        <p className="text-muted-foreground mb-8 max-w-lg">{group.description}</p>
      )}
      <div className="text-muted-foreground">
        {/* Group details / channels, etc. */}
      </div>
    </div>
  );
}