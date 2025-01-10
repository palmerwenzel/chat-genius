import * as React from 'react';
import Image from 'next/image';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

interface LinkPreviewProps {
  url: string;
  metadata?: LinkMetadata;
  isLoading?: boolean;
}

export function LinkPreview({ url, metadata, isLoading }: LinkPreviewProps) {
  if (isLoading) {
    return (
      <Card className="p-3 flex gap-3">
        <Skeleton className="h-16 w-16 rounded-md flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-full" />
        </div>
      </Card>
    );
  }

  if (!metadata) {
    return (
      <Card className="p-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          {url}
        </a>
      </Card>
    );
  }

  const { title, description, image, favicon } = metadata;

  return (
    <Card className="overflow-hidden">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-3 p-3 hover:bg-muted/50 transition-colors"
      >
        {image && (
          <div className="flex-shrink-0">
            <Image
              src={image}
              alt={title || "Link preview"}
              width={64}
              height={64}
              className="object-cover rounded-md"
            />
          </div>
        )}
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            {favicon && (
              <Image
                src={favicon}
                alt=""
                width={16}
                height={16}
              />
            )}
            <h4 className="font-medium text-sm truncate">
              {title || url}
            </h4>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            {new URL(url).hostname}
          </div>
        </div>
      </a>
    </Card>
  );
} 