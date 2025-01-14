import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login/login-form";

export const metadata: Metadata = {
  title: "Login - ChatGenius",
  description: "Sign in to your account",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="container flex h-screen w-screen flex-col items-center justify-center">
      <LoginForm searchParams={searchParams} />
    </main>
  );
}