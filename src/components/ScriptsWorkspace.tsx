"use client";

import { useContext, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FaPlay, FaPen, FaPlus, FaChevronDown } from "react-icons/fa6";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import { ScriptContext, type ProjectSource } from "~/app/context";
import { api } from "~/trpc/react";
import { Button } from "./ui/button";
import { ScriptData } from "./ScriptData";
import { AddScriptDoc } from "./AddScriptDoc";

interface GetAllResponse {
  projects: string[];
  allData: ProjectJSON[];
}

interface ScriptsWorkspaceProps {
  data: GetAllResponse;
  onPractice: () => void;
}

type WorkspaceView = "library" | "editor" | "new";

interface LibrarySection {
  key: ProjectSource;
  title: string;
  projects: ProjectJSON[];
  emptyNote?: string;
}

const VIEW_LABELS: { value: WorkspaceView; label: string }[] = [
  { value: "library", label: "Library" },
  { value: "editor", label: "Editor" },
  { value: "new", label: "Add New" },
];

export function ScriptsWorkspace({ data, onPractice }: ScriptsWorkspaceProps) {
  const { data: session } = useSession();
  const {
    setSelectedProject,
    setSelectedScene,
    setSelectedCharacter,
    selectedProject,
    selectedScene,
  } = useContext(ScriptContext);
  const [view, setView] = useState<WorkspaceView>("library");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const { data: publicData } = api.scriptData.getAll.useQuery(
    { dataSource: "public" },
    { refetchOnWindowFocus: false },
  );
  const { data: sharedData } = api.scriptData.getAll.useQuery(
    { dataSource: "shared" },
    { enabled: !!session?.user, refetchOnWindowFocus: false },
  );
  const { data: userData } = api.scriptData.getAll.useQuery(
    { dataSource: "firestore" },
    { enabled: !!session?.user, refetchOnWindowFocus: false },
  );

  const sections: LibrarySection[] = useMemo(
    () => [
      {
        key: "user",
        title: "Your Scripts",
        projects: userData?.allData ?? [],
        emptyNote: session?.user
          ? "Nothing here yet — import a script with Add New."
          : "Sign in to keep your own scripts.",
      },
      {
        key: "shared",
        title: "Shared With You",
        projects: sharedData?.allData ?? [],
      },
      {
        key: "public",
        title: "Public Library",
        projects: publicData?.allData ?? data.allData,
      },
    ],
    [userData, sharedData, publicData, data, session],
  );

  const projectCharacters = (project: ProjectJSON) => {
    const chars = project.scenes.flatMap((scene) =>
      scene.lines.flatMap((line) => line.characters),
    );
    return [...new Set(chars)];
  };

  const selectScene = (
    project: ProjectJSON,
    source: ProjectSource,
    sceneTitle: string,
  ) => {
    setSelectedProject({ name: project.project, source });
    setSelectedScene(sceneTitle);
    setSelectedCharacter("");
  };

  const handleEdit = (
    project: ProjectJSON,
    source: ProjectSource,
    sceneTitle: string,
  ) => {
    selectScene(project, source, sceneTitle);
    setView("editor");
  };

  const handlePractice = (
    project: ProjectJSON,
    source: ProjectSource,
    sceneTitle: string,
  ) => {
    selectScene(project, source, sceneTitle);
    onPractice();
  };

  return (
    <div className="flex h-[90dvh] w-[95dvw] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/5 supports-[height:100svh]:h-[90svh] dark:shadow-black/40">
      {/* Workspace header */}
      <div className="flex items-center justify-between border-b border-border bg-surface-raised/90 px-3 py-2 iphone:px-4">
        <h2 className="font-display text-mobile-base font-semibold iphone:text-lg">
          Scripts
        </h2>
        <div className="flex rounded-lg border border-border bg-surface p-0.5">
          {VIEW_LABELS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={`rounded-md px-3 py-1.5 text-mobile-xs font-medium transition-colors iphone:text-sm ${
                view === value
                  ? "bg-accent font-semibold text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1">
        {view === "library" && (
          <div className="h-full overflow-y-auto p-3 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain] iphone:p-4">
            <div className="mx-auto max-w-3xl space-y-6">
              {sections.map((section) => (
                <section key={section.key}>
                  <div className="mb-2 flex items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {section.title}
                    </p>
                    <span className="h-px flex-1 bg-border" />
                    {section.key === "user" && session?.user && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setView("new")}
                        className="gap-1.5"
                      >
                        <FaPlus className="h-3 w-3" />
                        New Script
                      </Button>
                    )}
                  </div>

                  {section.projects.length === 0 ? (
                    <p className="py-3 font-script text-sm text-muted-foreground">
                      {section.emptyNote ?? "Nothing here yet."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {section.projects.map((project) => {
                        const projectKey = `${section.key}:${project.project}`;
                        const isExpanded = expandedProject === projectKey;
                        const characters = projectCharacters(project);
                        return (
                          <div
                            key={projectKey}
                            className="overflow-hidden rounded-xl border border-border bg-surface-raised/60"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedProject(
                                  isExpanded ? null : projectKey,
                                )
                              }
                              className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 iphone:px-4"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-display text-base font-semibold">
                                  {project.project}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {project.scenes.length}{" "}
                                  {project.scenes.length === 1
                                    ? "scene"
                                    : "scenes"}
                                  {characters.length > 0 && (
                                    <> · {characters.slice(0, 4).join(", ")}
                                    {characters.length > 4 &&
                                      ` +${characters.length - 4}`}</>
                                  )}
                                </p>
                              </div>
                              <FaChevronDown
                                className={`h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </button>

                            {isExpanded && (
                              <ul className="border-t border-border">
                                {project.scenes.map((scene) => {
                                  const isCurrent =
                                    selectedProject?.name === project.project &&
                                    selectedProject.source === section.key &&
                                    selectedScene === scene.title;
                                  return (
                                    <li
                                      key={scene.title}
                                      className={`flex items-center justify-between gap-2 px-3 py-2 iphone:px-4 ${isCurrent ? "bg-accent/10" : ""}`}
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate text-sm">
                                          {scene.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {scene.lines.length}{" "}
                                          {scene.lines.length === 1
                                            ? "line"
                                            : "lines"}
                                        </p>
                                      </div>
                                      <div className="flex flex-shrink-0 gap-1.5">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handlePractice(
                                              project,
                                              section.key,
                                              scene.title,
                                            )
                                          }
                                          className="gap-1.5"
                                          aria-label={`Practice ${scene.title}`}
                                        >
                                          <FaPlay className="h-3 w-3" />
                                          <span className="hidden iphone:inline">
                                            Practice
                                          </span>
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleEdit(
                                              project,
                                              section.key,
                                              scene.title,
                                            )
                                          }
                                          className="gap-1.5"
                                          aria-label={`Edit ${scene.title}`}
                                        >
                                          <FaPen className="h-3 w-3" />
                                          <span className="hidden iphone:inline">
                                            Edit
                                          </span>
                                        </Button>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        )}

        {view === "editor" && <ScriptData data={data} />}
        {view === "new" && <AddScriptDoc />}
      </div>
    </div>
  );
}
