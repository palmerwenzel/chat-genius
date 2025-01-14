import type { Database } from '@/types/supabase';

export const BUCKETS = {
  ATTACHMENTS: 'attachments',
  AVATARS: 'avatars',
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

export type FileMetadata = Database['public']['Tables']['file_metadata']['Row'];
export type FileMetadataInsert = Database['public']['Tables']['file_metadata']['Insert'];

export interface FileInfo {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  filePath: string;
  uploadedBy: string;
  createdAt: string;
}

export interface UploadMetadata {
  name: string;
  size: number;
  mimeType: string;
  channelId?: string;
  groupId?: string;
  messageId?: string;
} 