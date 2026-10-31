"use client";

import { APP_MODES, type AppMode } from "~/lib/app-mode";

// iPadOS-style floating tabs: a segmented track with a raised pill on the active tab
export function TopTabs({
  mode,
  onModeChange,
}: {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}) {
  return (
    <nav
      aria-label="Mode"
      className="flex items-center gap-0.5 rounded-full bg-foreground/[0.06] p-1"
    >
      {APP_MODES.map(({ id, short, label }) => {
        const active = id === mode;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange(id)}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={`press h-9 touch-manipulation rounded-full px-5 text-[15px] transition-colors ${
              active
                ? "bg-surface font-semibold text-foreground shadow-[0_1px_4px_rgb(0_0_0/0.12)] dark:bg-foreground/15"
                : "font-medium text-muted-foreground hover:text-foreground"
            }`}
          >
            {short}
          </button>
        );
      })}
    </nav>
  );
}
