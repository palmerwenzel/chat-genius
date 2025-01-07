import { Metadata } from "next";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata: Metadata = {
  title: "Profile - ChatGenius",
  description: "View and edit your profile",
};

export default function ProfilePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <ProfileForm />
    </div>
  );
} 