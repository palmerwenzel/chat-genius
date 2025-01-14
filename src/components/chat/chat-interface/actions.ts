'use server';

import { getSupabaseServer } from '@/app/lib/supabase/server';
import { storageService } from '@/services/storage';

export async function sendMessage({
  channelId,
  content,
  type = 'text',
  replyToId,
  attachments
}: {
  channelId: string;
  content: string;
  type?: 'text' | 'code';
  replyToId?: string;
  attachments?: File[];
}) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // First create the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        sender_id: user.id,
        content,
        type,
        replying_to_id: replyToId,
        metadata: attachments ? { 
          files: attachments.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          }))
        } : {}
      })
      .select()
      .single();

    if (messageError) {
      throw messageError;
    }

    // If there are attachments, upload them
    if (attachments?.length) {
      const uploadedFiles = await Promise.all(
        attachments.map(async (file) => {
          const publicUrl = await storageService.uploadFile('attachments', file, {
            name: file.name,
            size: file.size,
            mimeType: file.type,
            channelId,
            messageId: message.id
          }, user.id);

          if (!publicUrl) {
            throw new Error('Failed to upload file');
          }

          return {
            url: publicUrl,
            type: file.type,
            name: file.name,
            size: file.size
          };
        })
      );

      // Update the message with file metadata
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          metadata: {
            files: uploadedFiles.map(file => ({
              name: file.name,
              size: file.size,
              type: file.type,
              url: file.url
            }))
          }
        })
        .eq('id', message.id);

      if (updateError) throw updateError;
    }

    return { success: true, data: message };
  } catch (error) {
    console.error('Error sending message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message'
    };
  }
}

export async function updateTypingStatus(channelId: string, isTyping: boolean) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { error } = await supabase
      .from('channel_typing')
      .upsert({
        channel_id: channelId,
        user_id: user.id,
        is_typing: isTyping,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating typing status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update typing status'
    };
  }
} 