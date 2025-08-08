"use client";
import { useContext } from "react";
import { ScriptContext } from "~/app/context";
import { type ProjectJSON } from "../server/api/routers/scriptData";
import { Textarea } from "./ui/textarea";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

interface ScriptViewerProps {
  data: {
    projects: string[];
    allData: ProjectJSON[];
  };
}

export default function ScriptViewer({ data }: ScriptViewerProps) {
  const { data: session } = useSession();
  const {
    selectedProject,
    selectedScene,
    currentLineIndex,
    wordIndex,
    playScene,
    currentLineSplit,
  } = useContext(ScriptContext);

  // Fetch both public and user data
  const { data: publicData } = api.scriptData.getAll.useQuery(
    { dataSource: "public" },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );

  const { data: userData } = api.scriptData.getAll.useQuery(
    { dataSource: "firestore" },
    {
      enabled: !!session?.user,
      refetchOnWindowFocus: false,
    },
  );

  // Determine which data to use based on selected project
  const getCurrentData = () => {
    if (!selectedProject) return data;

    const publicProjects = publicData?.projects ?? [];
    const userProjects = userData?.projects ?? [];

    if (publicProjects.includes(selectedProject)) {
      return publicData ?? data;
    }

    if (userProjects.includes(selectedProject)) {
      return userData ?? data;
    }

    return data;
  };

  const currentData = getCurrentData();

  const script = currentData.allData
    .find((project) => project.project === selectedProject)
    ?.scenes.find((scene) => scene.title === selectedScene);

  const formatScriptForDisplay = () => {
    if (!script?.lines) {
      return "No script selected. Please choose a project, scene, and character to view the script.";
    }

    return script.lines
      .map((line, index) => {
        const lineNumber = (index + 1).toString().padStart(3, " ");
        const isCurrentLine = index === currentLineIndex;
        const currentLineIndicator = isCurrentLine ? "▶ " : "   ";

        let lineText = `${lineNumber} | ${line.character}: ${line.line}`;

        // If this is the current line and we're in play mode, show word progress
        if (isCurrentLine && playScene && currentLineSplit.length > 0) {
          const words = line.line.split(" ");
          const highlightedWords = words.map((word, wordIdx) => {
            if (wordIdx < wordIndex) {
              return `[${word}]`; // Completed words
            } else if (wordIdx === wordIndex) {
              return `**${word}**`; // Current word
            } else {
              return word; // Future words
            }
          });
          lineText = `${lineNumber} | ${line.character}: ${highlightedWords.join(" ")}`;
        }

        return `${currentLineIndicator}${lineText}`;
      })
      .join("\n");
  };

  const getStatusText = () => {
    if (!script?.lines) return "No script loaded";

    const totalLines = script.lines.length;
    const currentLine = script.lines[currentLineIndex];

    if (!playScene)
      return (
        <p className="text-stone-900 dark:text-stone-100">
          Ready - Line {currentLineIndex + 1} of {totalLines}
        </p>
      );

    if (currentLine && currentLineSplit.length > 0) {
      return (
        <>
          <p className="text-stone-900 dark:text-stone-100">
            Line {currentLineIndex + 1} of {totalLines}
          </p>
          <p className="text-stone-900 dark:text-stone-100">
            {" "}
            Word {wordIndex + 1} of {currentLineSplit.length}
          </p>
        </>
      );
    }

    return (
      <p className="text-stone-900 dark:text-stone-100">
        Line {currentLineIndex + 1} of {totalLines}
      </p>
    );
  };

  return (
    <div className="flex h-[90dvh] w-[90dvw] flex-col rounded-md border-2 border-stone-200 bg-stone-100 dark:bg-stone-900">
      <div className="flex h-full flex-col rounded-md">
        <div className="flex items-center justify-between rounded-md border-b border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Script Viewer
          </h2>
          <div className="text-sm text-stone-600 dark:text-stone-400">
            {getStatusText()}
          </div>
        </div>

        <div className="p-y-2 flex-1">
          <Textarea
            value={formatScriptForDisplay()}
            readOnly
            className="h-full min-h-[60px] resize-none border-0 bg-transparent font-mono text-sm leading-relaxed text-stone-900 focus-visible:ring-0 dark:text-stone-100"
            placeholder="No script selected..."
          />
        </div>
      </div>
    </div>
  );
}
