"use client";

import { useContext, useEffect, useState } from "react";
import { IoSunny, IoMoon, IoDesktopOutline } from "react-icons/io5";
import { Button } from "./button";
import { ScriptContext } from "~/app/context";

export function ThemeToggle() {
  const { theme, setTheme } = useContext(ScriptContext);
  // The theme comes from localStorage, which the server can't see — render a
  // neutral icon until mounted so SSR and client markup match
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const next = { system: "light", light: "dark", dark: "system" } as const;
  const icons = {
    system: <IoDesktopOutline className="h-4 w-4" />,
    light: <IoSunny className="h-4 w-4" />,
    dark: <IoMoon className="h-4 w-4" />,
  };

  return (
    <Button
      onClick={() => setTheme(next[theme])}
      variant="outline"
      size="sm"
      className="min-h-[44px] min-w-[44px] touch-manipulation rounded-lg iphone:min-h-[36px] iphone:min-w-[36px]"
      aria-label={
        mounted
          ? `Theme: ${theme}. Switch to ${next[theme]}`
          : "Toggle theme"
      }
    >
      {mounted ? icons[theme] : <span className="h-4 w-4" />}
    </Button>
  );
}
