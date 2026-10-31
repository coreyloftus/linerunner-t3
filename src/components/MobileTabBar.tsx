"use client";

import {
  IoBook,
  IoBookOutline,
  IoLayers,
  IoLayersOutline,
  IoMusicalNotes,
  IoMusicalNotesOutline,
  IoPlayCircle,
  IoPlayCircleOutline,
} from "react-icons/io5";
import { type IconType } from "react-icons";
import { APP_MODES, type AppMode } from "~/lib/app-mode";
import { chromeFade, useChrome } from "./shell/chrome";

// Outline when idle, filled when active, like SF Symbols tab icons
const ICONS: Record<AppMode, [IconType, IconType]> = {
  runner: [IoPlayCircleOutline, IoPlayCircle],
  viewer: [IoBookOutline, IoBook],
  scripts: [IoLayersOutline, IoLayers],
  melody: [IoMusicalNotesOutline, IoMusicalNotes],
};

interface MobileTabBarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

// Phones and tablets: a floating glass tab bar, icons only
export function MobileTabBar({ mode, onModeChange }: MobileTabBarProps) {
  const { hidden } = useChrome();
  return (
    <div
      data-chrome
      className={`pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center desk:hidden tablet:bottom-6 tablet:justify-start tablet:pl-6 ${chromeFade(hidden)}`}
    >
      <nav
        aria-label="Mode"
        className="glass pointer-events-auto flex gap-1 rounded-full p-1.5"
      >
        {APP_MODES.map(({ id, label }) => {
          const active = id === mode;
          const [Idle, Active] = ICONS[id];
          const Icon = active ? Active : Idle;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onModeChange(id)}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              title={label}
              className={`press flex h-12 w-14 touch-manipulation items-center justify-center rounded-full transition-colors tablet:h-14 tablet:w-16 ${
                active
                  ? "bg-foreground/[0.08] text-accent"
                  : "text-foreground/60"
              }`}
            >
              <Icon className="h-[26px] w-[26px] tablet:h-7 tablet:w-7" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
