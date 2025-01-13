'use client';

import { LoginForm } from "@/components/auth/LoginForm";
import { AuthDebug } from "@/components/auth/AuthDebug";
import { useAuth } from "@/stores/auth";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Separate component to handle search params
function LoginContent() {
  const { signIn, signInWithProvider, user, initialized } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debug logging for auth state
  useEffect(() => {
    console.log('Auth State:', {
      initialized,
      user: user ? { 
        id: user.id,
        email: user.email,
        lastSignInAt: user.last_sign_in_at
      } : null,
    });
  }, [initialized, user]);

  // Handle redirect after successful auth
  useEffect(() => {
    if (!initialized) {
      console.log('Auth not yet initialized, waiting...');
      return;
    }
    
    if (!user) {
      console.log('No user found, staying on login page');
      return;
    }

    const redirectTo = searchParams.get('redirect') || '/chat';
    console.log('Auth initialized and user found, redirecting to:', redirectTo);
    
    // Use replace instead of push to prevent back button from returning to login
    router.replace(redirectTo);
  }, [user, router, searchParams, initialized]);

  const handleSubmit = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Attempting sign in...');
      await signIn(email, password);
      console.log('Sign in successful');
      // Redirect will be handled by the useEffect
    } catch (err) {
      console.error('Login error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthClick = async (provider: 'github' | 'google') => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Attempting ${provider} sign in...`);
      await signInWithProvider(provider);
      // Redirect is handled by the callback route
    } catch (err) {
      console.error('OAuth error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while auth is initializing
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <LoginForm 
        onSubmit={handleSubmit}
        onOAuthClick={handleOAuthClick}
        isLoading={isLoading}
        error={error}
      />
      <AuthDebug />
    </div>
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 