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
    "border border-stone-300 bg-stone-50 shadow-sm transition-all duration-200 hover:bg-stone-200 hover:shadow-md hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-stone-50 disabled:active:scale-100 dark:border-stone-600 dark:bg-stone-700 dark:hover:bg-stone-600";

  const sizeClasses = {
    small: "h-11 w-11 min-h-[44px] min-w-[44px] rounded-full xs:h-12 xs:w-12",
    large:
      "h-12 w-12 min-h-[44px] min-w-[44px] rounded-xl xs:h-12 xs:w-12 sm:h-14 sm:w-14",
  };

  const variantClasses = {
    playback: "rounded-full",
    navigation: "rounded-xl",
  };

  const iconSizeClasses = {
    small: "text-lg text-stone-700 transition-colors duration-200 dark:text-stone-200",
    large:
      "text-xl text-stone-700 xs:text-xl sm:text-2xl transition-colors duration-200 dark:text-stone-200",
  };

  return (
    <Button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
    >
      <span className={iconSizeClasses[size]}>{children}</span>
    </Button>
  );
}
