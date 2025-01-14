'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DirectMessage {
  id: string;
  name: string;
  avatar_url?: string;
  status?: 'online' | 'offline' | 'idle';
}

interface DirectMessagesSectionProps {
  directMessages: DirectMessage[];
}

export function DirectMessagesSection({ directMessages }: DirectMessagesSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Direct Messages
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-4 w-4 hover:scale-110 transition-transform"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-1">
        {directMessages.map((dm) => (
          <Button
            key={dm.id}
            variant="ghost"
            className="w-full justify-start hover:bg-muted transition-colors duration-200"
            asChild
          >
            <Link href={`/chat/dm/${dm.id}`}>
              <div className="relative mr-2">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={dm.avatar_url} />
                  <AvatarFallback>{dm.name[0]}</AvatarFallback>
                </Avatar>
                <div className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background',
                  dm.status === 'online' ? 'bg-success' :
                  dm.status === 'idle' ? 'bg-warning' :
                  'bg-muted'
                )} />
              </div>
              {dm.name}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
} 