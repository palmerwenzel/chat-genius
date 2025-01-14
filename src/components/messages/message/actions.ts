'use server';

import { getSupabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import type { MessageWithReactions, CreateMessageData, UpdateMessageData } from '@/types/messages';

export async function updateMessage(messageId: string, data: UpdateMessageData) {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('messages')
    .update(data)
    .eq('id', messageId);

  if (error) throw error;
  revalidatePath('/');
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const supabase = getSupabaseServer();

  try {
    // Check rate limit for adding reactions
    const rateLimitInfo = await checkRateLimit(userId, 'reactions', 'create');
    if (rateLimitInfo.remaining <= 0) {
      throw new Error('Rate limit exceeded for reactions');
    }

    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single();

    if (existingReaction) {
      // Check rate limit for removing reactions
      const rateLimitInfo = await checkRateLimit(userId, 'reactions', 'delete');
      if (rateLimitInfo.remaining <= 0) {
        throw new Error('Rate limit exceeded for removing reactions');
      }

      await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id);
    } else {
      // Check rate limit for adding reactions
      const rateLimitInfo = await checkRateLimit(userId, 'reactions', 'create');
      if (rateLimitInfo.remaining <= 0) {
        throw new Error('Rate limit exceeded for adding reactions');
      }

      await supabase
        .from('reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji,
        });
    }

    revalidatePath('/');
  } catch (error) {
    logger.error('message.toggleReaction', error, { messageId, userId, emoji });
    throw error;
  }
}

export async function deleteMessage(messageId: string) {
  const supabase = getSupabaseServer();

  try {
    // First get the message to check for files
    const { data: message } = await supabase
      .from('messages')
      .select('metadata')
      .eq('id', messageId)
      .single();

    if (message?.metadata?.files) {
      // Get file metadata records
      const { data: fileMetadata } = await supabase
        .from('file_metadata')
        .select('storage_key')
        .eq('message_id', messageId);

      // Delete files from storage
      if (fileMetadata) {
        await Promise.all(
          fileMetadata.map(async (file: { storage_key: string }) => {
            const { error: storageError } = await supabase.storage
              .from('attachments')
              .remove([file.storage_key]);
            
            if (storageError) {
              logger.error('message.deleteFile', storageError, { 
                messageId, 
                storageKey: file.storage_key 
              });
            }
          })
        );

        // Delete file metadata
        await supabase
          .from('file_metadata')
          .delete()
          .eq('message_id', messageId);
      }
    }

    // Soft delete the message
    const { error } = await supabase
      .from('messages')
      .update({ 
        deleted_at: new Date().toISOString(),
        content: '[Message deleted]',
        metadata: null // Clear metadata since files are deleted
      })
      .eq('id', messageId);

    if (error) throw error;
    revalidatePath('/');
  } catch (error) {
    logger.error('message.delete', error, { messageId });
    throw error;
  }
}

export async function getThreadMessages(threadId: string, limit = 50, before?: string) {
  const supabase = getSupabaseServer();

  try {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users(
          id,
          name,
          avatar_url,
          email
        )
      `)
      .eq('thread_id', threadId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) throw error;
    return messages as MessageWithReactions[];
  } catch (error) {
    logger.error('message.getThreadMessages', error, { threadId });
    throw error;
  }
}

export async function createMessage(data: CreateMessageData) {
  const supabase = getSupabaseServer();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Check rate limit for creating messages
    const rateLimitInfo = await checkRateLimit(user.id, 'messages', 'create');
    if (rateLimitInfo.remaining <= 0) {
      throw new Error('Rate limit exceeded for message creation');
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        channel_id: data.channelId,
        sender_id: user.id,
        content: data.content,
        thread_id: data.threadId,
        type: data.type || 'text',
      })
      .select(`
        *,
        sender:users(
          id,
          name,
          avatar_url,
          email
        )
      `)
      .single();

    if (error) throw error;

    revalidatePath('/');
    return message as MessageWithReactions;
  } catch (error) {
    logger.error('message.create', error, { channelId: data.channelId, threadId: data.threadId });
    throw error;
  }
}
