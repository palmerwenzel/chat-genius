'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { cn } from '@/lib/utils';
import { SearchDialog } from './search-dialog';

interface SearchButtonProps {
  className?: string;
  mode: 'channel' | 'message';
  channelId?: string;
  groupId?: string;
  placeholder?: string;
}

export function SearchButton({ 
  className, 
  mode, 
  channelId, 
  groupId,
  placeholder 
}: SearchButtonProps) {
  const [open, setOpen] = React.useState(false);

  // Handle keyboard shortcut
  useHotkeys(['mod+k', '/'], (event: KeyboardEvent) => {
    event.preventDefault();
    setOpen(true);
  });

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground',
          className
        )}
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center">
          <Search className="mr-2 h-4 w-4" />
          {placeholder || (mode === 'channel' ? 'Search channels...' : 'Search messages...')}
        </span>
      </Button>
      <SearchDialog 
        open={open} 
        onOpenChange={setOpen} 
        mode={mode}
        channelId={channelId}
        groupId={groupId}
      />
    </>
  );
} 