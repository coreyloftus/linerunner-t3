import * as React from "react";
import { api } from "~/trpc/server";
import { ScriptProvider } from "./context";
import NewScriptSelect from "~/components/NewScriptSelect";
import ScriptBox from "~/components/ScriptDisplay/ScriptBox";
// import PlayStopControls from "~/components/PlayStopControls";

export default async function Home() {
  const projectData = await api.scriptData.getAll();
  return (
    <div className="flex min-h-[100vh] min-w-[100vw] flex-col items-center justify-center bg-[#1e1e1e] px-4 py-2 text-white">
      <ScriptProvider>
        {projectData ? (
          <div className="mb-2 w-full">
            <NewScriptSelect
              projects={projectData.projects}
              allData={projectData.allData}
            />
          </div>
        ) : (
          "Loading..."
        )}
        {/* <div className="mx-2">
          <ConvertScriptBox />
        </div> */}
        <div className="h-[80vh] w-full flex-1">
          <ScriptBox data={projectData} />
        </div>
      </ScriptProvider>
    </div>
  );
}
