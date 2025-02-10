import * as React from "react";
import { api } from "~/trpc/server";
import { ScriptProvider } from "./context";
import ScriptBox from "~/components/ScriptDisplay/ScriptBox";
import Sidebar from "~/components/Sidebar";
import { Titlebar } from "~/components/Titlebar";

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
          <div className="flex w-full flex-1 flex-col">
            <Titlebar />
            <ScriptBox data={projectData} />
          </div>
        </div>
      </ScriptProvider>
    </div>
  );
}
