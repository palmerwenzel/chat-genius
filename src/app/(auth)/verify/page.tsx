'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyPage() {
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