"use client";

import { useContext, useEffect, useState } from "react";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import { ScriptContext } from "~/app/context";
import { type AppMode } from "~/lib/app-mode";
import { SidebarClient } from "./SidebarClient";
import { MobileMenuButton } from "./MobileMenuButton";
import ScriptBox from "./ScriptDisplay/ScriptBox";
import ScriptViewer from "./ScriptViewer";
import { ScriptsWorkspace } from "./ScriptsWorkspace";
import { MelodyWorkspace } from "./Melody/MelodyWorkspace";

interface GetAllResponse {
  projects: string[];
  allData: ProjectJSON[];
}

interface AppShellProps {
  projectData: GetAllResponse;
  sidebarData: GetAllResponse;
}

const DESKTOP_QUERY = "(min-width: 768px)";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function AppShell({ projectData, sidebarData }: AppShellProps) {
  const { layoutPreferences, setLayoutPreferences } =
    useContext(ScriptContext);
  const [mode, setMode] = useState<AppMode>("runner");
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCollapsed = (sidebarCollapsed: boolean) => {
    setLayoutPreferences((prev) => ({ ...prev, sidebarCollapsed }));
  };

  // Backslash toggles the sidebar: collapse on desktop, drawer on phone
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "\\" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      if (window.matchMedia(DESKTOP_QUERY).matches) {
        setLayoutPreferences((prev) => ({
          ...prev,
          sidebarCollapsed: !prev.sidebarCollapsed,
        }));
      } else {
        setMobileOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLayoutPreferences]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-foreground [touch-action:manipulation] supports-[height:100svh]:h-[100svh]">
      <SidebarClient
        projects={sidebarData.projects}
        allData={sidebarData.allData}
        mode={mode}
        onModeChange={setMode}
        collapsed={layoutPreferences.sidebarCollapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <main className="relative flex min-h-0 min-w-0 flex-1 md:p-2 md:pl-0">
        <MobileMenuButton onClick={() => setMobileOpen(true)} />
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden md:rounded-2xl md:border md:border-border md:shadow-xl md:shadow-black/5 dark:md:shadow-black/40">
          {mode === "runner" && <ScriptBox data={projectData} />}
          {mode === "viewer" && <ScriptViewer data={projectData} />}
          {mode === "scripts" && (
            <ScriptsWorkspace
              data={projectData}
              onPractice={() => setMode("runner")}
            />
          )}
          {mode === "melody" && <MelodyWorkspace />}
        </div>
      </main>
    </div>
  );
}
