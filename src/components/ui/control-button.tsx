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
    "border-0 bg-white shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md";

  const sizeClasses = {
    small: "h-10 w-10 rounded-full",
    large: "h-12 w-12 rounded-xl sm:h-14 sm:w-14",
  };

  const variantClasses = {
    playback: "rounded-full",
    navigation: "rounded-xl",
  };

  const iconSizeClasses = {
    small: "text-lg text-gray-700",
    large: "text-xl text-gray-600 sm:text-2xl",
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
