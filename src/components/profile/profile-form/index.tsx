import { getSupabaseServer } from '@/lib/supabase/server';
import { ProfileForm } from './client';
import { updateProfile, updateProfilePicture } from './actions';

interface ProfileFormServerProps {
  userId: string;
}

export async function ProfileFormServer({ userId }: ProfileFormServerProps) {
  const supabase = getSupabaseServer();
  
  // Fetch user profile data
  const { data: user, error } = await supabase
    .from('users')
    .select('display_name, email, bio, theme, avatar_url')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to load user profile');
  }

  return (
    <ProfileForm
      defaultValues={{
        displayName: user.display_name,
        email: user.email,
        bio: user.bio,
        theme: user.theme,
        avatarUrl: user.avatar_url,
      }}
      onSubmit={updateProfile}
      onUpdatePicture={updateProfilePicture}
    />
  );
} 