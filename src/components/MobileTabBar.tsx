"use client";

import { IoBookOutline, IoLayersOutline, IoMusicalNotesOutline, IoPlayCircle } from "react-icons/io5";
import { type IconType } from "react-icons";
import { APP_MODES, type AppMode } from "~/lib/app-mode";

const ICONS: Record<AppMode, IconType> = {
  runner: IoPlayCircle,
  viewer: IoBookOutline,
  scripts: IoLayersOutline,
  melody: IoMusicalNotesOutline,
};

interface MobileTabBarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

// Phones: iOS tab bar; tablets use the floating tabs in the top bar
export function MobileTabBar({ mode, onModeChange }: MobileTabBarProps) {
  return (
    <nav
      aria-label="Mode"
      className="glass-bar hairline-t flex h-14 flex-shrink-0 tablet:hidden desk:hidden"
    >
      {APP_MODES.map(({ id, short, label }) => {
        const active = id === mode;
        const Icon = ICONS[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange(id)}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={`flex flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              active ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-6 w-6" />
            {short}
          </button>
        );
      })}
    </nav>
  );
}
