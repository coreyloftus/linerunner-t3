"use client";

import { useContext } from "react";
import { IoMenu } from "react-icons/io5";
import { ScriptContext } from "~/app/context";
import { type AppMode } from "~/lib/app-mode";

interface MobileMenuButtonProps {
  onClick: () => void;
  mode: AppMode;
}

// Phone-only: opens the drawer, and names the current character and scene when the mode uses them
export function MobileMenuButton({ onClick, mode }: MobileMenuButtonProps) {
  const { selectedCharacter, selectedScene } = useContext(ScriptContext);
  const usesScene = mode === "runner";
  const label = [selectedCharacter, selectedScene].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={usesScene ? `Change scene: ${label || "none"}` : "Open menu"}
      className="absolute left-2 top-2 z-30 flex h-10 max-w-[calc(100%-4.5rem)] touch-manipulation items-center gap-2 rounded-full border border-border bg-surface-raised/80 px-3 text-sm text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
    >
      <IoMenu className="h-5 w-5 flex-shrink-0" />
      {usesScene && (
        <span className="truncate font-medium">{label || "Pick a scene"}</span>
      )}
    </button>
  );
}
