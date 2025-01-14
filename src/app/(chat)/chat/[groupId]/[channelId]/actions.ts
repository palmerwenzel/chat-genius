'use server';

import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import type { Database } from '@/types/supabase';
import type { Channel } from '@/types/channels';
import type { MessageWithReactions, CreateMessageData, UpdateMessageData } from '@/types/messages';

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
  reactions: Database['public']['Tables']['reactions']['Row'][];
};

type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member';
  status: PresenceStatus;
  custom_status?: string | null;
}

function sortMembers(members: Member[]): Member[] {
  return members.sort((a, b) => {
    // First sort by online status
    if (a.status !== 'offline' && b.status === 'offline') return -1;
    if (a.status === 'offline' && b.status !== 'offline') return 1;

    // Then by role
    const roleOrder: Record<Member['role'], number> = { owner: 0, admin: 1, member: 2 };
    if (roleOrder[a.role] !== roleOrder[b.role]) {
      return roleOrder[a.role] - roleOrder[b.role];
    }

    // Finally by name
    return a.name.localeCompare(b.name);
  });
}

export async function getChannelMembers(groupId: string, channelId: string): Promise<Member[]> {
  const supabase = await getSupabaseServer();

  try {
    // First check if it's a public group
    const { data: group } = await supabase
      .from('groups')
      .select('visibility')
      .eq('id', groupId)
      .single();

    const isPublicGroup = group?.visibility === 'public';

    // Get members based on group type
    if (isPublicGroup) {
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          avatar_url,
          presence (
            status,
            custom_status,
            last_active
          )
        `)
        .order('name');

      if (membersError) throw membersError;

      const formattedMembers = (members || []).map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        avatar_url: member.avatar_url,
        role: 'member' as const,
        status: (member.presence?.[0]?.status || 'offline') as PresenceStatus,
        custom_status: member.presence?.[0]?.custom_status
      }));

      return sortMembers(formattedMembers);
    } else {
      // For private groups, get channel members with their roles
      const { data: members, error: membersError } = await supabase
        .from('channel_members')
        .select(`
          role,
          users!inner (
            id,
            name,
            email,
            avatar_url,
            presence (
              status,
              custom_status,
              last_active
            )
          )
        `)
        .eq('channel_id', channelId);

      if (membersError) throw membersError;

      const formattedMembers = (members || []).map((member: any) => ({
        id: member.users.id,
        name: member.users.name,
        email: member.users.email,
        avatar_url: member.users.avatar_url,
        role: member.role as 'owner' | 'admin' | 'member',
        status: (member.users.presence?.[0]?.status || 'offline') as PresenceStatus,
        custom_status: member.users.presence?.[0]?.custom_status
      }));

      return sortMembers(formattedMembers);
    }
  } catch (error) {
    logger.error('channel.getMembers', error, { groupId, channelId });
    throw error;
  }
}

export async function getChannelMessages(channelId: string, limit = 50, before?: string) {
  const supabase = await getSupabaseServer();

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
        ),
        reactions(*)
      `)
      .eq('channel_id', channelId)
      .is('thread_id', null) // Only get main messages, not thread replies
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) throw error;
    return messages as MessageType[];
  } catch (error) {
    logger.error('channel.getMessages', error, { channelId });
    throw error;
  }
}

// Channel lookup functions
export async function getChannelById(channelId: string): Promise<Channel | null> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('channel.getById', error, { channelId });
    throw error;
  }
}

export async function getChannelByName(groupId: string, channelName: string): Promise<Channel | null> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('group_id', groupId)
      .eq('name', channelName)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('channel.getByName', error, { groupId, channelName });
    throw error;
  }
}

export async function createMessage(data: CreateMessageData): Promise<MessageWithReactions> {
  const supabase = await getSupabaseServer();

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

export async function updateMessage(messageId: string, data: UpdateMessageData) {
  const supabase = await getSupabaseServer();

  try {
    const { error } = await supabase
      .from('messages')
      .update(data)
      .eq('id', messageId);

    if (error) throw error;
    revalidatePath('/');
  } catch (error) {
    logger.error('message.update', error, { messageId });
    throw error;
  }
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const supabase = await getSupabaseServer();

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
  const supabase = await getSupabaseServer();

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

export async function getThreadMessages(threadId: string, limit = 50, before?: string): Promise<MessageWithReactions[]> {
  const supabase = await getSupabaseServer();

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