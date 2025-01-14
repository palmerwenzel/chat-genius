'use server';

import { getSupabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  isPublic: z.boolean().default(false),
});

export type CreateGroupForm = z.infer<typeof createGroupSchema>;

export async function createGroup(data: CreateGroupForm) {
  const supabase = getSupabaseServer();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'You must be logged in to create a group.' };
  }

  try {
    // Validate input
    const validated = createGroupSchema.parse(data);

    // Create the group - the database trigger will automatically add the creator as owner
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: validated.name,
        description: validated.description || null,
        visibility: validated.isPublic ? 'public' : 'private',
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Revalidate the groups list
    revalidatePath('/chat');
    
    return { 
      success: true, 
      group,
      message: `${validated.name} has been created successfully.`
    };
  } catch (error) {
    console.error('Error creating group:', error);
    if (error instanceof z.ZodError) {
      return { error: 'Invalid group data provided.' };
    }
    return { error: 'Failed to create group. Please try again.' };
  }
} 