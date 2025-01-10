import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Crown, Shield } from "lucide-react";

interface Member {
  id: string;
  name: string;
  avatar?: string;
  role: "owner" | "admin" | "member";
  status?: "online" | "offline" | "idle";
}

interface MemberListProps {
  members: Member[];
}

export function MemberList({ members }: MemberListProps) {
  const getRoleIcon = (role: Member["role"]) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No members in this channel
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.name[0]}</AvatarFallback>
              </Avatar>
              {member.status && (
                <div
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                    member.status === "online"
                      ? "bg-green-500"
                      : member.status === "idle"
                      ? "bg-yellow-500"
                      : "bg-gray-500"
                  }`}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{member.name}</span>
              {getRoleIcon(member.role)}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Message</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Change Role</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Remove from Channel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
} 