import { redirect } from 'next/navigation';

/**
 * Extract channel path components from the current URL
 */
export function getChannelPathComponents(pathname: string): { groupName: string; channelName: string } | null {
  const match = pathname.match(/^\/chat\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  return {
    groupName: match[1],
    channelName: match[2]
  };
}

/**
 * Get the path to a channel using group name and channel name
 */
export function getChannelPath(groupName: string, channelName: string) {
  return `/chat/${groupName}/${channelName}`;
}

/**
 * Get the path to a group using its name
 */
export function getGroupPath(groupName: string) {
  return `/chat/${groupName}`;
}

/**
 * Server-side redirect to a channel
 */
export function redirectToChannel(groupName: string, channelName: string) {
  redirect(getChannelPath(groupName, channelName));
}

/**
 * Server-side redirect to a group
 */
export function redirectToGroup(groupName: string) {
  redirect(getGroupPath(groupName));
} 