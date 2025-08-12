"use client";

import { useState } from "react";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { SidebarToggle } from "./SidebarToggle";
import { SidebarClient } from "./SidebarClient";
import ScriptBox from "./ScriptDisplay/ScriptBox";
import ScriptViewer from "./ScriptViewer";
import { ScriptData } from "./ScriptData";
import { AddScriptDoc } from "./AddScriptDoc";

interface GetAllResponse {
  projects: string[];
  allData: ProjectJSON[];
}

interface AppContentProps {
  projectData: GetAllResponse;
  sidebarData: GetAllResponse;
}

export function AppContent({ projectData, sidebarData }: AppContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      {/* Sidebar */}
      <div className="fixed left-0 top-0 z-10">
        <SidebarClient
          projects={sidebarData.projects}
          allData={sidebarData.allData}
          isOpen={sidebarOpen}
          onToggle={setSidebarOpen}
        />
      </div>

      {/* Main Content */}
      <div className="pt-safe-top pb-safe-bottom flex min-h-[100dvh] flex-col items-center justify-center bg-[hsl(var(--background))] p-2 text-[hsl(var(--foreground))] transition-colors [touch-action:manipulation] supports-[height:100svh]:min-h-[100svh]">
        <Tabs
          defaultValue="runner"
          className="flex w-full flex-1 flex-col-reverse items-center justify-center md:flex-col"
        >
          <TabsList className="mb-2 mt-2 md:mt-0 w-full max-w-none grid grid-cols-5 gap-0">
            <TabsTrigger value="runner" className="flex-1">
              <span className="iphone:hidden">▶️</span>
              <span className="iphone:inline hidden md:hidden">Run</span>
              <span className="hidden md:inline">Line Runner</span>
            </TabsTrigger>
            <TabsTrigger value="viewer" className="flex-1">
              <span className="iphone:hidden">👁️</span>
              <span className="iphone:inline hidden md:hidden">View</span>
              <span className="hidden md:inline">Line Viewer</span>
            </TabsTrigger>
            <TabsTrigger value="scriptdata" className="flex-1">
              <span className="iphone:hidden">✏️</span>
              <span className="iphone:inline hidden md:hidden">Edit</span>
              <span className="hidden md:inline">Script Data</span>
            </TabsTrigger>
            <TabsTrigger value="newlines" className="flex-1">
              <span className="iphone:hidden">➕</span>
              <span className="iphone:inline hidden md:hidden">Add</span>
              <span className="hidden md:inline">Add Script</span>
            </TabsTrigger>
            <div className="flex-1 flex items-center justify-center">
              <SidebarToggle
                onToggle={handleSidebarToggle}
                isOpen={sidebarOpen}
                className="w-full h-full"
              />
            </div>
          </TabsList>
          <TabsContent value="runner" className="mt-0">
            <ScriptBox data={projectData} />
          </TabsContent>
          <TabsContent value="viewer" className="mt-0">
            <ScriptViewer data={projectData} />
          </TabsContent>
          <TabsContent value="scriptdata" className="mt-0">
            <ScriptData data={projectData} />
          </TabsContent>
          <TabsContent value="newlines" className="mt-0">
            <AddScriptDoc />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}