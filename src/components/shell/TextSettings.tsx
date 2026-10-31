"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { IoDesktopOutline, IoMoon, IoSunny } from "react-icons/io5";
import { ScriptContext, type ThemePreference } from "~/app/context";

const FONT_MIN = 75;
const FONT_MAX = 300;
const FONT_STEP = 25;

const THEMES: { id: ThemePreference; label: string; icon: typeof IoSunny }[] = [
  { id: "light", label: "Light", icon: IoSunny },
  { id: "dark", label: "Dark", icon: IoMoon },
  { id: "system", label: "Match device", icon: IoDesktopOutline },
];

// "Aa" button and popover for text size and theme, like Books
export function TextSettings({ panelClassName }: { panelClassName: string }) {
  const { displayPreferences, setDisplayPreferences, theme, setTheme } =
    useContext(ScriptContext);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const size = displayPreferences.fontSize;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const setSize = (next: number) =>
    setDisplayPreferences((prev) => ({
      ...prev,
      fontSize: Math.min(FONT_MAX, Math.max(FONT_MIN, next)),
    }));

  const step =
    "press flex h-12 flex-1 items-center justify-center font-reading text-foreground disabled:opacity-30";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Text size and theme"
        aria-expanded={open}
        title="Text size and theme"
        onClick={(event) => {
          setOpen((isOpen) => !isOpen);
          event.currentTarget.blur();
        }}
        className={`press flex h-11 w-11 touch-manipulation items-center justify-center rounded-full font-reading text-[19px] transition-colors tablet:h-14 tablet:w-14 tablet:text-[22px] ${
          open
            ? "bg-accent/15 text-accent"
            : "text-foreground/80 hover:bg-foreground/[0.06]"
        }`}
      >
        Aa
      </button>
      {open && (
        <div
          className={`absolute z-40 w-64 space-y-3 rounded-3xl bg-surface p-3 shadow-2xl ring-1 ring-foreground/10 dark:bg-surface-raised ${panelClassName}`}
        >
          <div className="flex items-center overflow-hidden rounded-2xl bg-foreground/[0.06]">
            <button
              type="button"
              aria-label="Smaller text"
              disabled={size <= FONT_MIN}
              onClick={() => setSize(size - FONT_STEP)}
              className={`${step} text-[15px]`}
            >
              A
            </button>
            <span className="w-14 text-center text-[13px] tabular-nums text-muted-foreground">
              {size}%
            </span>
            <button
              type="button"
              aria-label="Larger text"
              disabled={size >= FONT_MAX}
              onClick={() => setSize(size + FONT_STEP)}
              className={`${step} text-[24px]`}
            >
              A
            </button>
          </div>
          <div className="flex justify-between gap-2">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={theme === id}
                title={label}
                onClick={() => setTheme(id)}
                className={`press flex h-12 flex-1 items-center justify-center rounded-2xl text-[20px] ${
                  theme === id
                    ? "bg-accent text-white"
                    : "bg-foreground/[0.06] text-foreground/80"
                }`}
              >
                <Icon />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
