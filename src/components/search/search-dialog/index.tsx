import { SearchButton } from './search-button';

interface SearchProps {
  mode: 'channel' | 'message';
  channelId?: string;
  groupId?: string;
  className?: string;
  placeholder?: string;
}

export async function Search({ 
  mode, 
  channelId, 
  groupId,
  className,
  placeholder 
}: SearchProps) {
  return (
    <SearchButton
      mode={mode}
      channelId={channelId}
      groupId={groupId}
      className={className}
      placeholder={placeholder}
    />
  );
} 