import * as React from "react";
import { api } from "~/trpc/server";
import ScriptBox from "~/components/ScriptDisplay/scriptBox";
import NewScriptSelect from "~/components/newScriptSelect";
import { ScriptProvider } from "./context";

export default async function Home() {
  const projectData = await api.scriptData.getAll();
  return (
    <div className="to[#4e4e4e] h-[100vh] bg-gradient-to-b from-[#1e1e1e] p-4 text-white">
      <ScriptProvider>
        <div className="flex-grow-1 flex justify-center">
          {projectData ? (
            <div>
              <NewScriptSelect
                projects={projectData.projects}
                allData={projectData.allData}
              />
            </div>
          ) : (
            "Loading..."
          )}
        </div>
        <div>
          <ScriptBox data={projectData} />
        </div>
      </ScriptProvider>
    </div>
  );
}
