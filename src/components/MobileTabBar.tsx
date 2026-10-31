"use client";

import {
  IoBookOutline,
  IoLayersOutline,
  IoMusicalNotesOutline,
  IoPlayCircle,
} from "react-icons/io5";
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

// Phones: a floating glass tab bar; tablets use the tabs in the top bar
export function MobileTabBar({ mode, onModeChange }: MobileTabBarProps) {
  return (
    <div className="flex-shrink-0 bg-surface px-4 pb-2 pt-1 desk:hidden tablet:hidden">
      <nav
        aria-label="Mode"
        className="glass mx-auto flex max-w-md gap-0.5 rounded-full p-1"
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
              className={`press flex h-14 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                active
                  ? "bg-foreground/[0.08] text-accent"
                  : "text-foreground/70"
              }`}
            >
              <Icon className="h-6 w-6" />
              {short}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
