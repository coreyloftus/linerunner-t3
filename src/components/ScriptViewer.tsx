"use client";
import { useContext } from "react";
import { ScriptContext } from "~/app/context";
import { type ProjectJSON } from "../server/api/routers/scriptData";
import { Textarea } from "./ui/textarea";

interface ScriptViewerProps {
  data: {
    projects: string[];
    allData: ProjectJSON[];
  };
}

export default function ScriptViewer({ data }: ScriptViewerProps) {
  const { selectedProject, selectedScene } = useContext(ScriptContext);

  const script = data.allData
    .find((project) => project.project === selectedProject)
    ?.scenes.find((scene) => scene.title === selectedScene);

  const formatScriptForDisplay = () => {
    if (!script?.lines) {
      return "No script selected. Please choose a project, scene, and character to view the script.";
    }

    return script.lines
      .map((line, index) => {
        const lineNumber = (index + 1).toString().padStart(3, " ");
        return `${lineNumber} | ${line.character}: ${line.line}`;
      })
      .join("\n");
  };

  return (
    <div className="flex h-[90dvh] w-[80dvw] flex-col rounded-md border-2 border-stone-200">
      <div className="flex h-full flex-col rounded-md">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Script Viewer
          </h2>
        </div>

        <div className="flex-1 p-4">
          <Textarea
            value={formatScriptForDisplay()}
            readOnly
            className="h-full min-h-[60px] resize-none border-0 bg-transparent text-sm leading-relaxed text-stone-100 focus-visible:ring-0 dark:text-stone-100"
            placeholder="No script selected..."
          />
        </div>
      </div>
    </div>
  );
}
