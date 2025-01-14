'use server';

import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { uploadAvatar } from '@/components/storage/actions';

const profileSchema = z.object({
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be 50 characters or less'),
  bio: z.string()
    .max(500, 'Bio must be 500 characters or less')
    .optional(),
  theme: z.enum(['light', 'dark', 'system']),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export async function updateProfile(data: ProfileFormData) {
  const supabase = await getSupabaseServer();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'You must be logged in to update your profile.' };
  }

  try {
    // Validate input
    const validated = profileSchema.parse(data);

    // Update profile
    const { error: profileError } = await supabase
      .from('users')
      .update({
        display_name: validated.displayName,
        bio: validated.bio || null,
        theme: validated.theme,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Revalidate profile pages
    revalidatePath('/profile');
    revalidatePath('/chat'); // For anywhere the profile might be displayed
    
    return { 
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof z.ZodError) {
      return { error: 'Invalid profile data provided.' };
    }
    return { error: 'Failed to update profile. Please try again.' };
  }
}

export async function updateProfilePicture(file: File) {
  const supabase = await getSupabaseServer();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Authentication required' };
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return { error: 'Please upload an image file' };
    }

    const result = await uploadAvatar(file, user.id);
    if ('error' in result) {
      return { error: result.error };
    }

    return { 
      success: true,
      message: 'Profile picture updated successfully',
      avatarUrl: result.url
    };
  } catch (error) {
    logger.error('profile.updatePicture', error);
    return { error: 'Failed to update profile picture' };
  }
} 