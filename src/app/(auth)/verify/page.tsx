'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VerifyPage() {
  const { user } = useAuth();
  const router = useRouter();

  // If user is already verified, redirect to chat
  useEffect(() => {
    if (user?.email_confirmed_at) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link. Please check your email to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Once you verify your email, you&apos;ll be able to access all features of ChatGenius.
            The verification link will expire in 24 hours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 