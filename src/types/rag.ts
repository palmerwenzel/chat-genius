export interface RAGMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    type?: string;
    sender?: string;
    topic?: string;
    timestamp?: string;
    [key: string]: string | undefined;
  };
}

export interface IndexRequest {
  messages: RAGMessage[];
}

export interface IndexResponse {
  status: 'success';
  message: string;
}

export interface SummaryRequest {
  messages: RAGMessage[];
  query?: string;
}

export interface SummaryResponse {
  summary: string;
}

export type RAGError = {
  detail: string;
}

export interface RAGLoadingState {
  isIndexing: boolean;
  isSummarizing: boolean;
  progress?: {
    total: number;
    current: number;
    message: string;
  };
}

export type RAGProgressCallback = (progress: RAGLoadingState['progress']) => void; 