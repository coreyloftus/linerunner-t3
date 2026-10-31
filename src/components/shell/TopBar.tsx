"use client";

import { useContext } from "react";
import { LuPanelLeft } from "react-icons/lu";
import { ScriptContext } from "~/app/context";
import { type AppMode } from "~/lib/app-mode";
import { TopTabs } from "./TopTabs";

// Phones and tablets: sidebar button on the left, floating tabs in the middle on tablets
export function TopBar({
  mode,
  onModeChange,
  onMenu,
}: {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onMenu: () => void;
}) {
  const { selectedCharacter, selectedScene } = useContext(ScriptContext);
  const label = [selectedCharacter, selectedScene].filter(Boolean).join(" · ");

  return (
    <header className="glass-bar hairline-b relative z-30 flex h-12 flex-shrink-0 items-center px-2 tablet:h-16 tablet:px-4 desk:hidden">
      <button
        type="button"
        onClick={onMenu}
        aria-label={label ? `Change scene: ${label}` : "Open menu"}
        className="press flex h-10 min-w-0 max-w-[45%] touch-manipulation items-center gap-2 rounded-full px-2 text-accent tablet:max-w-[28%]"
      >
        <LuPanelLeft className="h-6 w-6 flex-shrink-0" />
        {mode === "runner" && (
          <span className="truncate text-[15px] font-medium text-foreground">
            {label || "Pick a scene"}
          </span>
        )}
      </button>
      <div className="absolute left-1/2 hidden -translate-x-1/2 tablet:block">
        <TopTabs mode={mode} onModeChange={onModeChange} />
      </div>
    </header>
  );
}
