"use client";

import { useContext } from "react";
import { IoMenu } from "react-icons/io5";
import { ScriptContext } from "~/app/context";
import { Button } from "./ui/button";

interface SidebarToggleProps {
  onToggle: () => void;
  isOpen: boolean;
  className?: string;
}

export function SidebarToggle({ onToggle, isOpen, className = "" }: SidebarToggleProps) {
  const { selectedProject, selectedScene, selectedCharacter } = useContext(ScriptContext);

  return (
    <Button
      onClick={onToggle}
      className={`h-full w-full touch-manipulation rounded-lg bg-transparent p-0 text-stone-700 hover:bg-stone-200 dark:text-stone-200 dark:hover:bg-stone-700 transition-colors duration-200 ${className}`}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      variant="ghost"
    >
      <IoMenu
        className={`h-5 w-5 transition-all duration-300 ${
          !selectedProject.length && !selectedScene.length && !selectedCharacter.length ? "blink-on-and-off" : ""
        }`}
      />
    </Button>
  );
}