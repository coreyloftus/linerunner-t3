"use client";

import { APP_MODES, type AppMode } from "~/lib/app-mode";

interface MobileTabBarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

// Phone-only: the four modes one tap away
export function MobileTabBar({ mode, onModeChange }: MobileTabBarProps) {
  return (
    <nav
      aria-label="Mode"
      className="flex h-14 flex-shrink-0 border-t border-border bg-surface-raised md:hidden"
    >
      {APP_MODES.map(({ id, short, label, icon: Icon }) => {
        const active = id === mode;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange(id)}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={`relative flex flex-1 touch-manipulation flex-col items-center justify-center gap-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
              active
                ? "font-semibold text-accent before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:rounded-full before:bg-accent"
                : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            {short}
          </button>
        );
      })}
    </nav>
  );
}
