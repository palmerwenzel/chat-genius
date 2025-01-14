import { TypingIndicator as TypingIndicatorClient } from './client';
import { updateTypingStatus } from '../actions';

interface TypingIndicatorProps {
  channelId: string;
}

export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  return (
    <TypingIndicatorClient
      channelId={channelId}
      onTypingChange={updateTypingStatus}
    />
  );
} 