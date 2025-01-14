import { Register } from "@/components/auth/register";
import { Metadata } from "next";

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
      <Register searchParams={searchParams} />
    </main>
  );
} 