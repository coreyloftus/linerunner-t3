import * as React from "react";
import { api } from "~/trpc/server";
import { ScriptProvider } from "./context";
import ScriptBox from "~/components/ScriptDisplay/ScriptBox";
import ScriptViewer from "~/components/ScriptViewer";
import Sidebar from "~/components/Sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { ScriptData } from "~/components/ScriptData";
import { AddScriptDoc } from "~/components/AddScriptDoc";

export default async function Home() {
  const projectData = await api.scriptData.getAll({ dataSource: "public" });
  return (
    <div>
      <ScriptProvider>
        <div className="fixed left-0 top-0 z-10">
          <Sidebar />
        </div>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#1e1e1e] p-2 text-white supports-[height:100svh]:min-h-[100svh] [touch-action:manipulation] pt-safe-top pb-safe-bottom">
          <Tabs
            defaultValue="runner"
            className="flex w-full flex-1 flex-col items-center justify-center"
          >
            <TabsList className="mb-2">
              <TabsTrigger value="runner">
                <span className="iphone:hidden">▶️</span>
                <span className="iphone:inline hidden md:hidden">Run</span>
                <span className="hidden md:inline">Line Runner</span>
              </TabsTrigger>
              <TabsTrigger value="viewer">
                <span className="iphone:hidden">👁️</span>
                <span className="iphone:inline hidden md:hidden">View</span>
                <span className="hidden md:inline">Line Viewer</span>
              </TabsTrigger>
              <TabsTrigger value="scriptdata">
                <span className="iphone:hidden">✏️</span>
                <span className="iphone:inline hidden md:hidden">Edit</span>
                <span className="hidden md:inline">Script Data</span>
              </TabsTrigger>
              <TabsTrigger value="newlines">
                <span className="iphone:hidden">➕</span>
                <span className="iphone:inline hidden md:hidden">Add</span>
                <span className="hidden md:inline">Add Script</span>
              </TabsTrigger>
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
      </ScriptProvider>
    </div>
  );
}
