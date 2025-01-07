'use client';

import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuth } from "@/stores/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { signUp, signInWithProvider } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (data.password !== data.confirmPassword) {
      setError(new Error("Passwords do not match"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signUp(data.email, data.password, { name: data.name });
      // After registration, redirect to verification page
      router.push('/verify');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthClick = async (provider: 'github' | 'google') => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithProvider(provider);
      // Note: Redirect is handled by the callback route
    } catch (err) {
      console.error('OAuth error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <RegisterForm 
        onSubmit={handleSubmit}
        onOAuthClick={handleOAuthClick}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
} 