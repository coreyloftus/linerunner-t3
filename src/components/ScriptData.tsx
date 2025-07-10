"use client";

import { type ProjectJSON } from "~/server/api/routers/scriptData";
import { Textarea } from "./ui/textarea";
import { ScriptContext } from "~/app/context";
import { useContext } from "react";
import { api } from "~/trpc/react";

interface ScriptDataProps {
  data: {
    projects: string[];
    allData: ProjectJSON[];
  };
}
export const ScriptData = ({ data }: ScriptDataProps) => {
  const { selectedProject, selectedScene, userConfig } =
    useContext(ScriptContext);

  // Dynamic data fetching based on data source
  const { data: dynamicData } = api.scriptData.getAll.useQuery(
    { dataSource: userConfig.dataSource },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );

  // Use dynamic data if available, otherwise fall back to static data
  const currentData = dynamicData ?? data;

  const script = currentData.allData
    .find((project) => project.project === selectedProject)
    ?.scenes.find((scene) => scene.title === selectedScene);

  return (
    <>
      <div className="flex h-[90dvh] w-[80dvw] flex-col rounded-md border-2 border-stone-200">
        <div className="flex h-full flex-col rounded-md">
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Line Data
            </h2>
          </div>
          <div className="flex-1 p-4">
            <Textarea
              value={JSON.stringify(script, null, 2)}
              readOnly
              className="h-full min-h-[60px] resize-none border-0 bg-transparent text-sm leading-relaxed text-stone-100 focus-visible:ring-0 dark:text-stone-100"
              placeholder="No script selected..."
            />
          </div>
        </div>
      </div>
    </>
  );
};
