"use client";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import NewScriptSelect from "./NewScriptSelect";
import { Button } from "./ui/button";
import { useContext, useEffect, useRef, type ReactNode } from "react";
import { IoClose } from "react-icons/io5";
import {
  FaAnglesLeft,
  FaAnglesRight,
  FaChevronRight,
  FaSliders,
} from "react-icons/fa6";
import { ScriptContext } from "~/app/context";
import { APP_MODES, type AppMode } from "~/lib/app-mode";
import { AuthButton } from "./AuthButton";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { RefreshButton } from "./ui/refresh-button";
import { useScriptData } from "~/hooks/useScriptData";
import { ThemeToggle } from "./ui/theme-toggle";
import { DisplaySettings } from "./DisplaySettings";
import { PlaybackSettings } from "./PlaybackSettings";
import { AdminSharingPanel } from "./AdminSharingPanel";
import Link from "next/link";

type SidebarClientProps = {
  projects: string[];
  allData: ProjectJSON[];
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

const SECTION_LABEL =
  "text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground";

const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group border-b border-border last:border-b-0">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 rounded-md md:min-h-[40px] [&::-webkit-details-marker]:hidden">
        <span className={SECTION_LABEL}>{title}</span>
        <FaChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <div className="space-y-3 pb-4 pt-1">{children}</div>
    </details>
  );
}

export function SidebarClient({
  projects,
  allData,
  mode,
  onModeChange,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
}: SidebarClientProps) {
  const { userConfig, isAdmin, speechMatchEnabled, setSpeechMatchEnabled } =
    useContext(ScriptContext);
  const sidebarRef = useRef<HTMLElement>(null);

  // Get refresh functionality from the optimized hook
  const { refreshData, isLoading: isDataLoading } = useScriptData({
    dataSource: userConfig.dataSource,
    enableAutoRefresh: false,
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours cache
  });

  // Escape closes the phone drawer; it does nothing on desktop
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileOpen && !isDesktop()) {
        onMobileOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [mobileOpen, onMobileOpenChange]);

  // Handle click outside the phone drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!mobileOpen || isDesktop()) return;
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
        !isOnSelectContent
      ) {
        onMobileOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpen, onMobileOpenChange]);

  const handleModeClick = (next: AppMode) => {
    onModeChange(next);
    onMobileOpenChange(false);
  };

  // Rail-only and expanded-only pieces; the rail exists only at md and up
  const expandedOnly = collapsed ? "md:hidden" : "";
  const railOnly = collapsed ? "hidden md:flex" : "hidden";

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 iphone:bg-black/40 md:hidden"
          onClick={() => onMobileOpenChange(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col overflow-hidden border-r border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] backdrop-blur-md transition-[transform,visibility,width] duration-300 ease-in-out md:visible md:relative md:inset-auto md:z-auto md:max-w-none md:flex-shrink-0 md:translate-x-0 md:border-r-0 md:bg-transparent md:pb-0 md:pt-0 md:backdrop-blur-none md:duration-200 ${
          mobileOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        } ${collapsed ? "md:w-14" : "md:w-72"}`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between gap-2 px-3 pb-2 pt-3 ${collapsed ? "md:justify-center md:px-0" : ""}`}
        >
          <span
            className={`whitespace-nowrap pl-1 font-display text-xl font-semibold tracking-tight ${expandedOnly}`}
          >
            Line<span className="text-accent">Runner</span>
          </span>
          <span
            className={`${railOnly} font-display text-xl font-semibold tracking-tight`}
            aria-label="LineRunner"
          >
            L<span className="text-accent">R</span>
          </span>
          <Button
            onClick={() => onCollapsedChange(true)}
            variant="ghost"
            size="sm"
            className={`hidden p-2 text-muted-foreground hover:bg-muted ${collapsed ? "" : "md:flex"}`}
            aria-label="Collapse sidebar"
            title="Collapse sidebar (\)"
          >
            <FaAnglesLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onMobileOpenChange(false)}
            variant="ghost"
            size="sm"
            className="p-2 text-muted-foreground hover:bg-muted md:hidden"
            aria-label="Close menu"
          >
            <IoClose className="h-5 w-5" />
          </Button>
        </div>
        <div className={`px-3 pb-2 ${expandedOnly}`}>
          <AuthButton />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]">
          {/* Mode */}
          <nav
            aria-label="Mode"
            className={`px-2 pt-2 ${collapsed ? "md:px-1.5" : ""}`}
          >
            <p
              className={`mb-2 px-1 ${SECTION_LABEL} ${collapsed ? "md:sr-only" : ""}`}
            >
              Mode
            </p>
            <ul className="space-y-0.5">
              {APP_MODES.map(({ id, label, icon: Icon }) => {
                const active = id === mode;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => handleModeClick(id)}
                      aria-current={active ? "page" : undefined}
                      aria-label={label}
                      title={collapsed ? label : undefined}
                      className={`relative flex min-h-[44px] w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 text-sm transition-colors md:min-h-[40px] ${
                        active
                          ? "bg-accent-soft font-semibold text-accent before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      } ${collapsed ? "md:justify-center md:px-0" : ""}`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span
                        className={`truncate ${collapsed ? "md:sr-only" : ""}`}
                      >
                        {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Rail: open settings or expand */}
          <div
            className={`${railOnly} mx-1.5 mt-2 flex-col gap-0.5 border-t border-border pt-2`}
          >
            <button
              type="button"
              onClick={() => onCollapsedChange(false)}
              aria-label="Settings"
              title="Settings"
              className="flex min-h-[40px] w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <FaSliders className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onCollapsedChange(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar (\)"
              className="flex min-h-[40px] w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <FaAnglesRight className="h-4 w-4" />
            </button>
          </div>

          {/* Script */}
          <div
            className={`mx-3 mt-4 border-t border-border pt-4 ${expandedOnly}`}
          >
            <p className={`mb-2 ${SECTION_LABEL}`}>Script</p>
            <NewScriptSelect projects={projects} allData={allData} />
          </div>

          {/* Settings */}
          <div
            className={`mx-3 mt-4 border-t border-border pt-4 ${expandedOnly}`}
          >
            <p className={`mb-1 ${SECTION_LABEL}`}>Settings</p>
            <div className="pl-2">
              <SettingsGroup title="Playback">
                <PlaybackSettings />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-mobile-sm iphone:text-sm">
                      Speech Match
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Say your line to advance (Chrome/Safari)
                    </p>
                  </div>
                  <Switch
                    checked={speechMatchEnabled}
                    onCheckedChange={setSpeechMatchEnabled}
                    aria-label="Toggle speech match"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 opacity-60">
                  <div>
                    <Label className="text-mobile-sm iphone:text-sm">
                      Scene Partner Voice
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Coming soon — hear the other characters
                    </p>
                  </div>
                  <Switch
                    checked={false}
                    disabled
                    aria-label="Scene partner voice (coming soon)"
                  />
                </div>
              </SettingsGroup>

              <SettingsGroup title="Display">
                <div className="flex items-center justify-between">
                  <Label className="text-mobile-sm iphone:text-sm">Theme</Label>
                  <ThemeToggle />
                </div>
                <DisplaySettings />
              </SettingsGroup>

              {isAdmin && (
                <SettingsGroup title="Admin">
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
                  <div>
                    <p className="mb-2 text-sm font-medium">Project Sharing</p>
                    <AdminSharingPanel />
                  </div>
                </SettingsGroup>
              )}
            </div>
          </div>

          {/* Footer credit */}
          <div className={`mt-auto px-3 pb-3 pt-6 ${expandedOnly}`}>
            <Link href="https://www.coreyloftus.com" target="_blank">
              <div className="font-script text-mobile-xs text-muted-foreground transition-colors hover:text-foreground iphone:text-sm">
                LineRunner by Corey — ©2025 coreyloftus.com
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
