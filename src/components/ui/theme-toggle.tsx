"use client";

import { useContext } from "react";
import { IoSunny, IoMoon } from "react-icons/io5";
import { Button } from "./button";
import { ScriptContext } from "~/app/context";

export function ThemeToggle() {
  const { theme, setTheme } = useContext(ScriptContext);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      className="min-h-[44px] min-w-[44px] touch-manipulation rounded-lg iphone:min-h-[36px] iphone:min-w-[36px]"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <IoMoon className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <IoSunny className="h-4 w-4 transition-transform duration-200" />
      )}
    </Button>
  );
}
