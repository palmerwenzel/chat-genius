import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Hash, User, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/use-debounce';
import { Database } from '@/types/supabase';

export type SearchResult = {
  id: string;
  type: 'channel' | 'user' | 'message' | 'file';
  title: string;
  subtitle: string;
  timestamp?: string;
  icon?: React.ReactNode;
};

type FilterType = 'all' | 'channel' | 'user' | 'message' | 'file';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultSelect: (result: SearchResult) => void;
}

export function SearchDialog({ open, onOpenChange, onResultSelect }: SearchDialogProps) {
  const [filter, setFilter] = React.useState<FilterType>('all');
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const [results, setResults] = React.useState<SearchResult[]>([]);

  React.useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Search channels
        const channelResults = filter === 'all' || filter === 'channel' 
          ? await supabase
              .from('channels')
              .select('id, name, description')
              .textSearch('name', debouncedQuery)
              .limit(5)
          : null;

        // Search users
        const userResults = filter === 'all' || filter === 'user'
          ? await supabase
              .from('profiles')
              .select('id, username, full_name')
              .textSearch('username', debouncedQuery)
              .limit(5)
          : null;

        // Search messages
        const messageResults = filter === 'all' || filter === 'message'
          ? await supabase
              .from('messages')
              .select(`
                id,
                content,
                channel_id,
                created_at,
                channels (
                  name
                )
              `)
              .textSearch('content', debouncedQuery)
              .limit(5)
          : null;

        const formattedResults: SearchResult[] = [
          ...(channelResults?.data?.map(channel => ({
            id: channel.id,
            type: 'channel' as const,
            title: `#${channel.name}`,
            subtitle: channel.description || 'No description',
            icon: <Hash className="h-4 w-4" />,
          })) || []),
          ...(userResults?.data?.map(user => ({
            id: user.id,
            type: 'user' as const,
            title: user.full_name || user.username,
            subtitle: `@${user.username}`,
            icon: <User className="h-4 w-4" />,
          })) || []),
          ...(messageResults?.data?.map(message => ({
            id: message.id,
            type: 'message' as const,
            title: message.content.slice(0, 100),
            subtitle: `in #${message.channels?.name || 'unknown channel'}`,
            timestamp: new Date(message.created_at).toLocaleTimeString(),
            icon: <MessageSquare className="h-4 w-4" />,
          })) || []),
        ];

        setResults(formattedResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery, filter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <div className="flex items-center border-b p-4">
          <div className="flex flex-1 items-center space-x-2">
            <Input
              className="flex-1"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="ml-2 flex items-center space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'channel' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('channel')}
            >
              Channels
            </Button>
            <Button
              variant={filter === 'user' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('user')}
            >
              Users
            </Button>
            <Button
              variant={filter === 'message' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('message')}
            >
              Messages
            </Button>
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  className={cn(
                    'w-full rounded-lg p-2 text-left hover:bg-accent',
                    'focus:bg-accent focus:outline-none'
                  )}
                  onClick={() => onResultSelect(result)}
                >
                  <div className="flex items-center">
                    <div className="mr-2">{result.icon}</div>
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate font-medium">{result.title}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        {result.subtitle}
                      </div>
                    </div>
                    {result.timestamp && (
                      <div className="ml-2 text-sm text-muted-foreground">
                        {result.timestamp}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="py-8 text-center text-muted-foreground">
              No results found.
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
} 