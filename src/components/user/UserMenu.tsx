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
import { StatusSelector } from "@/components/presence/StatusSelector";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  expanded?: boolean;
}

export function UserMenu({ expanded = true }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <div 
        role="button" 
        className="focus:outline-none cursor-pointer w-full"
        onClick={() => setIsMenuOpen(true)}
      >
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors w-full",
          expanded ? "px-4" : "justify-center"
        )}>
          <div className="relative">
            <Avatar className="h-10 w-10 transition-all">
              {user.user_metadata.avatar_url ? (
                <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.name} />
              ) : (
                <AvatarFallback>
                  {user.user_metadata.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div 
              className="absolute -bottom-0.5 -right-0.5"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
              }}
            >
              <StatusSelector size="md" />
            </div>
          </div>
          <div className={cn(
            "flex flex-col text-left transition-all duration-300 min-w-0",
            expanded ? "opacity-100 flex-1" : "opacity-0 w-0"
          )}>
            <div className="flex items-center min-w-0">
              <span className="truncate font-medium">
                {user.user_metadata.name || user.email?.split('@')[0]}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
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