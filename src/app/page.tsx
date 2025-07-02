import * as React from "react";
import { api } from "~/trpc/server";
import { ScriptProvider } from "./context";
import ScriptBox from "~/components/ScriptDisplay/ScriptBox";
import ScriptViewer from "~/components/ScriptViewer";
import Sidebar from "~/components/Sidebar";
import { Titlebar } from "~/components/Titlebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";

// import PlayStopControls from "~/components/PlayStopControls";

export default async function Home() {
  const projectData = await api.scriptData.getAll();
  return (
    <div>
      <ScriptProvider>
        <div className="fixed left-0 top-0 z-10">
          <Sidebar />
        </div>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#1e1e1e] p-6 text-white">
          {/* <div className="mx-2">
          <ConvertScriptBox />
          </div> */}

          {/* <Titlebar /> */}
          <Tabs
            defaultValue="runner"
            className="flex w-full flex-1 flex-col items-center justify-center"
          >
            <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="runner">Line Runner</TabsTrigger>
              <TabsTrigger value="viewer">Script Viewer</TabsTrigger>
            </TabsList>
            <TabsContent value="runner" className="mt-0">
              <ScriptBox data={projectData} />
            </TabsContent>
            <TabsContent value="viewer" className="mt-0">
              <ScriptViewer data={projectData} />
            </TabsContent>
          </Tabs>
        </div>
      </ScriptProvider>
    </div>
  );
}
