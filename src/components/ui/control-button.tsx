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
    "border-0 bg-white shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md active:bg-gray-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100";

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
    small: "text-lg text-gray-700 transition-colors duration-200",
    large:
      "text-xl text-gray-600 xs:text-xl sm:text-2xl transition-colors duration-200",
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
