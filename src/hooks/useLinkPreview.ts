import { useState, useEffect } from "react";

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

interface LinkPreviewState {
  url: string;
  metadata?: LinkMetadata;
  isLoading: boolean;
  error?: string;
}

async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  // This would be replaced with your actual API endpoint
  const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch metadata');
  }
  return response.json();
}

export function useLinkPreview(content: string) {
  const [previews, setPreviews] = useState<LinkPreviewState[]>([]);

  useEffect(() => {
    // Simple URL regex - in production, use a more robust solution
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex) || [];
    
    // Reset previews if no URLs found
    if (urls.length === 0) {
      setPreviews([]);
      return;
    }

    // Initialize previews for each URL
    const initialPreviews = urls.map(url => ({
      url,
      isLoading: true
    }));
    setPreviews(initialPreviews);

    // Fetch metadata for each URL
    urls.forEach(async (url, index) => {
      try {
        const metadata = await fetchLinkMetadata(url);
        setPreviews(current =>
          current.map((preview, i) =>
            i === index
              ? { ...preview, metadata, isLoading: false }
              : preview
          )
        );
      } catch (error) {
        setPreviews(current =>
          current.map((preview, i) =>
            i === index
              ? { 
                  ...preview, 
                  error: error instanceof Error ? error.message : 'Failed to load preview',
                  isLoading: false 
                }
              : preview
          )
        );
      }
    });
  }, [content]);

  return previews;
} 