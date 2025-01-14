import { getSupabaseServer } from "@/lib/supabase/supabase-server";
import { notFound } from "next/navigation";

type Props = {
  params: {
    groupId: string;
  };
};

export default async function GroupPage({ params }: Props) {
  const supabase = await getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return notFound();
  }

  // Check if the user is a member of this group or if group is public
  const [{ data: memberGroup }, { data: publicGroup }] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name, description, visibility, group_members!inner(role, user_id)")
      .eq("name", params.groupId)
      .eq("group_members.user_id", user.id)
      .single(),
    supabase
      .from("groups")
      .select("id, name, description, visibility")
      .eq("name", params.groupId)
      .eq("visibility", "public")
      .single(),
  ]);

  const group = memberGroup || publicGroup;
  if (!group) {
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-2xl font-bold mb-4">{group.name}</h1>
      {group.description && (
        <p className="text-gray-500 mb-8 max-w-lg">{group.description}</p>
      )}
      <p className="text-gray-600">Group info placeholder...</p>
    </div>
  );
}