"use client";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import NewScriptSelect from "./NewScriptSelect";
import { Button } from "./ui/button";
import { useContext, useEffect, useState, useRef } from "react";
import { IoChevronForward } from "react-icons/io5";
import { ScriptContext } from "~/app/context";
import { AuthButton } from "./AuthButton";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useSession } from "next-auth/react";
import { RefreshButton } from "./ui/refresh-button";
import { useScriptData } from "~/hooks/useScriptData";

type SidebarClientProps = {
  projects: string[];
  allData: ProjectJSON[];
};
export function SidebarClient({ projects, allData }: SidebarClientProps) {
  const [navOpen, setNavOpen] = useState(false);
  const { userConfig, setUserConfig } = useContext(ScriptContext);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const arrowButtonRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Get refresh functionality from the optimized hook
  const { refreshData, isLoading: isDataLoading } = useScriptData({
    dataSource: userConfig.dataSource,
    enableAutoRefresh: false,
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours cache
  });

  const { selectedProject, selectedScene, selectedCharacter } =
    useContext(ScriptContext);

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
      const target = event.target as Element;

      // Check if click is on sidebar or arrow button
      const isOnSidebar = sidebarRef.current?.contains(target);
      const isOnArrowButton = arrowButtonRef.current?.contains(target);

      // Check if click is on any dropdown content (Select components)
      const isOnDropdown =
        target.closest("[data-radix-popper-content-wrapper]") !== null;
      const isOnSelectTrigger = target.closest("[data-radix-trigger]") !== null;
      const isOnSelectContent = target.closest("[data-radix-content]") !== null;

      // Only close sidebar if click is outside sidebar, arrow button, and not on any dropdown
      if (
        !isOnSidebar &&
        !isOnArrowButton &&
        !isOnDropdown &&
        !isOnSelectTrigger &&
        !isOnSelectContent &&
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
          <div className="pt-2">
            <div className="flex justify-end p-2">
              <AuthButton />
            </div>
            <div className="px-1">
              <p className="mb-2 font-bold">Script Select</p>
              <NewScriptSelect projects={projects} allData={allData} />
            </div>

            {/* Data Source Configuration */}
            <div className="mt-4 px-1">
              <p className="mb-2 font-bold">Data Source</p>
              <div className="space-y-2">
                {session?.user && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="data-source" className="text-sm">
                      Use Database
                    </Label>
                    <Switch
                      id="data-source"
                      checked={userConfig.dataSource === "firestore"}
                      onCheckedChange={(checked) => {
                        setUserConfig({
                          ...userConfig,
                          dataSource: checked ? "firestore" : "local",
                        });
                      }}
                      disabled={!session?.user}
                    />
                  </div>
                )}
                {!session?.user && (
                  <p className="text-xs text-gray-500">
                    Sign in to use Database
                  </p>
                )}

                {/* Refresh Button - only show when using Firestore */}
                {session?.user && userConfig.dataSource === "firestore" && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Refresh Data</Label>
                    <RefreshButton
                      onClick={refreshData}
                      isLoading={isDataLoading}
                      size="sm"
                    />
                  </div>
                )}

                {/* <p className="text-xs text-gray-500">
                  {userConfig.dataSource === "local"
                    ? "Using local demo files"
                    : "Using Firestore database"}
                </p> */}
              </div>
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

          <div className="fixed bottom-0 mb-16 pl-2 font-mono text-sm">
            LineRunner by Corey -- ©2025
          </div>
        </div>
      </div>

      {/* Arrow button - always visible, positioned outside sidebar */}
      <div
        ref={arrowButtonRef}
        className="fixed bottom-1 left-1 z-[60] flex h-12 w-12 items-center justify-center"
      >
        <Button
          onClick={() => setNavOpen(!navOpen)}
          className="h-full w-full rounded-md bg-stone-500 p-0 text-white hover:bg-stone-600"
        >
          <IoChevronForward
            className={`h-8 w-8 transition-transform duration-300 ${
              navOpen ? "rotate-180" : "rotate-0"
            } ${!selectedProject.length && !selectedScene.length && !selectedCharacter.length ? "blink-on-and-off" : ""}`}
          />
        </Button>
      </div>
    </>
  );
}
