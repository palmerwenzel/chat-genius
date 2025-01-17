import { 
  RAGMessage, 
  IndexResponse, 
  SummaryResponse, 
  RAGError,
  RAGLoadingState,
  RAGProgressCallback
} from '@/types/rag';
import { create } from 'zustand';

// Check for environment variables with NEXT_PUBLIC_ prefix
if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_RAG_SERVICE_URL) {
  console.error('Missing NEXT_PUBLIC_RAG_SERVICE_URL environment variable');
}

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY) {
  console.error('Missing NEXT_PUBLIC_RAG_SERVICE_API_KEY environment variable');
}

const RAG_SERVICE_URL = process.env.NEXT_PUBLIC_RAG_SERVICE_URL;
const RAG_SERVICE_API_KEY = process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY;

// Create a Zustand store for loading states
interface RAGStore extends RAGLoadingState {
  setIndexing: (isIndexing: boolean) => void;
  setSummarizing: (isSummarizing: boolean) => void;
  setProgress: (progress: RAGLoadingState['progress']) => void;
}

export const useRAGStore = create<RAGStore>((set) => ({
  isIndexing: false,
  isSummarizing: false,
  progress: undefined,
  setIndexing: (isIndexing) => set({ isIndexing }),
  setSummarizing: (isSummarizing) => set({ isSummarizing }),
  setProgress: (progress) => set({ progress }),
}));

async function fetchRAG<TRequest, TResponse>(
  endpoint: string, 
  body: TRequest, 
  onProgress?: RAGProgressCallback
): Promise<TResponse> {
  // Simulate progress for long-running operations
  if (onProgress) {
    onProgress({
      total: 100,
      current: 0,
      message: 'Starting request...',
    });
  }

  const response = await fetch(`${RAG_SERVICE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RAG_SERVICE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (onProgress) {
    onProgress({
      total: 100,
      current: 50,
      message: 'Processing response...',
    });
  }

  if (!response.ok) {
    const error: RAGError = await response.json();
    throw new Error(error.detail || 'Failed to fetch from RAG service');
  }

  const data = await response.json();

  if (onProgress) {
    onProgress({
      total: 100,
      current: 100,
      message: 'Complete',
    });
  }

  return data;
}

export const ragService = {
  /**
   * Index messages in the RAG service for future retrieval
   */
  async indexMessages(messages: RAGMessage[]): Promise<IndexResponse> {
    const store = useRAGStore.getState();
    store.setIndexing(true);
    store.setProgress({
      total: messages.length,
      current: 0,
      message: 'Starting indexing...',
    });

    try {
      const response = await fetchRAG<{ messages: RAGMessage[] }, IndexResponse>(
        '/api/index',
        { messages },
        (progress) => store.setProgress(progress)
      );

      store.setProgress({
        total: messages.length,
        current: messages.length,
        message: 'Indexing complete',
      });

      return response;
    } finally {
      store.setIndexing(false);
      // Clear progress after a delay
      setTimeout(() => store.setProgress(undefined), 2000);
    }
  },

  /**
   * Generate a summary of messages using the RAG service
   */
  async generateSummary(messages: RAGMessage[], query?: string): Promise<SummaryResponse> {
    const store = useRAGStore.getState();
    store.setSummarizing(true);
    store.setProgress({
      total: 100,
      current: 0,
      message: 'Starting summary generation...',
    });

    try {
      const response = await fetchRAG<{ messages: RAGMessage[]; query?: string }, SummaryResponse>(
        '/api/summary',
        { messages, query },
        (progress) => store.setProgress(progress)
      );

      store.setProgress({
        total: 100,
        current: 100,
        message: 'Summary complete',
      });

      return response;
    } finally {
      store.setSummarizing(false);
      // Clear progress after a delay
      setTimeout(() => store.setProgress(undefined), 2000);
    }
  },
}; 