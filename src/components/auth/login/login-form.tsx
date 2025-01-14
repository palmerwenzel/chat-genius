'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { signInWithEmail, signInWithOAuth } from "@/app/(auth)/login/actions";

interface LoginFormProps {
  searchParams?: { error?: string };
}

export function LoginForm({ searchParams }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(
    searchParams?.error ? new Error(searchParams.error) : null
  );
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(formData: FormData) {
    try {
      setIsLoading(true);
      setError(null);
      const email = formData.get('email') as string;
      setEmail(email);
      const result = await signInWithEmail(formData);
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err as Error);
      if ((err as Error).message === "Email not confirmed") {
        setEmailSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleOAuthClick = async (provider: 'github' | 'google') => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithOAuth(provider);
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.data) {
        window.location.href = result.data;
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show confirmation message if user needs to verify email
  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a confirmation link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please check your email and click the confirmation link to continue.
              The link will expire in 24 hours.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setEmailSent(false)}
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Login to your ChatGenius account</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error.message === "Email not confirmed" 
                    ? "Please check your email and confirm your account."
                    : error.message}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthClick('github')}
            >
              <FaGithub className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthClick('google')}
            >
              <FaGoogle className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
        <div className="text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot your password?
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
} 