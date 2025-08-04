import { Button } from "./button";
import { IoRefresh } from "react-icons/io5";
import { cn } from "~/lib/utils";

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function RefreshButton({
  onClick,
  isLoading = false,
  className,
  size = "md",
}: RefreshButtonProps) {
  const sizeClasses = {
    sm: "h-11 w-11 min-h-[44px] min-w-[44px]",
    md: "h-12 w-12 min-h-[44px] min-w-[44px]",
    lg: "h-14 w-14 min-h-[44px] min-w-[44px]",
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        "rounded-full transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        className,
      )}
      title="Refresh data"
    >
      <IoRefresh className={cn("h-4 w-4", isLoading && "animate-spin")} />
    </Button>
  );
}
