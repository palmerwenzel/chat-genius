import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { SearchResult, Message, Channel } from '@/services/search';
import { enrichChannelData } from '@/services/search';
import { Command } from 'cmdk';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Hash, MessageCircle } from 'lucide-react';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'channel' | 'message';
  channelId?: string; // Only needed for message mode
  groupId?: string; // Add groupId prop
}

export function SearchDialog({ open, onOpenChange, mode, channelId, groupId }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [activeQuery, setActiveQuery] = React.useState('');

  // Search when query or filters change
  React.useEffect(() => {
    async function search() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          type: mode,
          ...(mode === 'message' && channelId && { channelId }),
          ...(groupId && { groupId }),
        });

        console.log('Making search request to:', `/api/search?${params}`);
        const response = await fetch(`/api/search?${params}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Search response error:', errorText);
          throw new Error(`Search failed: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        
        // Enrich results with channel data
        const enrichedResults = await Promise.all(
          data.results.map(async (result: SearchResult) => ({
            ...result,
            item: await enrichChannelData(result.item)
          }))
        );
        
        setResults(enrichedResults);
        setActiveQuery(debouncedQuery);
      } catch (error) {
        console.error('Search error details:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    if (!debouncedQuery) {
      setLoading(false);
      setResults([]);
      setActiveQuery('');
      return;
    }

    search();
  }, [debouncedQuery, mode, channelId, groupId]);

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'channel') {
      const channel = result.item as Channel;
      if (groupId) {
        router.push(`/chat/${groupId}/${channel.name}`);
      }
    } else {
      const message = result.item as Message & { channel?: Channel };
      if (message.channel && groupId) {
        router.push(`/chat/${groupId}/${message.channel.name}?message=${message.id}`);
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] gap-0 p-0 outline-none">
        <DialogHeader className="px-4 pb-4 pt-5">
          <DialogTitle>
            {mode === 'channel' ? 'Search Channels' : 'Search Messages'}
          </DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false} className="overflow-hidden rounded-t-none border-t">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder={mode === 'channel' ? "Search channels..." : "Search messages in this group..."}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="h-[400px] overflow-hidden">
            <Command.Empty className="py-6 text-center text-sm">
              {loading ? 'Searching...' : activeQuery ? 'No results found.' : 'Type to start searching...'}
            </Command.Empty>
            <ScrollArea className="h-full">
              {results.map((result) => (
                <Command.Item
                  key={`${result.type}-${result.item.id}`}
                  onSelect={() => handleSelect(result)}
                  className="px-4 py-2"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {result.type === 'channel' ? (
                        <>
                          <Hash className="h-4 w-4" />
                          <span className="font-medium">
                            {(result.item as Channel).name}
                          </span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-4 w-4" />
                          <span className="font-medium">
                            Message in #{(result.item as Message & { channel?: Channel }).channel?.name || 'unknown'}
                          </span>
                        </>
                      )}
                      <Badge variant="secondary" className="ml-auto">
                        {result.type}
                      </Badge>
                    </div>
                    <div
                      className="text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: result.highlight.replace(
                          /\*\*(.*?)\*\*/g,
                          '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
                        ),
                      }}
                    />
                  </div>
                </Command.Item>
              ))}
            </ScrollArea>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
} 