import * as React from "react";
import { api } from "~/trpc/server";
import ScriptBox from "~/components/ScriptDisplay/ScriptBox";
import NewScriptSelect from "~/components/newScriptSelect";
import { ScriptProvider } from "./context";
// import PlayStopControls from "~/components/PlayStopControls";

export default async function Home() {
  const projectData = await api.scriptData.getAll();
  return (
    <div className="min-h-[100vh] bg-[#1e1e1e] px-3 py-1 text-white">
      <ScriptProvider>
        <div className="flex-grow-1 flex justify-center">
          {projectData ? (
            <div className="m-2">
              <NewScriptSelect
                projects={projectData.projects}
                allData={projectData.allData}
              />
            </div>
          ) : (
            "Loading..."
          )}
        </div>
        {/* <div className="mx-2">
          <ConvertScriptBox />
        </div> */}
        <div>
          <ScriptBox data={projectData} />
        </div>
      </ScriptProvider>
    </div>
  );
}
