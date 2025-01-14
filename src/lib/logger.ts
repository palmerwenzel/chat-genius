type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Type for any valid JSON value
type JsonValue = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

interface LogMetadata {
  [key: string]: JsonValue;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
    code?: string | number;
    details?: JsonValue;
  };
  metadata?: LogMetadata;
}

export const logger = {
  error: (context: string, error: unknown, metadata?: LogMetadata) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      context,
      message: error instanceof Error ? error.message : 'An error occurred',
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as { code?: string | number }).code,
        details: (error as { details?: JsonValue }).details
      } : {
        message: String(error)
      },
      metadata
    };

    // In development, show full error details
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${entry.context}] ${entry.message}`, {
        error: entry.error,
        metadata: entry.metadata
      });
    } else {
      // In production, log structured data but omit sensitive details
      console.error(JSON.stringify({
        ...entry,
        error: {
          name: entry.error?.name,
          message: entry.error?.message,
          code: entry.error?.code
        }
      }));
    }
  },

  warn: (context: string, message: string, metadata?: LogMetadata) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      context,
      message,
      metadata
    };
    console.warn(`[${entry.context}] ${entry.message}`, entry.metadata);
  },

  info: (context: string, message: string, metadata?: LogMetadata) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      context,
      message,
      metadata
    };
    console.info(`[${entry.context}] ${entry.message}`, entry.metadata);
  },

  debug: (context: string, message: string, metadata?: LogMetadata) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      context,
      message,
      metadata
    };
    console.debug(`[${entry.context}] ${entry.message}`, entry.metadata);
  }
}; 