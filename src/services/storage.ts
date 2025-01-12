import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

// Bucket names
export const BUCKETS = {
  ATTACHMENTS: 'attachments',
  AVATARS: 'avatars',
} as const;

type BucketName = typeof BUCKETS[keyof typeof BUCKETS];
export interface FileMetadata {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  filePath: string;
  uploadedBy: string;
  createdAt: string;
}

class StorageService {
  private readonly supabase = createClientComponentClient<Database>();

  /**
   * Upload a file to a bucket
   */
  async uploadFile(
    bucket: string,
    file: File,
    metadata: {
      name: string;
      size: number;
      mimeType: string;
      channelId?: string;
      groupId?: string;
      messageId?: string;
    },
    userId: string
  ): Promise<string | null> {
    const storageKey = `${bucket}/${uuidv4()}-${metadata.name}`;

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from(bucket)
      .upload(storageKey, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    // Create metadata record
    const { error: metadataError } = await this.supabase
      .from('file_metadata')
      .insert({
        original_name: metadata.name,
        size: metadata.size,
        mime_type: metadata.mimeType,
        file_path: storageKey,
        bucket: bucket,
        uploaded_by: userId,
        channel_id: metadata.channelId,
        message_id: metadata.messageId
      });

    if (metadataError) {
      console.error('Error creating file metadata:', metadataError);
      // Clean up the uploaded file
      await this.supabase.storage
        .from(bucket)
        .remove([storageKey]);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(storageKey);

    return publicUrl;
  }

  /**
   * Delete a file from a bucket
   */
  async deleteFile(bucket: BucketName, storageKey: string): Promise<boolean> {
    const { error } = await this.supabase
      .storage
      .from(bucket)
      .remove([storageKey]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    // Delete metadata
    const { error: metadataError } = await this.supabase
      .from('file_metadata')
      .delete()
      .eq('storage_key', storageKey);

    if (metadataError) {
      console.error('Error deleting file metadata:', metadataError);
    }

    return true;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(storageKey: string): Promise<FileMetadata | null> {
    const { data, error } = await this.supabase
      .from('file_metadata')
      .select()
      .eq('storage_key', storageKey)
      .single();

    if (error) {
      console.error('Error fetching file metadata:', error);
      return null;
    }

    return {
      id: data.id,
      originalName: data.original_name,
      size: data.size,
      mimeType: data.mime_type,
      filePath: data.file_path,
      uploadedBy: data.uploaded_by,
      createdAt: data.created_at
    };
  }

  /**
   * Get channel attachments
   */
  async getChannelAttachments(channelId: string): Promise<FileMetadata[]> {
    const { data, error } = await this.supabase
      .from('file_metadata')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching channel attachments:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      originalName: item.original_name,
      size: item.size,
      mimeType: item.mime_type,
      filePath: item.file_path,
      uploadedBy: item.uploaded_by,
      createdAt: item.created_at
    }));
  }

  /**
   * Get message attachments
   */
  async getMessageAttachments(messageId: string): Promise<FileMetadata[]> {
    const { data, error } = await this.supabase
      .from('file_metadata')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching message attachments:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      originalName: item.original_name,
      size: item.size,
      mimeType: item.mime_type,
      filePath: item.file_path,
      uploadedBy: item.uploaded_by,
      createdAt: item.created_at
    }));
  }
}

// Export a singleton instance
export const storageService = new StorageService();