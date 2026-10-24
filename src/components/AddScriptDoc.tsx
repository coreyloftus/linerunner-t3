"use client";

import { useContext, useState, useEffect, useRef } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScriptContext } from "~/app/context";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { signIn, useSession } from "next-auth/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { FileDropZone } from "./FileDropZone";
import { FaArrowLeft } from "react-icons/fa6";
import { applyRenames, parseScript, type ParsedLine } from "~/lib/parse-script";

const PRIMARY =
  "h-12 w-full rounded-xl bg-accent text-base font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 md:w-auto md:px-8";
const FIELD_LABEL = "mb-1.5 block text-sm font-medium";
const FIELD = "h-12 text-base md:h-10 md:text-sm";
const SECTION_LABEL =
  "text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground";

const INPUT_METHODS: { id: "text" | "file"; label: string }[] = [
  { id: "text", label: "Paste" },
  { id: "file", label: "Upload file" },
];

const SCRIPT_PLACEHOLDER = `Paste a scene here.

STANLEY
Stella!!!

BLANCHE: I have always depended on the kindness of strangers.`;

const FORMAT_EXAMPLES = [
  { title: "Name on its own line", example: "STANLEY\nStella!!!" },
  {
    title: "Name, colon, line",
    example: "NUNS: Have you seen Maria?",
  },
  {
    title: "Several characters at once",
    example: "MARIA & TONY: Tonight, tonight!\nNUNS/MOTHER ABBESS: How do you solve a problem like Maria?",
  },
  {
    title: "Sung lines in caps",
    example: "MARIA\nTHE HILLS ARE ALIVE WITH THE SOUND OF MUSIC",
  },
];

interface AddScriptDocProps {
  // Called after a scene is saved to the user's shows
  onSaved?: (projectName: string, sceneTitle: string) => void;
}

// Characters in order of first appearance
const charactersIn = (lines: ParsedLine[]) => [
  ...new Set(lines.flatMap((line) => line.characters)),
];

export const AddScriptDoc = ({ onSaved }: AddScriptDocProps = {}) => {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const {
    scriptCharacterNames,
    setScriptCharacterNames,
    newScriptBox,
    setNewScriptBox,
    isAdmin,
  } = useContext(ScriptContext);

  const [projectName, setProjectName] = useState("");
  const [sceneTitle, setSceneTitle] = useState("");
  const [isNewProject, setIsNewProject] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedSubcollection, setSelectedSubcollection] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [inputMethod, setInputMethod] = useState<"text" | "file">("text");
  const [copySourceUserId, setCopySourceUserId] = useState("");
  const [copyTargetUserId, setCopyTargetUserId] = useState("");
  const [copyProjectName, setCopyProjectName] = useState("");
  const [characterInput, setCharacterInput] = useState("");
  const [step, setStep] = useState<"input" | "preview">("input");
  const [parsedLines, setParsedLines] = useState<ParsedLine[]>([]);
  // Preview fixes: new display names, and characters folded into another one
  const [names, setNames] = useState<Record<string, string>>({});
  const [mergedInto, setMergedInto] = useState<Record<string, string>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Sync characterInput with scriptCharacterNames when it changes externally (e.g., form clear)
  useEffect(() => {
    if (scriptCharacterNames.length === 0 && characterInput !== "") {
      setCharacterInput("");
    }
  }, [scriptCharacterNames, characterInput]);

  // Fetch existing projects from public data
  const { data: publicData } = api.scriptData.getAll.useQuery(
    { dataSource: "public" },
    {
      enabled: true,
    },
  );

  // Fetch existing projects from user data
  const { data: userData, isLoading: isLoadingUserProjects } =
    api.scriptData.getAll.useQuery(
      { dataSource: "firestore" },
      {
        enabled: !!session?.user,
      },
    );

  // Fetch collections for admin mode
  const { data: collectionsData, isLoading: isLoadingCollections } =
    api.firebase.getCollections.useQuery(
      undefined,
      {
        enabled: !!session?.user && isAdmin && isAdminMode,
      },
    );

  // Fetch subcollections for selected collection
  const { data: subcollectionsData, isLoading: isLoadingSubcollections } =
    api.firebase.getSubcollections.useQuery(
      {
        collectionName: selectedCollection,
      },
      {
        enabled:
          !!session?.user && isAdmin && isAdminMode && !!selectedCollection,
      },
    );

  // Fetch document IDs for selected collection
  const { data: documentIdsData, isLoading: isLoadingDocumentIds } =
    api.firebase.getDocumentIds.useQuery(
      {
        collectionName: selectedCollection,
      },
      {
        enabled:
          !!session?.user && isAdmin && isAdminMode && !!selectedCollection,
      },
    );

  const createScriptMutation = api.scriptData.createScript.useMutation({
    onSuccess: async (data, variables) => {
      if (data.success) {
        toast({
          title: "Saved",
          description: `${variables.sceneTitle} is in ${variables.projectName}.`,
        });
        await utils.scriptData.getAll.invalidate();
        onSaved?.(variables.projectName, variables.sceneTitle);
        // Clear the form
        setProjectName("");
        setSceneTitle("");
        setNewScriptBox("");
        setScriptCharacterNames([]);
        setIsNewProject(false);
        resetPreview();
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyProjectMutation = api.scriptData.copyProjectBetweenUsers.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success!",
          description: data.message,
        });
        // Clear the form
        setCopySourceUserId("");
        setCopyTargetUserId("");
        setCopyProjectName("");
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAdminScriptMutation =
    api.scriptData.createAdminScript.useMutation({
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: "Success!",
            description: data.message,
          });
          // Clear the form
          setProjectName("");
          setSceneTitle("");
          setNewScriptBox("");
          setScriptCharacterNames([]);
          setIsNewProject(false);
          setSelectedCollection("");
          setSelectedDocumentId("");
          setSelectedSubcollection("");
          setIsAdminMode(false);
          resetPreview();
        } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  const handleAddCharacters = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCharacterInput(inputValue);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the parsing - wait 500ms after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      const characterNamesArray = inputValue
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
      setScriptCharacterNames(characterNamesArray);
    }, 500);
  };

  // Also parse on blur for immediate feedback when leaving the field
  const handleCharacterInputBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const characterNamesArray = characterInput
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    setScriptCharacterNames(characterNamesArray);
  };

  const handleProjectChange = (value: string) => {
    if (value === "new") {
      setIsNewProject(true);
      setProjectName("");
    } else {
      setIsNewProject(false);
      // Remove the icon prefix if present
      const cleanProjectName = value.replace(/^[👤📁]\s*/, "");
      setProjectName(cleanProjectName);
    }
  };

  const resetPreview = () => {
    setStep("input");
    setParsedLines([]);
    setNames({});
    setMergedInto({});
  };

  // Opens the preview for parsed lines; a PDF import can call this with its own lines
  const showPreview = (lines: ParsedLine[]) => {
    if (lines.length === 0) {
      toast({
        title: "No lines found",
        description:
          "Put each name in caps on its own line, or use NAME: line.",
        variant: "destructive",
      });
      return;
    }
    setParsedLines(lines);
    setNames({});
    setMergedInto({});
    setStep("preview");
  };

  const previewText = (script: string) => {
    if (!script.trim()) {
      toast({
        title: "Nothing to preview",
        description: "Paste a script or upload a file first.",
        variant: "destructive",
      });
      return;
    }
    showPreview(parseScript(script, scriptCharacterNames));
  };

  const handleFileContent = (content: string) => {
    setNewScriptBox(content);
    previewText(content);
  };

  // Follows merges to the character a name was folded into
  const rootOf = (name: string): string => {
    const seen = new Set<string>();
    let current = name;
    while (mergedInto[current] && !seen.has(current)) {
      seen.add(current);
      current = mergedInto[current]!;
    }
    return current;
  };
  const finalName = (name: string) => {
    const root = rootOf(name);
    return names[root]?.trim() ?? root;
  };
  const merge = (name: string, target: string) =>
    setMergedInto((prev) => ({ ...prev, [name]: target }));
  const unmerge = (name: string) =>
    setMergedInto(({ [name]: _removed, ...rest }) => rest);
  const originalCharacters = charactersIn(parsedLines);
  const renames = Object.fromEntries(
    originalCharacters.map((name) => [name, finalName(name) || name]),
  );
  const previewLines = applyRenames(parsedLines, renames);
  const lineCounts = parsedLines.reduce<Record<string, number>>((counts, line) => {
    line.characters.forEach((name) => (counts[name] = (counts[name] ?? 0) + 1));
    return counts;
  }, {});

  const handleCopyProject = () => {
    if (!copySourceUserId.trim()) {
      toast({
        title: "Error",
        description: "Please enter source user ID",
        variant: "destructive",
      });
      return;
    }

    if (!copyTargetUserId.trim()) {
      toast({
        title: "Error",
        description: "Please enter target user ID",
        variant: "destructive",
      });
      return;
    }

    if (!copyProjectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter project name",
        variant: "destructive",
      });
      return;
    }

    copyProjectMutation.mutate({
      sourceUserId: copySourceUserId.trim(),
      targetUserId: copyTargetUserId.trim(),
      projectName: copyProjectName.trim(),
    });
  };

  const handleAddScript = () => {
    if (!projectName.trim()) {
      toast({
        title: "Name the show",
        description: "Add a show name before you save.",
        variant: "destructive",
      });
      return;
    }

    if (!sceneTitle.trim()) {
      toast({
        title: "Name the scene",
        description: "Add a scene title before you save.",
        variant: "destructive",
      });
      return;
    }

    const parsedLines = previewLines;

    if (parsedLines.length === 0) {
      toast({
        title: "Error",
        description:
          "No valid lines found. Please check your script format and character names.",
        variant: "destructive",
      });
      return;
    }

    // Use admin mutation if in admin mode
    if (isAdminMode) {
      if (
        !selectedCollection ||
        !selectedDocumentId ||
        !selectedSubcollection
      ) {
        toast({
          title: "Error",
          description:
            "Please select collection, document ID, and subcollection",
          variant: "destructive",
        });
        return;
      }

      createAdminScriptMutation.mutate({
        projectName: projectName.trim(),
        sceneTitle: sceneTitle.trim(),
        lines: parsedLines,
        collectionName: selectedCollection,
        documentId: selectedDocumentId,
        subcollectionName: selectedSubcollection,
      });
    } else {
      // Outside admin mode a scene always goes to the user's own shows
      createScriptMutation.mutate({
        projectName: projectName.trim(),
        sceneTitle: sceneTitle.trim(),
        lines: parsedLines,
        dataSource: "firestore",
      });
    }
  };

  // If user is not authenticated, show message
  if (!session?.user) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <h2 className="mb-2 font-display text-2xl font-semibold">
            Sign in to add a script
          </h2>
          <p className="mb-6 font-script text-muted-foreground">
            Your shows stay with your account.
          </p>
          <Button onClick={() => signIn("google")} className={PRIMARY}>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]">
      <>
        <div className="mx-auto flex w-full max-w-3xl flex-col">
          <div className="flex flex-col">
            <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-2">
              {step === "preview" ? (
                <button
                  type="button"
                  onClick={() => setStep("input")}
                  className="-ml-2 flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <FaArrowLeft className="h-3.5 w-3.5" />
                  Edit text
                </button>
              ) : (
                <h3 className="font-display text-lg font-semibold">
                  Add a script
                </h3>
              )}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-stone-700 dark:text-stone-300">
                    Admin Mode:
                  </label>
                  <input
                    type="checkbox"
                    checked={isAdminMode}
                    onChange={(e) => setIsAdminMode(e.target.checked)}
                    className="rounded border-stone-300"
                  />
                </div>
              )}
            </div>

            {/* Admin Mode Configuration */}
            {isAdmin && isAdminMode && (
              <div className="flex flex-col gap-2 border-b border-stone-200 p-2">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Admin Configuration:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Collection:
                    </p>
                    <Select
                      onValueChange={setSelectedCollection}
                      value={selectedCollection}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select collection..." />
                      </SelectTrigger>
                      <SelectContent>
                        {collectionsData?.data?.map((collection) => (
                          <SelectItem key={collection} value={collection}>
                            {collection}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Document ID:
                    </p>
                    <Select
                      onValueChange={setSelectedDocumentId}
                      value={selectedDocumentId}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select document ID..." />
                      </SelectTrigger>
                      <SelectContent>
                        {documentIdsData?.data?.map((documentId) => (
                          <SelectItem key={documentId} value={documentId}>
                            {documentId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Subcollection:
                    </p>
                    <Select
                      onValueChange={setSelectedSubcollection}
                      value={selectedSubcollection}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select subcollection..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subcollectionsData?.data?.map((subcollection) => (
                          <SelectItem key={subcollection} value={subcollection}>
                            {subcollection}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Copy Project Between Users */}
                <div className="mt-4 border-t border-stone-200 pt-4 dark:border-stone-700">
                  <p className="mb-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                    Copy Project Between Users:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        Source User ID:
                      </p>
                      <Input
                        placeholder="user@example.com"
                        value={copySourceUserId}
                        onChange={(e) => setCopySourceUserId(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        Target User ID:
                      </p>
                      <Input
                        placeholder="user@example.com"
                        value={copyTargetUserId}
                        onChange={(e) => setCopyTargetUserId(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-2">
                      <p className="mb-1 text-xs text-muted-foreground">
                        Project Name:
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Project name to copy"
                          value={copyProjectName}
                          onChange={(e) => setCopyProjectName(e.target.value)}
                          className="h-8 flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={handleCopyProject}
                          disabled={copyProjectMutation.isPending}
                          className="h-8"
                        >
                          {copyProjectMutation.isPending ? "Copying..." : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "input" ? (
              <div className="flex flex-col gap-4 p-4">
                {/* How the script gets in; a PDF import adds a method here and calls showPreview */}
                <div className="flex rounded-xl border border-border bg-surface p-1">
                  {INPUT_METHODS.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setInputMethod(id)}
                      aria-pressed={inputMethod === id}
                      className={`min-h-[44px] flex-1 rounded-lg px-3 text-sm font-medium transition-colors ${
                        inputMethod === id
                          ? "bg-accent font-semibold text-accent-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {inputMethod === "text" ? (
                  <Textarea
                    value={newScriptBox}
                    onChange={(e) => setNewScriptBox(e.target.value)}
                    aria-label="Script text"
                    className="min-h-[40vh] resize-y rounded-xl border-border bg-surface-raised/60 p-3 font-script text-base leading-relaxed md:text-sm [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]"
                    placeholder={SCRIPT_PLACEHOLDER}
                  />
                ) : (
                  <FileDropZone
                    onFileContent={handleFileContent}
                    acceptedTypes={[".txt", ".md", ".rtf"]}
                  />
                )}

                <div>
                  <label htmlFor="character-names" className={FIELD_LABEL}>
                    Character names{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <Input
                    id="character-names"
                    placeholder="Rosencrantz, Guildenstern"
                    value={characterInput}
                    onChange={(e) => handleAddCharacters(e)}
                    onBlur={handleCharacterInputBlur}
                    className={FIELD}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Names in caps are found on their own. List any that get
                    missed.
                  </p>
                </div>

                <details className="rounded-xl border border-border bg-surface-raised/40 px-3">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center text-sm font-medium [&::-webkit-details-marker]:hidden">
                    Formats that work
                  </summary>
                  <div className="space-y-3 pb-3 text-xs text-muted-foreground">
                    {FORMAT_EXAMPLES.map(({ title, example }) => (
                      <div key={title}>
                        <p className="mb-1 font-medium text-foreground">
                          {title}
                        </p>
                        <pre className="whitespace-pre-wrap rounded-lg border border-border bg-surface p-2 font-script">
                          {example}
                        </pre>
                      </div>
                    ))}
                  </div>
                </details>

                <Button
                  onClick={() => previewText(newScriptBox)}
                  className={PRIMARY}
                >
                  Preview
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-6 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="show-name" className={FIELD_LABEL}>
                      Show
                    </label>
                    {(userData?.projects.length ?? 0) > 0 || isAdminMode ? (
                      <div className="space-y-2">
                        <Select
                          onValueChange={handleProjectChange}
                          value={isNewProject ? "new" : projectName}
                        >
                          <SelectTrigger id="show-name" className={FIELD}>
                            <SelectValue placeholder="Pick a show" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">+ New show</SelectItem>
                            {userData?.projects.map((project) => (
                              <SelectItem key={project} value={project}>
                                {project}
                              </SelectItem>
                            ))}
                            {/* Public shows only in admin mode */}
                            {isAdminMode &&
                              publicData?.projects.map((project) => (
                                <SelectItem
                                  key={`public:${project}`}
                                  value={project}
                                >
                                  📁 {project}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {isNewProject && (
                          <Input
                            placeholder="Show name"
                            aria-label="New show name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className={FIELD}
                          />
                        )}
                      </div>
                    ) : (
                      <Input
                        id="show-name"
                        placeholder="Show name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className={FIELD}
                      />
                    )}
                  </div>
                  <div>
                    <label htmlFor="scene-title" className={FIELD_LABEL}>
                      Scene
                    </label>
                    <Input
                      id="scene-title"
                      placeholder="Act 1, Scene 2"
                      value={sceneTitle}
                      onChange={(e) => setSceneTitle(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                </div>

                <section>
                  <p className={SECTION_LABEL}>
                    Characters · {new Set(Object.values(renames)).size}
                  </p>
                  <p className="mb-3 mt-1 text-sm text-muted-foreground">
                    Fix a name, or merge two into one.
                  </p>
                  <ul className="divide-y divide-border rounded-xl border border-border bg-surface-raised/60">
                    {originalCharacters.map((name) => {
                      const merged = !!mergedInto[name];
                      const count = lineCounts[name] ?? 0;
                      const countLabel = `${count} ${count === 1 ? "line" : "lines"}`;
                      return (
                        <li key={name} className="flex items-start gap-2 p-3">
                          {merged ? (
                            <>
                              <p className="min-h-[44px] min-w-0 flex-1 text-sm">
                                <span className="text-muted-foreground line-through">
                                  {name}
                                </span>{" "}
                                into{" "}
                                <span className="font-semibold">
                                  {finalName(name)}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {countLabel}
                                </span>
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => unmerge(name)}
                              >
                                Undo
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="min-w-0 flex-1">
                                <Input
                                  aria-label={`Name for ${name}`}
                                  value={names[name] ?? name}
                                  onChange={(e) =>
                                    setNames((prev) => ({
                                      ...prev,
                                      [name]: e.target.value,
                                    }))
                                  }
                                  className="h-11 font-semibold"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {countLabel}
                                </p>
                              </div>
                              {originalCharacters.length > 1 && (
                                <Select
                                  value=""
                                  onValueChange={(target) =>
                                    merge(name, target)
                                  }
                                >
                                  <SelectTrigger
                                    aria-label={`Merge ${name} into`}
                                    className="h-11 w-auto min-w-[6.5rem] text-sm"
                                  >
                                    <SelectValue placeholder="Merge" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {originalCharacters
                                      .filter(
                                        (other) =>
                                          other !== name && !mergedInto[other],
                                      )
                                      .map((other) => (
                                        <SelectItem key={other} value={other}>
                                          Into {finalName(other)}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section>
                  <p className={SECTION_LABEL}>
                    {sceneTitle.trim() || "Scene"} · {previewLines.length}{" "}
                    {previewLines.length === 1 ? "line" : "lines"}
                  </p>
                  <ol className="mt-3 space-y-3 rounded-xl border border-border bg-surface-raised/40 p-4">
                    {previewLines.map((line, index) => (
                      <li key={index}>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em]">
                          {line.characters.join(" & ")}
                        </p>
                        <p
                          className={`font-script text-sm leading-relaxed ${line.sung ? "italic text-muted-foreground" : ""}`}
                        >
                          {line.line}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>

                <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface/95 p-4 backdrop-blur-sm">
                  <Button
                    onClick={handleAddScript}
                    className={PRIMARY}
                    disabled={
                      createScriptMutation.isPending ||
                      createAdminScriptMutation.isPending ||
                      isLoadingUserProjects ||
                      (isAdminMode &&
                        (isLoadingCollections ||
                          isLoadingSubcollections ||
                          isLoadingDocumentIds))
                    }
                  >
                    {createScriptMutation.isPending ||
                    createAdminScriptMutation.isPending
                      ? "Saving…"
                      : "Save scene"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    </div>
  );
};

