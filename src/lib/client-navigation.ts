'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { channelService } from '@/services/channel';
import { getChannelPath, getGroupPath, getChannelPathComponents } from './navigation';

interface NavigateToChannelOptions {
  replace?: boolean;
}

/**
 * Navigate to a channel using its ID
 */
export async function navigateToChannel(
  channelId: string,
  router: ReturnType<typeof useRouter>,
  options: NavigateToChannelOptions = {}
) {
  const path = await channelService.getChannelPath(channelId);
  if (!path) return false;

  if (options.replace) {
    router.replace(path);
  } else {
    router.push(path);
  }
  return true;
}

/**
 * Navigate to a channel using group name and channel name
 */
export async function navigateToChannelByName(
  groupName: string,
  channelName: string,
  router: ReturnType<typeof useRouter>,
  options: NavigateToChannelOptions = {}
) {
  const path = getChannelPath(groupName, channelName);
  
  if (options.replace) {
    router.replace(path);
  } else {
    router.push(path);
  }
  return true;
}

/**
 * Navigate to a group using its name
 */
export async function navigateToGroup(
  groupName: string,
  router: ReturnType<typeof useRouter>,
  options: NavigateToChannelOptions = {}
) {
  const path = getGroupPath(groupName);
  
  if (options.replace) {
    router.replace(path);
  } else {
    router.push(path);
  }
  return true;
}

/**
 * Hook to get current channel path components
 */
export function useChannelPath() {
  const pathname = usePathname();
  return pathname ? getChannelPathComponents(pathname) : null;
}

/**
 * Hook to get current channel ID
 */
export function useChannelId() {
  const pathname = usePathname();
  const [channelId, setChannelId] = useState<string | null>(null);

  useEffect(() => {
    const components = pathname ? getChannelPathComponents(pathname) : null;
    
    if (!components) {
      setChannelId(null);
      return;
    }
    
    channelService.getChannelFromPath(
      components.groupName,
      components.channelName
    ).then(channel => {
      setChannelId(channel?.id || null);
    });
  }, [pathname]);

  return channelId;
} 