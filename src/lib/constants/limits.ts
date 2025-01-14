// Rate limits per minute
export const RATE_LIMITS = {
  messages: {
    create: Number(process.env.RATE_LIMIT_MESSAGES_CREATE) || 60,    // 1 message per second
    update: Number(process.env.RATE_LIMIT_MESSAGES_UPDATE) || 30,    // 1 update per 2 seconds
    delete: Number(process.env.RATE_LIMIT_MESSAGES_DELETE) || 30,    // 1 delete per 2 seconds
  },
  channels: {
    create: Number(process.env.RATE_LIMIT_CHANNELS_CREATE) || 10,    // 10 channels per minute
    update: Number(process.env.RATE_LIMIT_CHANNELS_UPDATE) || 30,    // 1 update per 2 seconds
    delete: Number(process.env.RATE_LIMIT_CHANNELS_DELETE) || 10,    // 10 deletes per minute
  },
  reactions: {
    create: Number(process.env.RATE_LIMIT_REACTIONS_CREATE) || 120,  // 2 reactions per second
    delete: Number(process.env.RATE_LIMIT_REACTIONS_DELETE) || 120,  // 2 reaction removals per second
  },
  files: {
    create: Number(process.env.RATE_LIMIT_FILES_UPLOAD) || 30,      // 1 upload per 2 seconds
    delete: Number(process.env.RATE_LIMIT_FILES_DELETE) || 30,      // 1 delete per 2 seconds
  },
} as const;

// Storage quotas in bytes
export const STORAGE_QUOTAS = {
  attachments: Number(process.env.STORAGE_QUOTA_ATTACHMENTS) || 1024 * 1024 * 1024,  // 1GB per user
  avatars: Number(process.env.STORAGE_QUOTA_AVATARS) || 10 * 1024 * 1024,            // 10MB per user
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;
export type RateLimitAction = 'create' | 'update' | 'delete';
export type StorageQuotaKey = keyof typeof STORAGE_QUOTAS; 