import { getUserProfile } from './actions';
import { UserMenuClient } from './client';

interface UserMenuProps {
  expanded?: boolean;
}

export async function UserMenu({ expanded }: UserMenuProps) {
  const userData = await getUserProfile();
  
  return (
    <UserMenuClient 
      expanded={expanded} 
      initialData={userData}
    />
  );
} 