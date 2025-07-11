"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function DropdownMenu({
  children,
  trigger,
  className,
  align = "center",
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        className={cn(
          "focus-visible:ring-ring ring-offset-background inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        onClick={() => setOpen(!open)}
        type="button"
      >
        {trigger}
      </button>

      {open && (
        <div
          className={cn(
            "bg-popover text-popover-foreground absolute top-full z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
            align === "start" && "left-0",
            align === "center" && "left-1/2 -translate-x-1/2 transform",
            align === "end" && "right-0",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  disabled,
}: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors disabled:pointer-events-none disabled:opacity-50",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}
