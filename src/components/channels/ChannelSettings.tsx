import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Hash, Users, Shield, Trash2 } from "lucide-react";
import { MemberList } from "./MemberList";

interface Member {
  id: string;
  name: string;
  avatar?: string;
  role: "owner" | "admin" | "member";
  status?: "online" | "offline" | "idle";
}

interface ChannelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  channel: {
    id: string;
    name: string;
    topic?: string;
    isPrivate?: boolean;
    members: Member[];
  };
}

export function ChannelSettings({ isOpen, onClose, channel }: ChannelSettingsProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <SheetTitle>{channel.name}</SheetTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="general" className="flex-1">
          <div className="border-b px-4">
            <TabsList className="border-0">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="general" className="p-4 m-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="channel-name">Channel Name</Label>
                  <Input
                    id="channel-name"
                    value={channel.name}
                    placeholder="e.g. general"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel-topic">Channel Topic</Label>
                  <Input
                    id="channel-topic"
                    value={channel.topic}
                    placeholder="Add a topic"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Danger Zone</h4>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Channel
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="p-4 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Members</h4>
                  <Button size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Add Members
                  </Button>
                </div>
                <MemberList channelId={channel.id} members={channel.members} />
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="p-4 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Permissions</h4>
                  <Button size="sm" variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Add Role
                  </Button>
                </div>
                {/* TODO: Day 6-7 - Implement permission management
                  - Role-based access control
                  - Permission inheritance
                  - Custom role creation
                  - Permission overrides
                */}
                <div className="text-sm text-muted-foreground">
                  Permission management will be available in a future update.
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
} 