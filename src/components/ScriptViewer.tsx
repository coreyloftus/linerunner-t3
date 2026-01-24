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

  // Fetch public, shared, and user data
  const { data: publicData } = api.scriptData.getAll.useQuery(
    { dataSource: "public" },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );

  const { data: sharedData } = api.scriptData.getAll.useQuery(
    { dataSource: "shared" },
    {
      enabled: !!session?.user,
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

  // Determine which data to use based on selected project source
  const getCurrentData = () => {
    if (!selectedProject) return data;

    switch (selectedProject.source) {
      case "public":
        return publicData ?? data;
      case "shared":
        return sharedData ?? data;
      case "user":
        return userData ?? data;
      default:
        return data;
    }
  };

  const currentData = getCurrentData();

  const script = currentData.allData
    .find((project) => project.project === selectedProject?.name)
    ?.scenes.find((scene) => scene.title === selectedScene);

  const formatScriptForDisplay = () => {
    if (!script?.lines) {
      return "No script selected. Please choose a project, scene, and character to view the script.";
    }

    return script.lines
      .map((line, index) => {
        // Mobile-optimized line number formatting - shorter on mobile
        const lineNumber = (index + 1).toString().padStart(2, " ");
        const isCurrentLine = index === currentLineIndex;
        const currentLineIndicator = isCurrentLine ? "▶ " : "  ";

        const characterDisplay = line.characters.join(" & ");
        let lineText = `${lineNumber} | ${characterDisplay}: ${line.line}`;

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
          lineText = `${lineNumber} | ${characterDisplay}: ${highlightedWords.join(" ")}`;
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
    <div className="flex h-[90dvh] w-[95dvw] flex-col rounded-md border-2 border-stone-200 bg-stone-100 supports-[height:100svh]:h-[90svh] dark:bg-stone-900">
      <div className="flex h-full flex-col rounded-md">
        {/* Mobile-optimized header */}
        <div className="iphone:flex-row iphone:items-center iphone:justify-between iphone:px-4 iphone:py-3 flex flex-col border-b border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-800">
          <h2 className="text-mobile-base iphone:text-lg iphone:mb-0 mb-1 font-semibold text-stone-900 dark:text-stone-100">
            Script Viewer
          </h2>
          <div className="text-mobile-xs iphone:text-sm text-stone-600 dark:text-stone-400">
            {getStatusText()}
          </div>
        </div>

        {/* Mobile-optimized content area */}
        <div className="flex-1 overflow-hidden">
          <Textarea
            value={formatScriptForDisplay()}
            readOnly
            className="text-mobile-sm iphone:text-mobile-base iphone:leading-loose iphone:p-4 h-full min-h-[60px] 
                      resize-none overflow-y-auto border-0 
                      bg-transparent p-3
                      font-mono leading-relaxed text-stone-900
                      [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain] [touch-action:pan-y]
                      focus-visible:ring-0
                      dark:text-stone-100 md:text-sm"
            placeholder="No script selected..."
          />
        </div>
      </div>
    </div>
  );
}
