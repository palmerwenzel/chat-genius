"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/supabase-server";
import { uploadFile } from "@/components/storage/actions";

interface SendMessageParams {
  channelId: string;
  content: string;
  type?: 'text' | 'code';
  replyToId?: string;
  attachments?: File[];
}

// Type for file metadata stored in message.metadata.files
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface FileMetadata {
  name: string;
  size: number;
  type: string;
  url?: string;
}

export async function sendMessage({
  channelId,
  content,
  type = 'text',
  replyToId,
  attachments
}: SendMessageParams) {
  const supabase = await getSupabaseServer();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    redirect('/login');
  }

  try {
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

    if (messageError) throw messageError;

    // If there are attachments, upload them
    if (attachments?.length) {
      const uploadedFiles = await Promise.all(
        attachments.map(async (file) => {
          const publicUrl = await uploadFile('attachments', file, {
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

      // Update the message with file URLs
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          metadata: {
            files: uploadedFiles
          }
        })
        .eq('id', message.id);

      if (updateError) throw updateError;
    }

    // Revalidate the messages list
    revalidatePath(`/chat/[groupId]/[channelId]`);

    return { success: true, message };
  } catch (error) {
    console.error('Error sending message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message'
    };
  }
}

export async function updateTypingStatus(channelId: string, isTyping: boolean) {
  const supabase = await getSupabaseServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) return;

  try {
    await supabase
      .from('channel_typing')
      .upsert({
        channel_id: channelId,
        user_id: user.id,
        is_typing: isTyping,
        last_typed: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
}
