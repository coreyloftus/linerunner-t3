"use client";

import { useContext, useState } from "react";
import {
  FaPlay,
  FaPen,
  FaPlus,
  FaChevronDown,
  FaShareNodes,
  FaCopy,
} from "react-icons/fa6";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import { ScriptContext, type ProjectSource } from "~/app/context";
import { api } from "~/trpc/react";
import { LOCAL_SOURCE_ENABLED } from "~/lib/sources";
import { useMyShows } from "~/hooks/useMyShows";
import { useOpenShow } from "~/hooks/useOpenShow";
import { Button } from "./ui/button";
import { ScriptData } from "./ScriptData";
import { AddScriptDoc } from "./AddScriptDoc";
import { NewUserWelcome, SignedOutWelcome } from "./Welcome";
import { ShareShowDialog } from "./ShareShowDialog";

interface GetAllResponse {
  projects: string[];
  allData: ProjectJSON[];
}

export type WorkspaceView = "library" | "editor" | "new";

interface ScriptsWorkspaceProps {
  data: GetAllResponse;
  onPractice: () => void;
  initialView?: WorkspaceView;
}

interface LibraryShow {
  project: ProjectJSON;
  source: ProjectSource;
}

interface LibrarySection {
  key: string;
  title: string;
  shows: LibraryShow[];
  emptyNote?: string;
}

const VIEW_LABELS: { value: WorkspaceView; label: string }[] = [
  { value: "library", label: "Library" },
  { value: "editor", label: "Editor" },
  { value: "new", label: "Add" },
];

const SECTION_LABEL =
  "text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground";

// "corey@example.com" reads as "corey"
const ownerName = (email: string) => email.split("@")[0] ?? email;

export function ScriptsWorkspace({
  data,
  onPractice,
  initialView = "library",
}: ScriptsWorkspaceProps) {
  const { selectedProject, selectedScene } = useContext(ScriptContext);
  const openShow = useOpenShow();
  const [view, setView] = useState<WorkspaceView>(initialView);
  const [expandedShow, setExpandedShow] = useState<string | null>(null);
  const [sharing, setSharing] = useState<{
    name: string;
    mode: "owner" | "shared";
  } | null>(null);
  const { signedIn, sessionLoading, shows: myShows, isEmpty } = useMyShows();

  const { data: localData } = api.scriptData.getAll.useQuery(
    { dataSource: "local" },
    { enabled: LOCAL_SOURCE_ENABLED, refetchOnWindowFocus: false },
  );
  const { data: publicData } = api.scriptData.getAll.useQuery(
    { dataSource: "public" },
    { refetchOnWindowFocus: false },
  );
  const publicShows = (publicData?.allData ?? data.allData).map((project) => ({
    project,
    source: "public" as const,
  }));

  const sections: LibrarySection[] = [];
  if (signedIn && !isEmpty) {
    sections.push({ key: "mine", title: "My shows", shows: myShows });
  }
  sections.push({
    key: "public",
    title: signedIn ? "Public Library" : "Try a demo",
    shows: publicShows,
  });
  if (LOCAL_SOURCE_ENABLED) {
    sections.push({
      key: "local",
      title: "On this machine",
      shows: (localData?.allData ?? []).map((project) => ({
        project,
        source: "local" as const,
      })),
      emptyNote: "No JSON files in data/sceneData.",
    });
  }

  const projectCharacters = (project: ProjectJSON) => {
    const chars = project.scenes.flatMap((scene) =>
      scene.lines.flatMap((line) => line.characters),
    );
    return [...new Set(chars)];
  };

  const handleEdit = (show: LibraryShow, sceneTitle: string) => {
    openShow(show.project.project, show.source, sceneTitle);
    setView("editor");
  };

  const handlePractice = (show: LibraryShow, sceneTitle: string) => {
    openShow(show.project.project, show.source, sceneTitle);
    onPractice();
  };

  const handleTryDemo = () => {
    const demo = publicShows[0];
    const scene = demo?.project.scenes[0]?.title;
    if (demo && scene) handlePractice(demo, scene);
  };

  const handleSaved = (projectName: string, sceneTitle: string) => {
    openShow(projectName, "user", sceneTitle);
    onPractice();
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface">
      {/* Workspace header */}
      <div className="flex min-h-14 items-center justify-between gap-2 border-b border-border bg-surface-raised/90 py-2 pl-14 pr-3 iphone:pr-4 md:pl-4">
        <h2 className="font-display text-mobile-base font-semibold iphone:text-lg">
          Scripts
        </h2>
        <div className="flex rounded-lg border border-border bg-surface p-0.5">
          {VIEW_LABELS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={`flex min-h-[40px] items-center gap-1.5 rounded-md px-3 text-mobile-xs font-medium transition-colors iphone:text-sm ${
                view === value
                  ? "bg-accent font-semibold text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {value === "new" && <FaPlus className="h-3 w-3" />}
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
              {!signedIn && !sessionLoading && (
                <div className="py-6">
                  <SignedOutWelcome onTryDemo={handleTryDemo} />
                </div>
              )}
              {isEmpty && (
                <div className="py-6">
                  <NewUserWelcome onAddScript={() => setView("new")} />
                </div>
              )}

              {sections.map((section) => (
                <section key={section.key}>
                  <div className="mb-2 flex items-center gap-3">
                    <p className={SECTION_LABEL}>{section.title}</p>
                    <span className="h-px flex-1 bg-border" />
                    {section.key === "mine" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setView("new")}
                        className="gap-1.5 border-border bg-surface-raised hover:bg-muted dark:border-border dark:bg-surface-raised dark:hover:bg-muted"
                      >
                        <FaPlus className="h-3 w-3" />
                        Add a script
                      </Button>
                    )}
                  </div>

                  {section.shows.length === 0 ? (
                    <p className="py-3 font-script text-sm text-muted-foreground">
                      {section.emptyNote ?? "Nothing here yet."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {section.shows.map((show) => {
                        const { project, source } = show;
                        const showKey = `${source}:${project.project}`;
                        const isExpanded = expandedShow === showKey;
                        const characters = projectCharacters(project);
                        return (
                          <div
                            key={showKey}
                            className="overflow-hidden rounded-xl border border-border bg-surface-raised/60"
                          >
                            <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedShow(isExpanded ? null : showKey)
                              }
                              aria-expanded={isExpanded}
                              className="flex min-h-[56px] min-w-0 flex-1 items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 iphone:px-4"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-display text-base font-semibold">
                                  {project.project}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {project.sharedBy && (
                                    <span
                                      title={project.sharedBy}
                                      className="mr-1.5 inline-block rounded-full bg-accent-soft px-2 py-0.5 font-medium text-foreground"
                                    >
                                      Shared by {ownerName(project.sharedBy)}
                                    </span>
                                  )}
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
                            {(source === "user" || source === "shared") && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSharing({
                                    name: project.project,
                                    mode: source === "user" ? "owner" : "shared",
                                  })
                                }
                                className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                                aria-label={`${source === "user" ? "Share" : "Copy"} ${project.project}`}
                              >
                                {source === "user" ? (
                                  <FaShareNodes className="h-4 w-4" />
                                ) : (
                                  <FaCopy className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            </div>

                            {isExpanded && (
                              <ul className="border-t border-border">
                                {project.scenes.map((scene) => {
                                  const isCurrent =
                                    selectedProject?.name === project.project &&
                                    selectedProject.source === source &&
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
                                            handlePractice(show, scene.title)
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
                                            handleEdit(show, scene.title)
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
        {view === "new" && <AddScriptDoc onSaved={handleSaved} />}
      </div>
      {sharing && (
        <ShareShowDialog
          projectName={sharing.name}
          mode={sharing.mode}
          open
          onOpenChange={(open) => !open && setSharing(null)}
        />
      )}
    </div>
  );
}
