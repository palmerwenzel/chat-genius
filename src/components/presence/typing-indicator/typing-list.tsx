'use client';

interface TypingListProps {
  users: string[];
}

export function TypingList({ users }: TypingListProps) {
  if (!users.length) return null;

  return (
    <div className="text-sm text-muted-foreground">
      {users.length === 1 ? (
        <>{users[0]} is typing...</>
      ) : users.length === 2 ? (
        <>{users[0]} and {users[1]} are typing...</>
      ) : (
        <>{users[0]}, {users[1]} and {users.length - 2} others are typing...</>
      )}
    </div>
  );
} 