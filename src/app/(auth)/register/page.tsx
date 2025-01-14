import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register";

export const metadata: Metadata = {
  title: "Register - ChatGenius",
  description: "Create a new account",
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="container flex h-screen w-screen flex-col items-center justify-center">
      <RegisterForm searchParams={searchParams} />
    </main>
  );
} 