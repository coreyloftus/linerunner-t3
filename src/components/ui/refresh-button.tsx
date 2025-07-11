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
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={isLoading}
      className={cn(sizeClasses[size], "rounded-full", className)}
      title="Refresh data"
    >
      <IoRefresh className={cn("h-4 w-4", isLoading && "animate-spin")} />
    </Button>
  );
}
