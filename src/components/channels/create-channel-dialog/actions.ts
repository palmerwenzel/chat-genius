'use server';

import { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const createChannelSchema = z.object({
  name: z.string()
    .min(2, 'Channel name must be at least 2 characters')
    .max(100, 'Channel name must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  isPublic: z.boolean().default(false),
  groupId: z.string(),
});

export type CreateChannelData = z.infer<typeof createChannelSchema>;

export async function createChannel(data: CreateChannelData) {
  const supabase = await getSupabaseServer();
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'You must be logged in to create a channel.' };
    }

    // Validate input
    const validated = createChannelSchema.safeParse(data);
    if (!validated.success) {
      return { error: 'Invalid channel data provided.' };
    }

    // Check if channel name exists in this group
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('name', data.name)
      .eq('group_id', data.groupId)
      .single();

    if (existingChannel) {
      return { error: 'Channel name already exists in this group' };
    }

    // Create channel
    const { data: channel, error: createError } = await supabase
      .from('channels')
      .insert({
        name: data.name,
        description: data.description || null,
        visibility: data.isPublic ? 'public' : 'private',
        type: 'text',
        created_by: user.id,
        group_id: data.groupId,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Add creator as member
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    // Revalidate paths
    revalidatePath('/chat');
    
    return { 
      success: true,
      message: `#${data.name} has been created successfully.`,
      channelId: channel.id
    };
  } catch (error) {
    logger.error('channel.create', error);
    return { error: 'Failed to create channel. Please try again.' };
  }
}

export async function checkChannelName(name: string, groupId: string) {
  const supabase = await getSupabaseServer();

  try {
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('name', name)
      .eq('group_id', groupId)
      .single();

    return { exists: !!existingChannel };
  } catch (error) {
    logger.error('channel.checkName', error);
    return { error: 'Failed to check channel name' };
  }
} 