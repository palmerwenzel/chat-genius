import { cn } from "@/lib/utils";
import styles from "./surface.module.css";

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Surface({ className, children, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        "relative isolate min-h-full",
        "before:absolute before:inset-0 before:z-[-1]",
        "after:absolute after:inset-0 after:z-[-1]",
        styles.Surface,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 