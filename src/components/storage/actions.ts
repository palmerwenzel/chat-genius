'use server';

import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import type { BucketName, FileInfo, UploadMetadata } from '@/types/storage';

export async function uploadFile(
  bucket: string,
  file: File,
  metadata: UploadMetadata,
  userId: string
): Promise<string | null> {
  const supabase = await getSupabaseServer();
  const storageKey = `${bucket}/${uuidv4()}-${metadata.name}`;

  try {
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storageKey, file);

    if (uploadError) throw uploadError;

    // Create metadata record
    const { error: metadataError } = await supabase
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
      // Clean up the uploaded file
      await supabase.storage
        .from(bucket)
        .remove([storageKey]);
      throw metadataError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(storageKey);

    return publicUrl;
  } catch (error) {
    logger.error('storage.uploadFile', error, { bucket, metadata });
    return null;
  }
}

export async function deleteFile(bucket: BucketName, storageKey: string): Promise<boolean> {
  const supabase = await getSupabaseServer();

  try {
    // Delete from storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([storageKey]);

    if (error) throw error;

    // Delete metadata
    const { error: metadataError } = await supabase
      .from('file_metadata')
      .delete()
      .eq('storage_key', storageKey);

    if (metadataError) {
      logger.error('storage.deleteMetadata', metadataError, { storageKey });
    }

    return true;
  } catch (error) {
    logger.error('storage.deleteFile', error, { bucket, storageKey });
    return false;
  }
}

export async function getFileMetadata(storageKey: string): Promise<FileInfo | null> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('file_metadata')
      .select()
      .eq('storage_key', storageKey)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      originalName: data.original_name,
      size: data.size,
      mimeType: data.mime_type,
      filePath: data.file_path,
      uploadedBy: data.uploaded_by,
      createdAt: data.created_at
    };
  } catch (error) {
    logger.error('storage.getMetadata', error, { storageKey });
    return null;
  }
}

export async function getChannelAttachments(channelId: string): Promise<FileInfo[]> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      originalName: item.original_name,
      size: item.size,
      mimeType: item.mime_type,
      filePath: item.file_path,
      uploadedBy: item.uploaded_by,
      createdAt: item.created_at
    }));
  } catch (error) {
    logger.error('storage.getChannelAttachments', error, { channelId });
    return [];
  }
}

export async function getMessageAttachments(messageId: string): Promise<FileInfo[]> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      originalName: item.original_name,
      size: item.size,
      mimeType: item.mime_type,
      filePath: item.file_path,
      uploadedBy: item.uploaded_by,
      createdAt: item.created_at
    }));
  } catch (error) {
    logger.error('storage.getMessageAttachments', error, { messageId });
    return [];
  }
}

export async function uploadAvatar(
  file: File,
  userId: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await getSupabaseServer();
  const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;

  try {
    // Maximum file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Revalidate profile pages
    revalidatePath('/profile');
    revalidatePath('/chat');

    return { url: publicUrl };
  } catch (error) {
    logger.error('storage.uploadAvatar', error, { userId });
    return { error: error instanceof Error ? error.message : 'Failed to upload avatar' };
  }
} 