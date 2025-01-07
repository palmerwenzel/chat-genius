import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CodeProps } from 'react-markdown/lib/ast-to-react';

interface MessageContentProps {
  content: string;
  type: 'text' | 'code';
}

export function MessageContent({ content, type }: MessageContentProps) {
  if (type === 'code') {
    return (
      <div className="font-mono bg-muted rounded-md p-4 overflow-x-auto">
        <SyntaxHighlighter
          language="typescript"
          style={vscDarkPlus}
          customStyle={{ margin: 0, background: 'transparent' }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-sm dark:prose-invert max-w-none"
      components={{
        code({ inline, className, children }: CodeProps) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              language={match[1]}
              style={vscDarkPlus}
              customStyle={{ margin: 0 }}
              PreTag="div"
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
} 