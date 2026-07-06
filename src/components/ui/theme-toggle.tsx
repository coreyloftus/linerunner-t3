"use client";

import { useContext, useEffect, useState } from "react";
import { IoSunny, IoMoon } from "react-icons/io5";
import { Button } from "./button";
import { ScriptContext } from "~/app/context";

export function ThemeToggle() {
  const { theme, setTheme } = useContext(ScriptContext);
  // The theme comes from localStorage, which the server can't see — render a
  // neutral icon until mounted so SSR and client markup match
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      className="min-h-[44px] min-w-[44px] touch-manipulation rounded-lg iphone:min-h-[36px] iphone:min-w-[36px]"
      aria-label={
        mounted
          ? `Switch to ${theme === "light" ? "dark" : "light"} mode`
          : "Toggle theme"
      }
    >
      {!mounted ? (
        <span className="h-4 w-4" />
      ) : theme === "light" ? (
        <IoMoon className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <IoSunny className="h-4 w-4 transition-transform duration-200" />
      )}
    </Button>
  );
}
