'use client';

import { useRAGStore } from '@/services/rag';
import { Progress } from './progress';

export function RAGProgress() {
  const { isIndexing, isSummarizing, progress } = useRAGStore();

  if (!isIndexing && !isSummarizing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg shadow-lg border">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium leading-none tracking-tight">
            {isIndexing ? 'Indexing Messages' : 'Generating Summary'}
          </h4>
          {progress && (
            <span className="text-xs text-muted-foreground">
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          )}
        </div>
        
        {progress && (
          <>
            <Progress 
              value={(progress.current / progress.total) * 100} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {progress.message}
            </p>
          </>
        )}
      </div>
    </div>
  );
} 