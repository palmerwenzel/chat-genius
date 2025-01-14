'use client';

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { StatusSelector } from "@/components/presence/status-selector";
import { cn } from "@/lib/utils";
import type { UserProfile } from './actions';

interface UserMenuClientProps {
  expanded?: boolean;
  initialData: UserProfile | null;
}

export function UserMenuClient({ expanded = true, initialData }: UserMenuClientProps) {
  const { signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  if (!initialData) return null;

  const displayName = initialData.name || initialData.email?.split('@')[0];
  const initial = displayName?.[0]?.toUpperCase();

  return (
    <div className="relative">
      <div 
        role="button" 
        className="focus:outline-none cursor-pointer w-full"
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('.status-selector')) {
            setIsMenuOpen(true);
          }
        }}
      >
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors w-full",
          expanded ? "px-4" : "justify-center"
        )}>
          <div className="relative">
            <Avatar className="h-10 w-10 transition-all">
              {initialData.avatarUrl ? (
                <AvatarImage src={initialData.avatarUrl} alt={displayName || ''} />
              ) : (
                <AvatarFallback>
                  {initial}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 status-selector">
              <StatusSelector userId={initialData.id} />
            </div>
          </div>
          <div className={cn(
            "flex flex-col text-left transition-all duration-300 min-w-0",
            expanded ? "opacity-100 flex-1" : "opacity-0 w-0"
          )}>
            <div className="flex items-center min-w-0">
              <span className="truncate font-medium">
                {displayName}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {initialData.email}
            </span>
          </div>
        </div>
      </div>

      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <div className="sr-only" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 