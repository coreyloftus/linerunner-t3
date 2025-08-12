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
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-stone-700 hover:bg-stone-200 dark:text-stone-200 dark:hover:bg-stone-700"
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
