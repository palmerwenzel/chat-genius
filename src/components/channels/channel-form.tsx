'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { handleSupabaseError } from '@/utils/supabase/helpers';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { ChannelService } from '@/services/channels';
import { AuthService } from '@/services/auth';

interface ChannelFormProps {
  className?: string;
  onSuccess?: () => void;
}

/**
 * Client Component for creating a new channel
 */
export function ChannelForm({ className, onSuccess }: ChannelFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const supabase = createBrowserSupabaseClient();
  const channelService = new ChannelService(supabase);
  const authService = new AuthService(supabase);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate channel name
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Channel name is required');
      setIsLoading(false);
      return;
    }

    // Validate name format (alphanumeric with dashes)
    if (!/^[a-z0-9-]+$/.test(trimmedName)) {
      setError('Channel name can only contain lowercase letters, numbers, and dashes');
      setIsLoading(false);
      return;
    }

    try {
      // Get current user
      const session = await authService.getSession();
      if (!session?.user) {
        setError('You must be logged in to create a channel');
        return;
      }

      // Create channel
      const channel = await channelService.createChannel({
        name: trimmedName,
        description: description.trim() || null,
        created_by: session.user.id
      });

      // Reset form
      setName('');
      setDescription('');

      // Navigate to new channel
      router.push(`/chat/${channel.name}`);
      router.refresh();

      // Call success callback if provided
      onSuccess?.();
    } catch (error) {
      console.error('Channel creation error:', handleSupabaseError(error));
      setError('Failed to create channel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Channel Name</Label>
          <Input
            id="name"
            placeholder="general"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            disabled={isLoading}
            required
          />
          <p className="text-sm text-muted-foreground">
            Lowercase letters, numbers, and dashes only
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="What's this channel about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating channel...' : 'Create Channel'}
        </Button>
      </form>
    </div>
  );
} 