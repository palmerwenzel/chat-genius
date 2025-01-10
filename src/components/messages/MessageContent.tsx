import * as React from 'react';
import Image from 'next/image';
import { FileText } from 'lucide-react';

interface MessageContentProps {
  content: string;
  type: 'text' | 'code';
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
    size: number;
  }>;
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function MessageContent({ content, type, attachments }: MessageContentProps) {
  if (type === 'code') {
    return (
      <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
        <code>{content}</code>
      </pre>
    );
  }

  return (
    <div className="space-y-3">
      {/* Text content */}
      {content && <p className="whitespace-pre-wrap break-words">{content}</p>}

      {/* File attachments */}
      {attachments?.map((attachment, index) => {
        if (isImageUrl(attachment.url)) {
          return (
            <div key={index} className="relative group max-w-md">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Image
                  src={attachment.url}
                  alt={attachment.name}
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg border shadow-sm hover:brightness-95 transition-all cursor-pointer"
                />
              </a>
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {attachment.name} ({formatFileSize(attachment.size)})
              </div>
            </div>
          );
        }

        return (
          <a
            key={index}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg hover:bg-muted/70 transition-colors shadow-sm group"
          >
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
} 