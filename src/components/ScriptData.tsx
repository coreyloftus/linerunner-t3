"use client";

import { type ProjectJSON } from "~/server/api/routers/scriptData";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { ScriptContext } from "~/app/context";
import { useContext, useState, useEffect, useMemo } from "react";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { useSession } from "next-auth/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MultiCharacterSelect } from "./ui/multi-character-select";

interface ScriptDataProps {
  data: {
    projects: string[];
    allData: ProjectJSON[];
  };
}

interface FormLine {
  id: string;
  characters: string[];
  line: string;
  sung: boolean;
}

interface FormData {
  projectName: string;
  sceneTitle: string;
  lines: FormLine[];
}

// Sortable line item component
interface SortableLineItemProps {
  line: FormLine;
  index: number;
  onUpdate: (
    id: string,
    field: keyof FormLine,
    value: string | string[] | boolean,
  ) => void;
  onRemove: (id: string) => void;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  characterSuggestion?: string;
  availableCharacters: string[];
}

const SortableLineItem = ({
  line,
  index,
  onUpdate,
  onRemove,
  errors,
  warnings,
  characterSuggestion,
  availableCharacters,
}: SortableLineItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: line.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate dynamic height for textarea based on content
  const calculateTextareaRows = (text: string) => {
    if (!text) return 1;
    const lines = text.split('\n').length;
    const estimatedLines = Math.ceil(text.length / 50); // Rough estimate: 50 chars per line
    return Math.max(lines, Math.min(estimatedLines, 6)); // Min 1, max 6 rows
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border border-stone-200 bg-stone-100 p-3 dark:border-stone-700 dark:bg-stone-800"
    >
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile: First Row - Line Number, Character Name, Sung Switch, Remove Button */}
        <div className="mb-3 flex items-center gap-2">
          {/* Line Number */}
          <div className="flex-shrink-0 text-mobile-sm font-medium text-stone-400">
            #{index + 1}
          </div>
          
          {/* Character Name Input */}
          <div className="relative flex-1">
            <MultiCharacterSelect
              value={line.characters}
              onChange={(chars) => onUpdate(line.id, "characters", chars)}
              availableCharacters={availableCharacters}
              placeholder="Select character(s)"
              error={!!errors[`character-${line.id}`]}
              className="min-h-[44px]"
            />
          </div>

          {/* Sung Switch */}
          <div className="flex flex-shrink-0 items-center space-x-1">
            <Switch
              checked={line.sung}
              onCheckedChange={(checked) => onUpdate(line.id, "sung", checked)}
            />
            <Label className="text-mobile-xs text-stone-300">Sung</Label>
          </div>

          {/* Remove Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(line.id)}
            className="h-10 w-10 flex-shrink-0 touch-manipulation border-red-600 bg-red-900 p-0 text-red-300 hover:bg-red-800 hover:text-red-200 active:bg-red-800"
          >
            ×
          </Button>
        </div>

        {/* Mobile: Second Row - Line Text (Full Width with More Space) */}
        <div className="space-y-1">
          <Textarea
            placeholder="Line text"
            value={line.line}
            onChange={(e) => onUpdate(line.id, "line", e.target.value)}
            className={`text-mobile-base min-h-[88px] resize-none border-stone-200 bg-stone-100 text-stone-900 placeholder:text-stone-400 focus:border-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 ${errors[`line-${line.id}`] ? "border-red-500" : warnings[`line-${line.id}`] ? "border-yellow-500" : ""}`}
            rows={3}
          />
          {errors[`character-${line.id}`] && (
            <p className="text-xs text-red-400">
              {errors[`character-${line.id}`]}
            </p>
          )}
          {warnings[`character-${line.id}`] && (
            <p className="text-xs text-yellow-400">
              {warnings[`character-${line.id}`]}
            </p>
          )}
          {errors[`line-${line.id}`] && (
            <p className="text-xs text-red-400">{errors[`line-${line.id}`]}</p>
          )}
          {warnings[`line-${line.id}`] && (
            <p className="text-xs text-yellow-400">
              {warnings[`line-${line.id}`]}
            </p>
          )}
        </div>

        {/* Drag Handle for Mobile */}
        <div className="mt-2 flex justify-center">
          <div
            className="flex h-6 w-12 cursor-grab touch-manipulation items-center justify-center rounded bg-stone-700 hover:bg-stone-600 active:bg-stone-600"
            {...attributes}
            {...listeners}
          >
            <div className="text-sm text-stone-400 hover:text-stone-300">⋮⋮</div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-12 md:items-start md:gap-3">
        {/* Desktop: Drag Handle */}
        <div
          className="col-span-1 flex cursor-grab items-center justify-center pt-2"
          {...attributes}
          {...listeners}
        >
          <div className="text-sm text-stone-900 hover:text-stone-300 dark:text-stone-600 dark:hover:text-stone-500">
            ⋮⋮
          </div>
        </div>

        {/* Desktop: Line Number */}
        <div className="col-span-1 pt-2 text-sm text-stone-900 dark:text-stone-600">
          {index + 1}
        </div>

        {/* Desktop: Character Name */}
        <div className="col-span-2 space-y-1">
          <MultiCharacterSelect
            value={line.characters}
            onChange={(chars) => onUpdate(line.id, "characters", chars)}
            availableCharacters={availableCharacters}
            placeholder="Select character(s)"
            error={!!errors[`character-${line.id}`]}
            className="min-h-[36px]"
          />
          {errors[`character-${line.id}`] && (
            <p className="text-xs text-red-400">
              {errors[`character-${line.id}`]}
            </p>
          )}
          {warnings[`character-${line.id}`] && (
            <p className="text-xs text-yellow-400">
              {warnings[`character-${line.id}`]}
            </p>
          )}
        </div>

        {/* Desktop: Line Text with Dynamic Height */}
        <div className="col-span-6 space-y-1">
          <Textarea
            placeholder="Line text"
            value={line.line}
            onChange={(e) => onUpdate(line.id, "line", e.target.value)}
            className={`text-sm resize-none border-stone-200 bg-stone-100 text-stone-900 placeholder:text-stone-400 focus:border-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 ${errors[`line-${line.id}`] ? "border-red-500" : warnings[`line-${line.id}`] ? "border-yellow-500" : ""}`}
            rows={calculateTextareaRows(line.line)}
          />
          {errors[`line-${line.id}`] && (
            <p className="text-xs text-red-400">{errors[`line-${line.id}`]}</p>
          )}
          {warnings[`line-${line.id}`] && (
            <p className="text-xs text-yellow-400">
              {warnings[`line-${line.id}`]}
            </p>
          )}
        </div>

        {/* Desktop: Sung Checkbox */}
        <div className="col-span-1 flex items-center justify-center pt-2">
          <div className="flex flex-col items-center space-y-1">
            <Switch
              checked={line.sung}
              onCheckedChange={(checked) => onUpdate(line.id, "sung", checked)}
            />
            <Label className="text-xs text-stone-900 dark:text-stone-600">
              Sung
            </Label>
          </div>
        </div>

        {/* Desktop: Remove Button */}
        <div className="col-span-1 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(line.id)}
            className="h-8 w-8 border-red-600 bg-red-900 p-0 text-red-300 hover:bg-red-800 hover:text-red-200 dark:border-red-600 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 dark:hover:text-red-200"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ScriptData = ({ data }: ScriptDataProps) => {
  const { data: session } = useSession();
  const { selectedProject, selectedScene, selectedCharacter } =
    useContext(ScriptContext);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    sceneTitle: "",
    lines: [],
  });
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [characterSuggestions, setCharacterSuggestions] = useState<
    Record<string, string>
  >({});

  // JSON editor mode
  const [editorMode, setEditorMode] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Calculate available characters from all lines in the current form
  const availableCharacters = useMemo(() => {
    const allCharacters = formData.lines.flatMap((line) => line.characters);
    return [...new Set(allCharacters)].filter(Boolean).sort();
  }, [formData.lines]);

  // Fetch public data (always available)
  const { data: publicData, refetch } = api.scriptData.getAll.useQuery(
    { dataSource: "public" },
    {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  // Fetch user data (only if authenticated)
  const { data: userData } = api.scriptData.getAll.useQuery(
    { dataSource: "firestore" },
    {
      enabled: !!session?.user,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  // Determine which data source to use based on selected project
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

  // Only find script if all required context values are present
  const script =
    selectedProject && selectedScene && selectedCharacter
      ? currentData.allData
          .find((project) => project.project === selectedProject)
          ?.scenes.find((scene) => scene.title === selectedScene)
      : null;

  // Convert form data to JSON for the editor
  const formDataToJson = (fd: FormData): string => {
    const sceneData = {
      title: fd.sceneTitle,
      lines: fd.lines.map((line) => ({
        characters: line.characters,
        line: line.line,
        ...(line.sung && { sung: true }),
      })),
    };
    return JSON.stringify(sceneData, null, 2);
  };

  // Convert JSON to form data
  const jsonToFormData = (
    json: string,
    projectName: string,
  ): FormData | null => {
    try {
      const parsed = JSON.parse(json) as {
        title: string;
        lines: { characters: string[]; line: string; sung?: boolean }[];
      };

      if (!parsed.title || !Array.isArray(parsed.lines)) {
        throw new Error("Invalid JSON structure");
      }

      return {
        projectName,
        sceneTitle: parsed.title,
        lines: parsed.lines.map((line, index) => ({
          id: `line-${index}-${Date.now()}`,
          characters: line.characters ?? [],
          line: line.line ?? "",
          sung: line.sung ?? false,
        })),
      };
    } catch {
      return null;
    }
  };

  // Load script data into form when script changes
  useEffect(() => {
    if (script && selectedProject && selectedScene) {
      const newFormData: FormData = {
        projectName: selectedProject,
        sceneTitle: selectedScene,
        lines: script.lines.map((line, index) => ({
          id: `line-${index}`,
          characters: line.characters,
          line: line.line,
          sung: line.sung ?? false,
        })),
      };

      setFormData(newFormData);
      setOriginalData(newFormData);
      setJsonText(formDataToJson(newFormData));
      setJsonError(null);
      setHasChanges(false);
      setErrors({});
      setWarnings({});
      setCharacterSuggestions({});
    }
  }, [script, selectedProject, selectedScene]);

  // Track changes
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  // Sync JSON text when form data changes (if in form mode)
  useEffect(() => {
    if (editorMode === "form" && formData.lines.length > 0) {
      setJsonText(formDataToJson(formData));
    }
  }, [formData, editorMode]);

  // Handle JSON text changes
  const handleJsonChange = (newJson: string) => {
    setJsonText(newJson);

    // Validate JSON
    try {
      const parsed = JSON.parse(newJson) as unknown;
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("title" in parsed) ||
        !("lines" in parsed)
      ) {
        setJsonError("JSON must have 'title' and 'lines' properties");
        return;
      }
      setJsonError(null);

      // Update form data from valid JSON
      const newFormData = jsonToFormData(newJson, formData.projectName);
      if (newFormData) {
        setFormData(newFormData);
      }
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  // Handle mode switch
  const handleModeSwitch = (mode: "form" | "json") => {
    if (mode === "json") {
      // Update JSON from current form data
      setJsonText(formDataToJson(formData));
      setJsonError(null);
    }
    setEditorMode(mode);
  };

  const updateScriptMutation = api.scriptData.updateScript.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success!",
          description: data.message,
        });
        setOriginalData(formData);
        setHasChanges(false);
        // Refetch the data to show the updated script
        void refetch();
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

  // Utility functions
  const generateId = () => `line-${Date.now()}-${Math.random()}`;

  const standardizeCharacterName = (name: string): string => {
    return name
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const findSimilarCharacters = (inputName: string): string | undefined => {
    if (!inputName.trim()) return undefined;

    const standardizedInput = standardizeCharacterName(inputName);
    const existingCharacters = [
      ...new Set(
        formData.lines.flatMap((line) => line.characters.map((c) => c.trim())).filter(Boolean),
      ),
    ];

    // Simple similarity check - could be enhanced with fuzzy matching
    for (const existing of existingCharacters) {
      const standardizedExisting = standardizeCharacterName(existing);
      if (standardizedExisting !== standardizedInput) {
        // Check for simple variations
        if (
          standardizedExisting
            .toLowerCase()
            .includes(standardizedInput.toLowerCase()) ||
          standardizedInput
            .toLowerCase()
            .includes(standardizedExisting.toLowerCase()) ||
          levenshteinDistance(
            standardizedInput.toLowerCase(),
            standardizedExisting.toLowerCase(),
          ) <= 2
        ) {
          return standardizedExisting;
        }
      }
    }
    return undefined;
  };

  // Simple Levenshtein distance for character name similarity
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0]![j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1,
          );
        }
      }
    }
    return matrix[str2.length]![str1.length]!;
  };

  const findExactDuplicateLines = (): string[] => {
    const lineTexts = formData.lines.map((line) => line.line.trim());
    const duplicates: string[] = [];

    lineTexts.forEach((text, index) => {
      if (text && lineTexts.indexOf(text) !== index) {
        duplicates.push(formData.lines[index]?.id ?? "");
      }
    });

    return duplicates;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newWarnings: Record<string, string> = {};

    // Validate project name
    if (!formData.projectName.trim()) {
      newErrors.projectName = "Project name is required";
    }

    // Validate scene title
    if (!formData.sceneTitle.trim()) {
      newErrors.sceneTitle = "Scene title is required";
    }

    // Validate lines
    formData.lines.forEach((line) => {
      if (line.characters.length === 0 || line.characters.every((c) => !c.trim())) {
        newErrors[`character-${line.id}`] = "At least one character name is required";
      }
      if (!line.line.trim()) {
        newErrors[`line-${line.id}`] = "Line text is required";
      }
    });

    // Check for exact duplicates (warnings only, don't prevent submission)
    const duplicates = findExactDuplicateLines();
    duplicates.forEach((id) => {
      newWarnings[`line-${id}`] =
        "Duplicate line detected (characters may repeat lines intentionally)";
    });

    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  };

  // Event handlers
  const handleProjectNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, projectName: value }));
  };

  const handleSceneTitleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, sceneTitle: value }));
  };

  const handleLineChange = (
    id: string,
    field: keyof FormLine,
    value: string | string[] | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === id
          ? {
              ...line,
              [field]:
                field === "characters" && Array.isArray(value)
                  ? value.map(standardizeCharacterName)
                  : value,
            }
          : line,
      ),
    }));

    // Update character suggestions when characters field changes
    if (field === "characters" && Array.isArray(value) && value.length > 0) {
      // Check the first character for suggestions
      const firstChar = value[0];
      if (firstChar) {
        const suggestion = findSimilarCharacters(firstChar);
        setCharacterSuggestions((prev) => ({
          ...prev,
          [id]: suggestion ?? "",
        }));
      }
    }

    // Trigger validation to show duplicate warnings in real-time
    if (field === "line" && typeof value === "string") {
      // Use a timeout to debounce validation for performance
      setTimeout(() => validateForm(), 100);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFormData((prev) => {
        const oldIndex = prev.lines.findIndex((line) => line.id === active.id);
        const newIndex = prev.lines.findIndex((line) => line.id === over?.id);

        return {
          ...prev,
          lines: arrayMove(prev.lines, oldIndex, newIndex),
        };
      });
    }
  };

  const addLine = () => {
    const newLine: FormLine = {
      id: generateId(),
      characters: [],
      line: "",
      sung: false,
    };
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, newLine],
    }));
  };

  const removeLine = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((line) => line.id !== id),
    }));
    // Remove any character suggestions for the removed line
    setCharacterSuggestions((prev) => {
      const newSuggestions = { ...prev };
      delete newSuggestions[id];
      return newSuggestions;
    });
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the required field errors before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!script || !selectedProject || !selectedScene) return;

    try {
      // Convert form data back to the expected format
      const updatedScene = {
        title: formData.sceneTitle,
        lines: formData.lines.map((line) => ({
          characters: line.characters,
          line: line.line,
          sung: line.sung,
        })),
      };

      const updatedScript: ProjectJSON = {
        project: formData.projectName,
        scenes: [updatedScene],
      };

      updateScriptMutation.mutate({
        projectName: selectedProject, // Use original project name for lookup
        sceneTitle: selectedScene, // Use original scene title for lookup
        updatedScript: updatedScript,
        dataSource: "firestore",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save script data.",
        variant: "destructive",
      });
    }
  };

  // If user is not authenticated, show message
  if (!session?.user) {
    return (
      <div className="flex h-[90dvh] w-[95dvw] flex-col justify-center rounded-md border-2 border-stone-700 bg-stone-900 supports-[height:100svh]:h-[90svh]">
        <div className="px-4 text-center">
          <h2 className="text-mobile-lg iphone:text-lg mb-4 font-semibold text-stone-100">
            Authentication Required
          </h2>
          <p className="text-mobile-base iphone:text-base text-stone-400">
            Please sign in to edit scripts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[90dvh] w-[95dvw] flex-col rounded-md border-2 border-stone-200 bg-stone-100 font-mono supports-[height:100svh]:h-[90svh] dark:border-stone-700 dark:bg-stone-900">
      <div className="flex h-full flex-col rounded-md">
        {/* Header */}
        <div className="iphone:flex-row iphone:items-center iphone:justify-between iphone:space-y-0 iphone:px-4 iphone:py-3 flex flex-col space-y-2 border-b border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-800">
          <h2 className="text-mobile-base iphone:text-lg font-semibold text-stone-900 dark:text-stone-100">
            Script Data Editor
          </h2>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateScriptMutation.isPending || !script || (editorMode === "json" && !!jsonError)}
            variant="outline"
            size="sm"
            className="iphone:min-h-[36px] min-h-[44px] touch-manipulation border-stone-600 bg-stone-700 text-stone-100 hover:bg-stone-600 active:bg-stone-600 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600"
          >
            {updateScriptMutation.isPending ? "Saving..." : "Save Script"}
          </Button>
        </div>

        {/* Form Content */}
        <div className="iphone:p-4 flex-1 overflow-auto p-3 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain] [touch-action:pan-y]">
          {!script ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="text-stone-900 dark:text-stone-400">
                Please select a project, scene, and character to edit script
                data.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Project and Scene Row */}
              <div className="iphone:grid iphone:grid-cols-2 iphone:gap-4 iphone:space-y-0 flex flex-col space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="projectName"
                    className="text-mobile-sm iphone:text-sm text-stone-900 dark:text-stone-200"
                  >
                    Project Name
                  </Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => handleProjectNameChange(e.target.value)}
                    className={`iphone:min-h-[36px] text-mobile-base iphone:text-sm min-h-[44px] border-stone-200 bg-stone-100 text-stone-900 placeholder:text-stone-400 focus:border-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 ${errors.projectName ? "border-red-500" : ""}`}
                  />
                  {errors.projectName && (
                    <p className="text-mobile-xs iphone:text-sm text-red-400">
                      {errors.projectName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="sceneTitle"
                    className="text-mobile-sm iphone:text-sm text-stone-900 dark:text-stone-200"
                  >
                    Scene Title
                  </Label>
                  <Input
                    id="sceneTitle"
                    value={formData.sceneTitle}
                    onChange={(e) => handleSceneTitleChange(e.target.value)}
                    className={`iphone:min-h-[36px] text-mobile-base iphone:text-sm min-h-[44px] border-stone-200 bg-stone-100 text-stone-900 placeholder:text-stone-400 focus:border-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 ${errors.sceneTitle ? "border-red-500" : ""}`}
                  />
                  {errors.sceneTitle && (
                    <p className="text-mobile-xs iphone:text-sm text-red-400">
                      {errors.sceneTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Lines Section */}
              <div className="space-y-4">
                <div className="iphone:flex-row iphone:items-center iphone:justify-between iphone:space-y-0 flex flex-col space-y-2">
                  <h3 className="text-mobile-lg iphone:text-lg font-medium text-stone-100">
                    Lines ({formData.lines.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Editor Mode Toggle */}
                    <div className="flex rounded-md border border-stone-600 bg-stone-800">
                      <button
                        type="button"
                        onClick={() => handleModeSwitch("form")}
                        className={`px-3 py-1.5 text-sm transition-colors ${
                          editorMode === "form"
                            ? "bg-stone-600 text-stone-100"
                            : "text-stone-400 hover:text-stone-200"
                        }`}
                      >
                        Form
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeSwitch("json")}
                        className={`px-3 py-1.5 text-sm transition-colors ${
                          editorMode === "json"
                            ? "bg-stone-600 text-stone-100"
                            : "text-stone-400 hover:text-stone-200"
                        }`}
                      >
                        JSON
                      </button>
                    </div>
                    {editorMode === "form" && (
                      <Button
                        onClick={addLine}
                        variant="outline"
                        size="sm"
                        className="iphone:min-h-[36px] min-h-[44px] touch-manipulation border-stone-600 bg-stone-700 text-stone-100 hover:bg-stone-600 active:bg-stone-600"
                      >
                        Add Line
                      </Button>
                    )}
                  </div>
                </div>

                {/* Form Mode: Drag and Drop Context */}
                {editorMode === "form" && (
                  <>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={formData.lines.map((line) => line.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {formData.lines.map((line, index) => (
                            <SortableLineItem
                              key={line.id}
                              line={line}
                              index={index}
                              onUpdate={handleLineChange}
                              onRemove={removeLine}
                              errors={errors}
                              warnings={warnings}
                              characterSuggestion={characterSuggestions[line.id]}
                              availableCharacters={availableCharacters}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {formData.lines.length === 0 && (
                      <div className="py-8 text-center text-stone-400">
                        {`No lines yet. Click "Add Line" to get started.`}
                      </div>
                    )}

                    {formData.lines.length > 0 && (
                      <div className="flex justify-center pt-2">
                        <Button
                          onClick={addLine}
                          variant="outline"
                          size="sm"
                          className="iphone:min-h-[36px] min-h-[44px] touch-manipulation border-stone-600 bg-stone-700 text-stone-100 hover:bg-stone-600 active:bg-stone-600"
                        >
                          Add Line
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* JSON Mode: Raw JSON Editor */}
                {editorMode === "json" && (
                  <div className="space-y-2">
                    <div className="text-sm text-stone-400">
                      Edit the raw JSON for this scene. Format: {`{ "title": "Scene Title", "lines": [...] }`}
                    </div>
                    {jsonError && (
                      <div className="rounded-md border border-red-600 bg-red-900/50 p-3 text-sm text-red-300">
                        {jsonError}
                      </div>
                    )}
                    <Textarea
                      value={jsonText}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      className={`min-h-[400px] font-mono text-sm border-stone-200 bg-stone-100 text-stone-900 placeholder:text-stone-400 focus:border-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 ${jsonError ? "border-red-500" : ""}`}
                      placeholder='{"title": "Scene Title", "lines": [{"characters": ["Character Name"], "line": "Dialogue text", "sung": false}]}'
                    />
                  </div>
                )}
              </div>

              {/* Bottom Save Button */}
              <div className="flex justify-center border-t border-stone-700 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateScriptMutation.isPending || (editorMode === "json" && !!jsonError)}
                  className="min-h-[44px] touch-manipulation bg-blue-600 px-8 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-stone-600 disabled:text-stone-400"
                >
                  {updateScriptMutation.isPending ? "Saving..." : "Save Script"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
