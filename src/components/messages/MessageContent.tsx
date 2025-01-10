import { FileText, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MessageContentProps {
  content: string;
  type: 'text' | 'code';
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

export function MessageContent({ content, type }: MessageContentProps) {
  if (type === 'code') {
    return (
      <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
        <code>{content}</code>
      </pre>
    );
  }

  // Check if content is a file URL
  if (content.startsWith('https://') && content.includes('/attachments/')) {
    const filename = content.split('/').pop() || 'file';
    
    // If it's an image, show image preview
    if (isImageUrl(content)) {
      return (
        <div className="max-w-sm">
          <Card className="overflow-hidden">
            <img 
              src={content} 
              alt={filename}
              className="w-full h-auto"
            />
            <div className="p-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <a 
                href={content} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline truncate"
              >
                {decodeURIComponent(filename)}
              </a>
            </div>
          </Card>
        </div>
      );
    }

    // For other files, show a download link
    return (
      <Card className="p-3 flex items-center gap-2 max-w-sm">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <a 
          href={content}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm hover:underline truncate"
        >
          {decodeURIComponent(filename)}
        </a>
      </Card>
    );
  }

  return <span className="whitespace-pre-wrap">{content}</span>;
} 