"use client";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import NewScriptSelect from "./NewScriptSelect";
import { Button } from "./ui/button";
import { useContext, useEffect, useState, useRef } from "react";
import { IoChevronForward } from "react-icons/io5";
import { ScriptContext } from "~/app/context";
import { Switch } from "./ui/switch";

type SidebarClientProps = {
  projects: string[];
  allData: ProjectJSON[];
};
export function SidebarClient({ projects, allData }: SidebarClientProps) {
  const [navOpen, setNavOpen] = useState(false);
  const { userConfig, setUserConfig } = useContext(ScriptContext);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(userConfig);
  }, [userConfig]);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && navOpen) {
        setNavOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [navOpen]);

  // Handle click outside sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        navOpen
      ) {
        setNavOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navOpen]);

  return (
    <>
      {/* sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full transform border-r-2 border-stone-200 bg-stone-400 transition-all duration-500 ease-in-out ${
          navOpen
            ? "w-[75vw] translate-x-0 opacity-100 sm:w-[75vw] md:w-[33vw]"
            : "w-[75vw] -translate-x-full opacity-100 sm:w-[75vw] md:w-[33vw]"
        }`}
        style={{ zIndex: 50 }}
      >
        {/* Content area - only visible when open */}
        <div
          className={`h-full transition-opacity duration-300 ${navOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <div className="pt-10">
            <div className="px-1">
              <p className="mb-2 font-bold">Script Select</p>
              <NewScriptSelect projects={projects} allData={allData} />
            </div>
            <div className="mt-2 flex flex-col p-2">
              {/* add a toggle for the "Auto Advance" feature -- when TRUE set the context.autoAdvance to TRUE */}
              {/* <p className="font-bold">NPC Settings</p>
              <div className="flex justify-between p-2">
                <p>Word-by-word</p>
                <Switch
                  checked={userConfig.autoAdvanceScript}
                  onCheckedChange={(checked) =>
                    setUserConfig({
                      ...userConfig,
                      autoAdvanceScript: checked,
                    })
                  }
                  className="bg-stone-500 text-white"
                />
              </div> */}
            </div>
          </div>
          <div className="fixed bottom-0 pb-10 pl-2 font-mono text-sm">
            LineRunner by Corey -- ©2025
          </div>
        </div>
      </div>

      {/* Arrow button - always visible, positioned outside sidebar */}
      <div className="fixed bottom-1 left-1 z-[60] flex h-8 w-8 items-center justify-center">
        <Button
          onClick={() => setNavOpen(!navOpen)}
          className="h-8 w-8 rounded-md bg-stone-500 p-0 text-white hover:bg-stone-600"
        >
          <IoChevronForward
            className={`h-8 w-8 transition-transform duration-300 ${
              navOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </Button>
      </div>
    </>
  );
}
