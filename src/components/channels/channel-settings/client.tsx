'use client';

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Hash, Shield, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { MemberManagement } from "../member-management";
import { updateChannel, deleteChannel } from "./actions";
import type { Database } from "@/types/supabase";

type Channel = Database['public']['Tables']['channels']['Row'];

interface ChannelSettingsClientProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel;
  currentUserId: string;
}

export function ChannelSettingsClient({ isOpen, onClose, channel, currentUserId }: ChannelSettingsClientProps) {
  const [name, setName] = React.useState(channel.name);
  const [description, setDescription] = React.useState(channel.description || '');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Reset form when channel changes
  React.useEffect(() => {
    setName(channel.name);
    setDescription(channel.description || '');
  }, [channel]);

  const handleUpdateChannel = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateChannel(channel.id, { name, description });
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Success',
        description: result.message,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!window.confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await deleteChannel(channel.id);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Success',
        description: result.message,
      });
      onClose();
      router.push('/chat');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. general"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel-description">Channel Description</Label>
                  <Input
                    id="channel-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description"
                  />
                </div>

                <Button 
                  className="w-full"
                  onClick={handleUpdateChannel}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Danger Zone</h4>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleDeleteChannel}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Channel
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="p-4 m-0">
              <MemberManagement 
                channelId={channel.id}
                currentUserId={currentUserId}
              />
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