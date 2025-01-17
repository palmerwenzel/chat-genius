'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface JoinGroupDialogProps {
  group: {
    id: string;
    name: string;
    display_name: string;
    visibility: 'public' | 'private';
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinGroupDialog({ group, open, onOpenChange }: JoinGroupDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleJoin = async () => {
    if (!group) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${group.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join group');
      }

      toast({
        title: "Success",
        description: `You have joined ${group.display_name}`,
      });

      onOpenChange(false);
      router.push(`/chat/${group.name}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to join group',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join {group?.display_name}</DialogTitle>
          <DialogDescription>
            {group?.visibility === 'private' 
              ? "This is a private group. You'll need an invitation to join."
              : "Join this group to participate in discussions and view messages."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={isLoading || group?.visibility === 'private'}>
            {isLoading ? "Joining..." : "Join Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 