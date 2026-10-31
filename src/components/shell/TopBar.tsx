"use client";

import { useContext } from "react";
import { ScriptContext } from "~/app/context";
import { chromeFade, SidebarButton, useChrome } from "./chrome";
import { TextSettings } from "./TextSettings";

// Runner on phones and tablets: two floating glass buttons, no bar
export function TopBar() {
  const { selectedCharacter } = useContext(ScriptContext);
  const { hidden, openSidebar } = useChrome();

  return (
    <div
      data-chrome
      className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-3 desk:hidden tablet:p-5 ${chromeFade(hidden)}`}
    >
      <SidebarButton floating />
      <div className="flex items-center gap-2">
        <div className="glass pointer-events-auto rounded-full md:hidden">
          <TextSettings panelClassName="right-0 top-full mt-3" />
        </div>
        {selectedCharacter && (
          <button
            type="button"
            onClick={openSidebar}
            aria-label={`Playing ${selectedCharacter}. Change character`}
            title={selectedCharacter}
            className="glass press pointer-events-auto flex h-11 w-11 touch-manipulation items-center justify-center rounded-full text-[17px] font-semibold text-accent"
          >
            {selectedCharacter.charAt(0).toUpperCase()}
          </button>
        )}
      </div>
    </div>
  );
}
