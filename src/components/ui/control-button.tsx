import { Button } from "./button";
import { type ReactNode } from "react";

interface ControlButtonProps {
  onClick: () => void;
  children: ReactNode;
  size?: "small" | "large";
  variant?: "playback" | "navigation";
  className?: string;
}

export function ControlButton({
  onClick,
  children,
  size = "large",
  variant = "navigation",
  className = "",
}: ControlButtonProps) {
  const baseClasses =
    "border border-stone-300 bg-stone-50 shadow-sm transition-all duration-200 hover:bg-stone-200 hover:shadow-md hover:scale-105 active:scale-95 dark:border-stone-600 dark:bg-stone-700 dark:hover:bg-stone-600";

  const sizeClasses = {
    small: "h-10 w-10 rounded-full",
    large: "h-12 w-12 rounded-xl sm:h-14 sm:w-14",
  };

  const variantClasses = {
    playback: "rounded-full",
    navigation: "rounded-xl",
  };

  const iconSizeClasses = {
    small: "text-lg text-stone-700 dark:text-stone-200",
    large: "text-xl text-stone-700 sm:text-2xl dark:text-stone-200",
  };

  return (
    <Button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      variant="ghost"
      onClick={onClick}
    >
      <span className={iconSizeClasses[size]}>{children}</span>
    </Button>
  );
}
