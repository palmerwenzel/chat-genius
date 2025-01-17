export interface MessageMetadata {
  is_bot?: boolean;
  bot_number?: number;
  sender_name?: string;
  is_summary?: boolean;
  is_command_response?: boolean;
  type?: 'channel_message' | 'system_message' | 'command_response';
  [key: string]: string | number | boolean | undefined;
}

export interface RAGMessage {
  role: string;
  content: string;
  metadata: MessageMetadata;
  channel_id?: string;
  group_id?: string;
  sender_id?: string;
  created_at?: string;
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
  filter?: {
    channel_id?: string;
    group_id?: string;
    sender_id?: string;
  };
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