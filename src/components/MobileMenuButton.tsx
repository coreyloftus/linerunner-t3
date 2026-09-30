"use client";

import { IoMenu } from "react-icons/io5";

interface MobileMenuButtonProps {
  onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      className="absolute left-2 top-2 z-30 flex h-10 w-10 touch-manipulation items-center justify-center rounded-full border border-border bg-surface-raised/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
    >
      <IoMenu className="h-5 w-5" />
    </button>
  );
}
