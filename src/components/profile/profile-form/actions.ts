'use server';

import { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const profileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  theme: z.enum(['light', 'dark', 'system']),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export async function updateProfile(data: ProfileFormData) {
  try {
    const supabase = getSupabaseServer();
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      return { error: 'Not authenticated' };
    }

    const validatedData = profileSchema.safeParse(data);
    if (!validatedData.success) {
      return { error: 'Invalid form data' };
    }

    const { error } = await supabase
      .from('users')
      .update({
        display_name: data.displayName,
        bio: data.bio,
        theme: data.theme,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.session.user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return { error: 'Failed to update profile' };
    }

    revalidatePath('/profile');
    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateProfilePicture(file: File) {
  try {
    const supabase = getSupabaseServer();
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      return { error: 'Not authenticated' };
    }

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      return { error: 'Please upload an image file' };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { error: 'Image must be less than 5MB' };
    }

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.session.user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { error: 'Failed to upload image' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.session.user.id);

    if (updateError) {
      console.error('Error updating profile with avatar:', updateError);
      return { error: 'Failed to update profile picture' };
    }

    revalidatePath('/profile');
    return { 
      success: true, 
      message: 'Profile picture updated successfully',
      avatarUrl: publicUrl
    };
  } catch (error) {
    console.error('Error in updateProfilePicture:', error);
    return { error: 'An unexpected error occurred' };
  }
} 