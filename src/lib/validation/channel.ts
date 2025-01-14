import { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { logger } from '@/lib/logger';

// Channel name validation schema
export const channelNameSchema = z
  .string()
  .min(1, 'Channel name is required')
  .max(50, 'Channel name must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers, and hyphens');

// Channel creation schema
export const createChannelSchema = z.object({
  name: channelNameSchema,
  description: z.string().max(500).optional(),
  visibility: z.enum(['public', 'private']).default('private'),
  type: z.enum(['text', 'voice']).default('text')
});

export type CreateChannelData = z.infer<typeof createChannelSchema>;

// Validation functions
export async function validateChannelName(groupId: string, name: string) {
  try {
    // First validate format
    channelNameSchema.parse(name);

    // Then check for duplicates
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('channels')
      .select('id')
      .eq('group_id', groupId)
      .eq('name', name)
      .maybeSingle();

    if (error) {
      logger.error('channel.validate.name', error, { groupId, name });
      throw new Error('Failed to validate channel name');
    }

    if (data) {
      throw new Error('Channel name already exists in this group');
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    if (error instanceof Error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
    return { 
      success: false, 
      error: 'Failed to validate channel name' 
    };
  }
}

// Full channel validation
export async function validateChannel(groupId: string, data: CreateChannelData) {
  try {
    // Validate all fields
    createChannelSchema.parse(data);

    // Check for duplicate name
    const nameValidation = await validateChannelName(groupId, data.name);
    if (!nameValidation.success) {
      return nameValidation;
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0].message 
      };
    }
    return { 
      success: false, 
      error: 'Failed to validate channel' 
    };
  }
} 