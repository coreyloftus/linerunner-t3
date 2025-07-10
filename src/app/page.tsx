import * as React from "react";
import { api } from "~/trpc/server";
import { ScriptProvider } from "./context";
import ScriptBox from "~/components/ScriptDisplay/ScriptBox";
import ScriptViewer from "~/components/ScriptViewer";
import Sidebar from "~/components/Sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { ScriptData } from "~/components/ScriptData";
import { AddScriptDoc } from "~/components/AddScriptDoc";
import FirebaseTest from "~/components/FirebaseTest";

// import PlayStopControls from "~/components/PlayStopControls";

export default async function Home() {
  const projectData = await api.scriptData.getAll({ dataSource: "local" });
  return (
    <div>
      <ScriptProvider>
        <div className="fixed left-0 top-0 z-10">
          <Sidebar />
        </div>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#1e1e1e] p-4 text-white">
          {/* <div className="mx-2">
          <ConvertScriptBox />
          </div> */}

          {/* <Titlebar /> */}
          <Tabs
            defaultValue="runner"
            className="flex w-full flex-1 flex-col items-center justify-center"
          >
            <TabsList className="mb-4 grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="runner">Line Runner</TabsTrigger>
              <TabsTrigger value="viewer">Line Viewer</TabsTrigger>
              <TabsTrigger value="scriptdata">Line Data</TabsTrigger>
              <TabsTrigger value="newlines">Add Lines</TabsTrigger>
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
