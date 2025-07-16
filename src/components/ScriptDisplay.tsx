"use server";
import { ScriptProvider } from "~/app/context";
import ScriptBox from "./ScriptDisplay/ScriptBox";
import { api } from "~/trpc/server";
export default async function ScriptDisplay() {
  const projectData = await api.scriptData.getAll({ dataSource: "public" });
  return (
    <div>
      <div className="">
        <ScriptProvider>
          <div className="flex w-full flex-1 flex-col">
            <ScriptBox data={projectData} />
          </div>
        </ScriptProvider>
      </div>
    </div>
  );
}
