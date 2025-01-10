import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { SearchResult, Message, Channel } from '@/services/search';
import { Command } from 'cmdk';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Hash, MessageCircle } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'channel' | 'message';
  channelId?: string; // Only needed for message mode
}

type SearchType = 'all' | 'message' | 'channel';

export function SearchDialog({ open, onOpenChange, mode, channelId }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [activeQuery, setActiveQuery] = React.useState('');
  const [filters, setFilters] = React.useState({
    type: mode as SearchType,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // Search when query or filters change
  React.useEffect(() => {
    async function search() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          type: mode,
          ...(mode === 'message' && channelId && { channelId }),
          ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
          ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
        });

        console.log('Making search request to:', `/api/search?${params}`);
        const response = await fetch(`/api/search?${params}`);
        console.log('Search response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Search response error:', errorText);
          throw new Error(`Search failed: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Search results:', data);
        setResults(data.results);
        setActiveQuery(debouncedQuery);
      } catch (error) {
        console.error('Search error details:', {
          name: error instanceof Error ? error.name : 'Unknown error',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
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
  }, [debouncedQuery, filters, mode, channelId]);

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'channel') {
      const channel = result.item as Channel;
      router.push(`/chat/${channel.name}`);
    } else {
      const message = result.item as Message & { channel: Channel };
      router.push(`/chat/${message.channel.name}?message=${message.id}`);
    }
    onOpenChange(false);
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setFilters(f => ({
      ...f,
      startDate: range?.from,
      endDate: range?.to,
    }));
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
              placeholder={mode === 'channel' ? "Search channels..." : "Search messages in this channel..."}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          {mode === 'message' && (
            <div className="flex items-center gap-2 border-b px-4 py-2 h-12">
              <div className="ml-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={filters.startDate || filters.endDate ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'justify-start text-left font-normal',
                        !filters.startDate && !filters.endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? (
                        filters.endDate ? (
                          <>
                            {format(filters.startDate, 'LLL dd, y')} -{' '}
                            {format(filters.endDate, 'LLL dd, y')}
                          </>
                        ) : (
                          format(filters.startDate, 'LLL dd, y')
                        )
                      ) : (
                        'Date range'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={filters.startDate}
                      selected={{
                        from: filters.startDate,
                        to: filters.endDate,
                      }}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
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
                            Message in #{(result.item as Message).channel_id}
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