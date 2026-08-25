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
import { DisplaySettings } from "./DisplaySettings";
import { AdminSharingPanel } from "./AdminSharingPanel";
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
        className={`fixed left-0 top-0 h-full transform border-r border-border bg-surface/95 backdrop-blur-md transition-all duration-500 ease-in-out ${
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
              <div className="flex items-center gap-1">
                {/* Close button for mobile */}
                <Button
                  onClick={() => setNavOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="p-2 text-muted-foreground hover:bg-muted md:hidden"
                  aria-label="Close sidebar"
                >
                  <IoClose className="h-5 w-5" />
                </Button>
                {/* Wordmark */}
                <span className="pl-1 font-display text-xl font-semibold tracking-tight">
                  Line<span className="text-accent">Runner</span>
                </span>
              </div>
              <AuthButton />
            </div>
            <div className="px-3 pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Script Select
              </p>
              <NewScriptSelect projects={projects} allData={allData} />
            </div>

            {/* Settings */}
            <div className="mt-5 px-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Settings
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-mobile-sm iphone:text-sm">
                    Theme
                  </Label>
                  <ThemeToggle />
                </div>
                {isAdmin && (
                  <div className="flex items-center justify-between">
                    <Label className="text-mobile-sm iphone:text-sm">
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

            {/* Display Settings */}
            <div className="mt-5 border-t border-border px-3 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Display
              </p>
              <DisplaySettings />
            </div>

            {/* Project Sharing - Admin Only */}
            {isAdmin && (
              <div className="mt-5 border-t border-border px-3 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Project Sharing
                </p>
                <AdminSharingPanel />
              </div>
            )}

          </div>
          <div className="fixed bottom-[.5rem] pl-3">
            <Link href="https://www.coreyloftus.com" target="_blank">
              <div className="font-script text-mobile-xs text-muted-foreground transition-colors hover:text-foreground iphone:text-sm">
                LineRunner by Corey — ©2025 coreyloftus.com
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
