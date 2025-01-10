import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Bucket names
const BUCKETS = {
  ATTACHMENTS: 'attachments',
  AVATARS: 'avatars',
} as const;

type BucketName = typeof BUCKETS[keyof typeof BUCKETS];
type FileMetadata = {
  size: number;
  mimeType: string;
  filename: string;
  channelId?: string;
  groupId?: string;
  messageId?: string;
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class StorageService {
  private supabase = createClientComponentClient<Database>();

  /**
   * Upload a file to a bucket
   */
  async uploadFile(
    bucket: BucketName,
    file: File,
    metadata: FileMetadata,
    userId: string
  ): Promise<string | null> {
    if (!metadata.channelId) throw new Error('Channel ID is required');
    if (!metadata.groupId) throw new Error('Group ID is required');
    if (!UUID_REGEX.test(metadata.channelId)) throw new Error('Invalid channel ID format');
    if (!UUID_REGEX.test(metadata.groupId)) throw new Error('Invalid group ID format');

    // Validate channel and group membership before proceeding
    const { data: membership, error: membershipError } = await this.supabase
      .from('channel_members')
      .select(`
        channel_id,
        channels!inner (
          group_id
        )
      `)
      .eq('channel_id', metadata.channelId)
      .eq('user_id', userId)
      .eq('channels.group_id', metadata.groupId)
      .single();

    if (membershipError || !membership) {
      console.error('Error checking channel membership:', membershipError);
      throw new Error('User is not a member of this channel or group');
    }

    // Create a unique file path scoped to channel
    const timestamp = new Date().getTime();
    const filePath = `${metadata.groupId}/${metadata.channelId}/${timestamp}-${metadata.filename}`;

    // First create metadata entry
    const { error: metadataError } = await this.supabase
      .from('file_metadata')
      .insert({
        file_path: filePath,
        bucket,
        size: metadata.size,
        mime_type: metadata.mimeType,
        original_name: metadata.filename,
        channel_id: metadata.channelId,
        group_id: metadata.groupId,
        message_id: metadata.messageId,
        uploaded_by: userId
      });

    if (metadataError) {
      console.error('Error storing file metadata:', metadataError);
      throw new Error(`Metadata storage failed: ${metadataError.message}`);
    }

    // Then upload the file
    const { error: uploadError } = await this.supabase
      .storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: metadata.mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      // Clean up metadata if upload fails
      await this.supabase
        .from('file_metadata')
        .delete()
        .eq('file_path', filePath);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL if successful
    const { data: { publicUrl } } = this.supabase
      .storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  /**
   * Delete a file from a bucket
   */
  async deleteFile(bucket: BucketName, filePath: string): Promise<boolean> {
    const { error } = await this.supabase
      .storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    // Delete metadata
    const { error: metadataError } = await this.supabase
      .from('file_metadata')
      .delete()
      .eq('file_path', filePath);

    if (metadataError) {
      console.error('Error deleting file metadata:', metadataError);
    }

    return true;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<FileMetadata | null> {
    const { data, error } = await this.supabase
      .from('file_metadata')
      .select()
      .eq('file_path', filePath)
      .single();

    if (error) {
      console.error('Error fetching file metadata:', error);
      return null;
    }

    return {
      size: data.size,
      mimeType: data.mime_type,
      filename: data.original_name,
      channelId: data.channel_id,
      groupId: data.group_id,
      messageId: data.message_id,
    };
  }

  /**
   * Get channel attachments
   */
  async getChannelAttachments(channelId: string): Promise<FileMetadata[]> {
    const { data, error } = await this.supabase
      .from('file_metadata')
      .select()
      .eq('channel_id', channelId)
      .eq('bucket', BUCKETS.ATTACHMENTS)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching channel attachments:', error);
      return [];
    }

    return data.map(item => ({
      size: item.size,
      mimeType: item.mime_type,
      filename: item.original_name,
      channelId: item.channel_id,
      groupId: item.group_id,
      messageId: item.message_id,
    }));
  }

  /**
   * Get message attachments
   */
  async getMessageAttachments(messageId: string): Promise<FileMetadata[]> {
    const { data, error } = await this.supabase
      .from('file_metadata')
      .select()
      .eq('message_id', messageId)
      .eq('bucket', BUCKETS.ATTACHMENTS)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching message attachments:', error);
      return [];
    }

    return data.map(item => ({
      size: item.size,
      mimeType: item.mime_type,
      filename: item.original_name,
      channelId: item.channel_id,
      groupId: item.group_id,
      messageId: item.message_id,
    }));
  }
}

// Export a singleton instance
export const storageService = new StorageService();