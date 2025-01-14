'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthService } from '@/services/auth';
import { handleSupabaseError } from '@/utils/supabase/helpers';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';

interface RegisterFormProps {
  className?: string;
}

/**
 * Client Component for handling user registration
 * Supports both email/password and OAuth providers
 */
export function RegisterForm({ className }: RegisterFormProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const authService = new AuthService(createBrowserSupabaseClient());
  const redirectTo = searchParams.get('redirectTo') || '/chat';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await authService.signUpWithEmail(email, password);
      setSuccess(true);
    } catch (error) {
      console.error('Registration error:', handleSupabaseError(error));
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithProvider(provider: 'github' | 'google') {
    setIsLoading(true);
    setError(null);

    try {
      await authService.signInWithProvider(provider, {
        redirectTo: window.location.origin + '/auth/callback?redirectTo=' + redirectTo
      });
    } catch (error) {
      console.error('OAuth error:', handleSupabaseError(error));
      setError('Failed to sign in with ' + provider);
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className={className}>
        <Alert>
          <AlertDescription>
            Registration successful! Please check your email to confirm your account.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => signInWithProvider('github')}
          disabled={isLoading}
        >
          GitHub
        </Button>
        <Button
          variant="outline"
          onClick={() => signInWithProvider('google')}
          disabled={isLoading}
        >
          Google
        </Button>
      </div>
    </div>
  );
} 