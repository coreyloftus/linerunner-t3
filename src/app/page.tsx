import * as React from "react";
import { api } from "~/trpc/server";
import ScriptBox from "~/components/ScriptDisplay/scriptBox";
import NewScriptSelect from "~/components/newScriptSelect";
import { ScriptContext, ScriptProvider } from "./context";

export default async function Home() {
  const hello = await api.post.hello({ text: "Line Runner T3" });
  const projectData = await api.scriptData.getAll();
  console.log({ projectData });

  return (
    <div className="to[#555555] h-[100vh] bg-gradient-to-b from-[#1e1e1e] p-4 text-white">
      <div className="flex-grow-1 flex justify-center">
        <div>
          <NewScriptSelect projects={projectData.projects} />
        </div>
      </div>
      <div className="text-center">
        <p>{hello ? hello.greeting : ""}</p>
      </div>
      <div>
        <ScriptProvider>
          <ScriptBox />
        </ScriptProvider>
      </div>
    </div>
  );
}
