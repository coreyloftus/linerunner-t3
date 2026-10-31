"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import { ScriptContext } from "~/app/context";
import { type AppMode } from "~/lib/app-mode";
import { DESKTOP_QUERY } from "~/lib/breakpoints";
import { SidebarClient } from "./SidebarClient";
import { TopBar } from "./shell/TopBar";
import { MobileTabBar } from "./MobileTabBar";
import ScriptBox from "./ScriptDisplay/ScriptBox";
import ScriptViewer from "./ScriptViewer";
import { ScriptsWorkspace } from "./ScriptsWorkspace";
import { MelodyWorkspace } from "./Melody/MelodyWorkspace";
import { useLastSpot } from "~/hooks/useLastSpot";
import { useMyCharacter } from "~/hooks/useMyCharacter";
import { type WorkspaceView } from "./ScriptsWorkspace";

interface GetAllResponse {
  projects: string[];
  allData: ProjectJSON[];
}

interface AppShellProps {
  projectData: GetAllResponse;
  sidebarData: GetAllResponse;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function AppShell({ projectData, sidebarData }: AppShellProps) {
  const router = useRouter();
  const { layoutPreferences, setLayoutPreferences, queryParams } =
    useContext(ScriptContext);
  const [mode, setMode] = useState<AppMode>("runner");
  const [mobileOpen, setMobileOpen] = useState(false);
  const melodyParam = queryParams.melody;
  const [scriptsView, setScriptsView] = useState<WorkspaceView>("library");
  useLastSpot(mode, setMode);
  useMyCharacter();

  // ?melody=<id> opens the Melody tab
  useEffect(() => {
    if (melodyParam) setMode("melody");
  }, [melodyParam]);

  const handleModeChange = (next: AppMode, view: WorkspaceView = "library") => {
    setScriptsView(view);
    setMode(next);
    if (next !== "melody" && melodyParam) {
      const params = new URLSearchParams(window.location.search);
      params.delete("melody");
      router.push(`?${params.toString()}`);
    }
  };

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
        onModeChange={handleModeChange}
        collapsed={layoutPreferences.sidebarCollapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar
          mode={mode}
          onMenu={() => setMobileOpen(true)}
        />
        <main className="relative flex min-h-0 min-w-0 flex-1 desk:p-2 desk:pl-0">
          {/* Other modes leave room for the floating tab bar; the runner pads its own page */}
          <div
            className={`flex min-h-0 min-w-0 flex-1 overflow-hidden desk:rounded-2xl desk:border desk:border-border desk:shadow-xl desk:shadow-black/5 dark:desk:shadow-black/40 ${mode === "runner" ? "" : "pb-[76px] desk:pb-0 tablet:pb-24"}`}
          >
            {mode === "runner" && (
              <ScriptBox
                data={projectData}
                onAddScript={() => handleModeChange("scripts", "new")}
              />
            )}
            {mode === "viewer" && <ScriptViewer data={projectData} />}
            {mode === "scripts" && (
              <ScriptsWorkspace
                data={projectData}
                initialView={scriptsView}
                onPractice={() => handleModeChange("runner")}
              />
            )}
            {mode === "melody" && <MelodyWorkspace />}
          </div>
          <MobileTabBar mode={mode} onModeChange={handleModeChange} />
        </main>
      </div>
    </div>
  );
}
