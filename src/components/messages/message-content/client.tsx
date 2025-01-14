"use client";

import * as React from 'react';
import Image from 'next/image';
import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { Components } from 'react-markdown';

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
}

interface MessageContentProps {
  content: string;
  type: 'text';
  metadata?: {
    files?: Array<{
      name: string;
      size: number;
      type: string;
      url?: string;
    }>;
  };
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

export function MessageContent({ content, metadata }: MessageContentProps) {
  // Define markdown components with proper types
  const components: Components = {
    // Override default link to open in new tab
    a: (props) => (
      <a target="_blank" rel="noopener noreferrer" {...props} />
    ),
    // Style code blocks with syntax highlighting
    code: ({ className, children, ...props }: CodeProps) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const isInline = !className;

      if (isInline) {
        return (
          <code className="bg-muted px-1.5 py-0.5 rounded-md" {...props}>
            {children}
          </code>
        );
      }

      return (
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            background: 'var(--muted)',
          }}
          PreTag="div"
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    },
    // Style code block container
    pre: ({ children }) => (
      <pre className="not-prose bg-muted rounded-lg overflow-hidden">
        {children}
      </pre>
    )
  };

  return (
    <div className="space-y-3">
      {/* Text content with Markdown support */}
      {content && (
        <ReactMarkdown
          className="prose prose-sm dark:prose-invert max-w-none"
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      )}

      {/* File attachments */}
      {metadata?.files?.map((file, index) => {
        if (file.url && isImageUrl(file.url)) {
          return (
            <div key={index} className="relative group max-w-md">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Image
                  src={file.url}
                  alt={file.name}
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg border shadow-sm hover:brightness-95 transition-all cursor-pointer"
                />
              </a>
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {file.name} ({formatFileSize(file.size)})
              </div>
            </div>
          );
        }

        if (file.url) {
          return (
            <a
              key={index}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg hover:bg-muted/70 transition-colors shadow-sm group"
            >
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </a>
          );
        }

        return null;
      })}
    </div>
  );
} 