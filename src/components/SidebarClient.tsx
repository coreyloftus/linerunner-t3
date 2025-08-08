"use client";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import NewScriptSelect from "./NewScriptSelect";
import { Button } from "./ui/button";
import { useContext, useEffect, useState, useRef } from "react";
import { IoMenu, IoClose } from "react-icons/io5";
import { ScriptContext } from "~/app/context";
import { AuthButton } from "./AuthButton";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useSession } from "next-auth/react";
import { RefreshButton } from "./ui/refresh-button";
import { useScriptData } from "~/hooks/useScriptData";
import { ThemeToggle } from "./ui/theme-toggle";

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
        className={`fixed left-0 top-0 h-full transform border-r border-stone-200 bg-stone-50/95 backdrop-blur-sm transition-all duration-500 ease-in-out dark:border-stone-800 dark:bg-stone-900/90 ${
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
            <div className="flex items-center justify-between p-2">
              {/* Close button for mobile */}
              <Button
                onClick={() => setNavOpen(false)}
                variant="ghost"
                size="sm"
                className="p-2 text-stone-600 hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-700 md:hidden"
                aria-label="Close sidebar"
              >
                <IoClose className="h-5 w-5" />
              </Button>
              <div className="md:hidden" /> {/* Spacer for mobile */}
              <AuthButton />
            </div>
            <div className="px-1">
              <p className="mb-2 font-bold text-stone-900 dark:text-stone-100">
                Script Select
              </p>
              <NewScriptSelect projects={projects} allData={allData} />
            </div>

            {/* Refresh Button */}
            <div className="mt-4 px-1">
              <p className="mb-2 font-bold text-stone-900 dark:text-stone-100">
                Settings
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-stone-800 dark:text-stone-200">
                    Theme
                  </Label>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-stone-800 dark:text-stone-200">
                    Refresh Data
                  </Label>
                  <RefreshButton
                    onClick={refreshData}
                    isLoading={isDataLoading}
                    size="sm"
                  />
                </div>
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

          <div className="fixed bottom-0 mb-16 pl-2 font-mono text-sm text-stone-600 dark:text-stone-400">
            LineRunner by Corey -- ©2025
          </div>
        </div>
      </div>

      {/* Hamburger menu button - always visible, positioned at top-right */}
      <div
        ref={arrowButtonRef}
        className="fixed top-4 right-4 z-[60] flex h-12 w-12 items-center justify-center"
      >
        <Button
          onClick={() => setNavOpen(!navOpen)}
          className="h-full w-full rounded-lg bg-stone-100/90 p-0 text-stone-700 shadow-lg backdrop-blur-sm hover:bg-stone-200 dark:bg-stone-800/90 dark:text-stone-200 dark:hover:bg-stone-700"
          aria-label={navOpen ? "Close menu" : "Open menu"}
        >
          <IoMenu
            className={`h-6 w-6 transition-all duration-300 ${
              !selectedProject.length && !selectedScene.length && !selectedCharacter.length ? "blink-on-and-off" : ""
            }`}
          />
        </Button>
      </div>
    </>
  );
}
