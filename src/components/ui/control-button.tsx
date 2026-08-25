import { Button } from "./button";
import { type ReactNode } from "react";

interface ControlButtonProps {
  onClick: () => void;
  children: ReactNode;
  size?: "small" | "large";
  variant?: "playback" | "navigation";
  className?: string;
  disabled?: boolean;
}

export function ControlButton({
  onClick,
  children,
  size = "large",
  variant = "navigation",
  className = "",
  disabled = false,
}: ControlButtonProps) {
  const baseClasses =
    "flex items-center justify-center border border-border bg-surface shadow-sm transition-all duration-200 hover:border-accent/50 hover:bg-accent-soft hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface disabled:active:scale-100";

  const sizeClasses = {
    small: "h-full min-h-full w-11 min-w-[52px] rounded-full xs:w-12",
    large:
      "h-full min-h-full flex-shrink-0 w-12 min-w-[52px] rounded-xl xs:w-12 sm:w-14 md:w-20",
  };

  const variantClasses = {
    playback: "rounded-full",
    navigation: "rounded-xl",
  };

  const iconSizeClasses = {
    small: "text-lg text-foreground/80 transition-colors duration-200",
    large:
      "text-xl text-foreground/80 xs:text-xl sm:text-2xl transition-colors duration-200",
  };

  return (
    <Button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      variant="ghost"
      size={undefined}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={iconSizeClasses[size]}>{children}</span>
    </Button>
  );
}
