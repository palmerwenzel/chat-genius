import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { navigateToChannelByName } from '@/lib/client-navigation';

const supabase = createClientComponentClient<Database>();

interface CreateChannelForm {
  name: string;
  description?: string;
  isPrivate: boolean;
}

interface CreateChannelModalProps {
  groupId: string;
  groupName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channelId: string) => void;
}

export function CreateChannelModal({ groupId, groupName, open, onOpenChange, onChannelCreated }: CreateChannelModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const form = useForm<CreateChannelForm>({
    resolver: zodResolver(z.object({
      name: z.string()
        .min(2, 'Channel name must be at least 2 characters')
        .max(100, 'Channel name must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Channel name can only contain lowercase letters, numbers, and hyphens'),
      description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
      isPrivate: z.boolean().default(false),
    })),
    defaultValues: {
      name: '',
      description: '',
      isPrivate: false,
    },
  });

  const onSubmit = async (data: CreateChannelForm) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a channel.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if channel name exists in this group
      const { data: existingChannel } = await supabase
        .from('channels')
        .select('id')
        .eq('name', data.name)
        .eq('group_id', groupId)
        .single();

      if (existingChannel) {
        form.setError('name', {
          type: 'manual',
          message: 'Channel name already exists in this group'
        });
        return;
      }

      const { data: channel, error } = await supabase
        .from('channels')
        .insert({
          name: data.name,
          description: data.description || null,
          visibility: data.isPrivate ? 'private' : 'public',
          type: 'text',
          created_by: user.id,
          group_id: groupId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Channel created',
        description: `#${data.name} has been created successfully.`,
      });

      onChannelCreated?.(channel.id);
      onOpenChange(false);
      form.reset();
      
      // Navigate to the new channel using our navigation helper
      await navigateToChannelByName(groupName, data.name, router);
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to create channel. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Channel in {groupName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. general"
                      {...field}
                      onChange={(e) => {
                        // Convert to lowercase and replace spaces with hyphens
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Lowercase letters, numbers, and hyphens only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's this channel about?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Max 1000 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Private Channel</FormLabel>
                    <FormDescription>
                      Only invited members can view and join this channel.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Channel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 