"use client";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import NewScriptSelect from "./NewScriptSelect";
import { Button } from "./ui/button";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { IoClose } from "react-icons/io5";
import { ScriptContext } from "~/app/context";
import { AuthButton } from "./AuthButton";
import { Label } from "./ui/label";
import { RefreshButton } from "./ui/refresh-button";
import { useScriptData } from "~/hooks/useScriptData";
import { ThemeToggle } from "./ui/theme-toggle";
import Link from "next/link";

type SidebarClientProps = {
  projects: string[];
  allData: ProjectJSON[];
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
};
export function SidebarClient({
  projects,
  allData,
  isOpen,
  onToggle,
}: SidebarClientProps) {
  const [internalNavOpen, setInternalNavOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const navOpen = isOpen ?? internalNavOpen;
  const setNavOpenStable = useCallback(
    (open: boolean | ((prev: boolean) => boolean)) => {
      if (onToggle) {
        const newValue = typeof open === "function" ? open(navOpen) : open;
        onToggle(newValue);
      } else {
        setInternalNavOpen(open);
      }
    },
    [onToggle, navOpen],
  );

  const setNavOpen = setNavOpenStable;
  const { userConfig, isAdmin } = useContext(ScriptContext);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Get refresh functionality from the optimized hook
  const { refreshData, isLoading: isDataLoading } = useScriptData({
    dataSource: userConfig.dataSource,
    enableAutoRefresh: false,
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours cache
  });

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
  }, [navOpen, setNavOpen]);

  // Handle click outside sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Check if click is on sidebar
      const isOnSidebar = sidebarRef.current?.contains(target);

      // Check if click is on any dropdown content (Select components)
      const isOnDropdown =
        target.closest("[data-radix-popper-content-wrapper]") !== null;
      const isOnSelectTrigger = target.closest("[data-radix-trigger]") !== null;
      const isOnSelectContent = target.closest("[data-radix-content]") !== null;

      // Only close sidebar if click is outside sidebar and not on any dropdown
      if (
        !isOnSidebar &&
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
  }, [navOpen, setNavOpen]);

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {navOpen && (
        <div
          className="fixed inset-0 bg-black/50 transition-opacity duration-300 iphone:bg-black/40 md:hidden"
          style={{ zIndex: 40 }}
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full transform border-r border-stone-200 bg-stone-50/95 backdrop-blur-sm transition-all duration-500 ease-in-out dark:border-stone-800 dark:bg-stone-900/90 ${
          navOpen
            ? "w-[85vw] translate-x-0 opacity-100 xs:w-[80vw] iphone:w-[75vw] md:w-[33vw]"
            : "w-[85vw] -translate-x-full opacity-100 xs:w-[80vw] iphone:w-[75vw] md:w-[33vw]"
        }`}
        style={{ zIndex: 50 }}
      >
        {/* Content area - only visible when open */}
        <div
          className={`h-full transition-opacity duration-200 ${navOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <div className="pt-3 iphone:pt-2">
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
            <div className=" px-2">
              <p className="mb-2 text-mobile-base font-bold text-stone-900 dark:text-stone-100 iphone:text-base">
                Script Select
              </p>
              <NewScriptSelect projects={projects} allData={allData} />
            </div>

            {/* Settings */}
            <div className="mt-4 px-2">
              <p className="mb-2 text-mobile-base font-bold text-stone-900 dark:text-stone-100 iphone:text-base">
                Settings
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-mobile-sm text-stone-800 dark:text-stone-200 iphone:text-sm">
                    Theme
                  </Label>
                  <ThemeToggle />
                </div>
                {isAdmin && (
                  <div className="flex items-center justify-between">
                    <Label className="text-mobile-sm text-stone-800 dark:text-stone-200 iphone:text-sm">
                      Refresh Data
                    </Label>
                    <RefreshButton
                      onClick={refreshData}
                      isLoading={isDataLoading}
                      size="sm"
                      className="min-h-[44px] min-w-[44px] touch-manipulation iphone:min-h-[36px] iphone:min-w-[36px]"
                    />
                  </div>
                )}
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
          <div className="fixed bottom-[.5rem] pl-2">
            <Link href="https://www.coreyloftus.com" target="_blank">
              <div className="font-mono text-mobile-xs text-stone-600 dark:text-stone-400 iphone:text-sm">
                LineRunner by Corey -- ©2025
                <span className="text-stone-600 dark:text-stone-400">
                  {" "}
                  coreyloftus.com
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
