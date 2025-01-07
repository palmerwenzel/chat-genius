'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  onSubmit?: (data: {
    displayName: string;
    bio: string;
    theme: string;
  }) => void;
  onChangePicture?: () => void;
  isLoading?: boolean;
  defaultValues?: {
    displayName?: string;
    email?: string;
    bio?: string;
    theme?: string;
  };
}

export function ProfileForm({ onSubmit, onChangePicture, isLoading, defaultValues = {} }: ProfileFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit?.({
      displayName: formData.get('displayName') as string,
      bio: formData.get('bio') as string,
      theme: formData.get('theme') as string,
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>View and update your account information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                {/* Placeholder for avatar */}
                <span className="text-2xl">👤</span>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onChangePicture}
                disabled={isLoading}
              >
                Change Picture
              </Button>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="Your display name"
                  defaultValue={defaultValues.displayName}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  defaultValue={defaultValues.email}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  name="bio"
                  className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Tell us about yourself..."
                  defaultValue={defaultValues.bio}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preferences</h3>
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <select
                  id="theme"
                  name="theme"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  defaultValue={defaultValues.theme || "light"}
                  disabled={isLoading}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 