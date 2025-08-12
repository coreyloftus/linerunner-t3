"use client";

import { IoMenu } from "react-icons/io5";
import { Button } from "./ui/button";

interface SidebarToggleProps {
  onToggle: () => void;
  isOpen: boolean;
  className?: string;
}

export function SidebarToggle({
  onToggle,
  isOpen,
  className = "",
}: SidebarToggleProps) {
  return (
    <Button
      onClick={onToggle}
      className={`h-full w-full touch-manipulation rounded-lg bg-transparent p-0 text-stone-700 transition-colors duration-200 hover:bg-stone-200 dark:text-stone-200 dark:hover:bg-stone-700 ${className}`}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      variant="ghost"
    >
      <IoMenu className={`h-5 w-5 transition-all duration-300`} />
    </Button>
  );
}
