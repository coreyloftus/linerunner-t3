"use client";

import { useContext } from "react";
import { IoChevronDown, IoPersonCircle } from "react-icons/io5";
import { LuPanelLeft } from "react-icons/lu";
import { ScriptContext } from "~/app/context";
import { type AppMode } from "~/lib/app-mode";

// Phones and tablets: sidebar button and scene title on the left, character on the right
export function TopBar({
  mode,
  onMenu,
}: {
  mode: AppMode;
  onMenu: () => void;
}) {
  const { selectedProject, selectedScene, selectedCharacter } =
    useContext(ScriptContext);
  const runner = mode === "runner";

  return (
    <header className="glass-bar hairline-b relative z-30 flex h-14 flex-shrink-0 items-center gap-1 px-2 desk:hidden tablet:h-16 tablet:px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Show sidebar"
        className="press flex h-10 w-10 flex-shrink-0 touch-manipulation items-center justify-center rounded-full text-accent"
      >
        <LuPanelLeft className="h-6 w-6" />
      </button>
      <div className="min-w-0 flex-1">
        {runner && (
          <>
            <p className="truncate text-[17px] font-semibold leading-tight">
              {selectedScene || "Pick a scene"}
            </p>
            {selectedProject?.name && (
              <p className="truncate text-[13px] text-muted-foreground">
                {selectedProject.name}
              </p>
            )}
          </>
        )}
      </div>
      {runner && selectedCharacter && (
        <button
          type="button"
          onClick={onMenu}
          aria-label={`Change character: ${selectedCharacter}`}
          className="press ml-auto flex h-9 max-w-[38%] flex-shrink-0 touch-manipulation items-center gap-1.5 rounded-full bg-foreground/[0.06] pl-1.5 pr-3 text-[15px] font-medium tablet:max-w-[30%]"
        >
          <IoPersonCircle className="h-6 w-6 flex-shrink-0 text-accent" />
          <span className="truncate">{selectedCharacter}</span>
          <IoChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        </button>
      )}
    </header>
  );
}
