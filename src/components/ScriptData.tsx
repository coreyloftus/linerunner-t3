"use client";

import { type ProjectJSON } from "~/server/api/routers/scriptData";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { ScriptContext } from "~/app/context";
import { useContext, useState, useEffect } from "react";
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

interface ScriptDataProps {
  data: {
    projects: string[];
    allData: ProjectJSON[];
  };
}

interface FormLine {
  id: string;
  character: string;
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
    value: string | boolean,
  ) => void;
  onRemove: (id: string) => void;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  characterSuggestion?: string;
}

const SortableLineItem = ({
  line,
  index,
  onUpdate,
  onRemove,
  errors,
  warnings,
  characterSuggestion,
}: SortableLineItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: line.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="iphone:grid iphone:grid-cols-12 iphone:items-start iphone:gap-2 flex flex-col gap-3 rounded-md border border-stone-700 bg-stone-800 p-3"
    >
      {/* Mobile: Top Row with Line Number and Drag Handle */}
      <div className="iphone:hidden flex items-center justify-between">
        <div className="text-mobile-sm font-medium text-stone-400">
          Line {index + 1}
        </div>
        <div
          className="flex h-8 w-8 cursor-grab touch-manipulation items-center justify-center rounded bg-stone-700 hover:bg-stone-600 active:bg-stone-600"
          {...attributes}
          {...listeners}
        >
          <div className="text-lg text-stone-400 hover:text-stone-300">⋮⋮</div>
        </div>
      </div>

      {/* Desktop: Drag Handle */}
      <div
        className="iphone:block iphone:col-span-1 hidden cursor-grab pt-2"
        {...attributes}
        {...listeners}
      >
        <div className="text-sm text-stone-400 hover:text-stone-300">⋮⋮</div>
      </div>

      {/* Desktop: Line Number */}
      <div className="iphone:block iphone:col-span-1 hidden pt-2 text-sm text-stone-400">
        {index + 1}
      </div>

      {/* Character Name */}
      <div className="iphone:col-span-3 space-y-1">
        <div className="iphone:hidden">
          <label className="text-mobile-xs font-medium text-stone-300">
            Character
          </label>
        </div>
        <div className="relative">
          <Input
            placeholder="Character"
            value={line.character}
            onChange={(e) => onUpdate(line.id, "character", e.target.value)}
            className={`text-mobile-base iphone:text-sm iphone:min-h-[36px] min-h-[44px] border-stone-600 bg-stone-700 text-stone-100 placeholder:text-stone-400 focus:border-stone-500 ${errors[`character-${line.id}`] ? "border-red-500" : ""}`}
          />
          {characterSuggestion && (
            <div className="absolute left-0 right-0 top-full z-10 rounded-b-md border border-yellow-600 bg-yellow-900 p-2 text-xs text-yellow-200">
              {`Did you mean "${characterSuggestion}"?`}
              <button
                type="button"
                onClick={() =>
                  onUpdate(line.id, "character", characterSuggestion)
                }
                className="ml-2 text-yellow-300 underline hover:text-yellow-100"
              >
                Use this
              </button>
            </div>
          )}
        </div>
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

      {/* Line Text */}
      <div className="iphone:col-span-5 space-y-1">
        <div className="iphone:hidden">
          <label className="text-mobile-xs font-medium text-stone-300">
            Line Text
          </label>
        </div>
        <Input
          placeholder="Line text"
          value={line.line}
          onChange={(e) => onUpdate(line.id, "line", e.target.value)}
          className={`text-mobile-base iphone:text-sm iphone:min-h-[36px] min-h-[44px] border-stone-600 bg-stone-700 text-stone-100 placeholder:text-stone-400 focus:border-stone-500 ${errors[`line-${line.id}`] ? "border-red-500" : warnings[`line-${line.id}`] ? "border-yellow-500" : ""}`}
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

      {/* Mobile: Bottom Row with Sung and Remove */}
      <div className="iphone:hidden flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            checked={line.sung}
            onCheckedChange={(checked) => onUpdate(line.id, "sung", checked)}
          />
          <Label className="text-mobile-sm text-stone-300">Sung</Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemove(line.id)}
          className="h-10 min-h-[44px] w-10 min-w-[44px] touch-manipulation border-red-600 bg-red-900 p-0 text-red-300 hover:bg-red-800 hover:text-red-200 active:bg-red-800"
        >
          ×
        </Button>
      </div>

      {/* Desktop: Sung Checkbox */}
      <div className="iphone:flex iphone:col-span-1 hidden items-center justify-center pt-2">
        <div className="flex flex-col items-center space-y-1">
          <Switch
            checked={line.sung}
            onCheckedChange={(checked) => onUpdate(line.id, "sung", checked)}
          />
          <Label className="text-xs text-stone-300">Sung</Label>
        </div>
      </div>

      {/* Desktop: Remove Button */}
      <div className="iphone:block iphone:col-span-1 hidden pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemove(line.id)}
          className="h-8 w-8 border-red-600 bg-red-900 p-0 text-red-300 hover:bg-red-800 hover:text-red-200"
        >
          ×
        </Button>
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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  // Load script data into form when script changes
  useEffect(() => {
    if (script && selectedProject && selectedScene) {
      const newFormData: FormData = {
        projectName: selectedProject,
        sceneTitle: selectedScene,
        lines: script.lines.map((line, index) => ({
          id: `line-${index}`,
          character: line.character,
          line: line.line,
          sung: line.sung ?? false,
        })),
      };

      setFormData(newFormData);
      setOriginalData(newFormData);
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
        formData.lines.map((line) => line.character.trim()).filter(Boolean),
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
      if (!line.character.trim()) {
        newErrors[`character-${line.id}`] = "Character name is required";
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
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === id
          ? {
              ...line,
              [field]:
                field === "character" && typeof value === "string"
                  ? standardizeCharacterName(value)
                  : value,
            }
          : line,
      ),
    }));

    // Update character suggestions when character field changes
    if (field === "character" && typeof value === "string") {
      const suggestion = findSimilarCharacters(value);
      setCharacterSuggestions((prev) => ({
        ...prev,
        [id]: suggestion ?? "",
      }));
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
      character: "",
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
          character: line.character,
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
      <div className="flex h-[90dvh] w-[95dvw] flex-col items-center justify-center rounded-md border-2 border-stone-700 bg-stone-900">
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
    <div className="flex h-[90dvh] w-[95dvw] flex-col rounded-md border-2 border-stone-700 bg-stone-900">
      <div className="flex h-full flex-col rounded-md">
        {/* Header */}
        <div className="iphone:flex-row iphone:items-center iphone:justify-between iphone:space-y-0 iphone:px-4 iphone:py-3 flex flex-col space-y-2 border-b border-stone-700 bg-stone-800 px-3 py-2">
          <h2 className="text-mobile-base iphone:text-lg font-semibold text-stone-100">
            Script Data Editor
          </h2>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateScriptMutation.isPending || !script}
            variant="outline"
            size="sm"
            className="iphone:min-h-[36px] min-h-[44px] touch-manipulation border-stone-600 bg-stone-700 text-stone-100 hover:bg-stone-600 active:bg-stone-600"
          >
            {updateScriptMutation.isPending ? "Saving..." : "Save Script"}
          </Button>
        </div>

        {/* Form Content */}
        <div className="iphone:p-4 flex-1 overflow-auto p-3 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]">
          {!script ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="text-stone-400">
                Please select a project, scene, and character to edit script
                data...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Project and Scene Row */}
              <div className="iphone:grid iphone:grid-cols-2 iphone:gap-4 iphone:space-y-0 flex flex-col space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="projectName"
                    className="text-mobile-sm iphone:text-sm text-stone-200"
                  >
                    Project Name
                  </Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => handleProjectNameChange(e.target.value)}
                    className={`iphone:min-h-[36px] text-mobile-base iphone:text-sm min-h-[44px] border-stone-600 bg-stone-800 text-stone-100 placeholder:text-stone-400 focus:border-stone-500 ${errors.projectName ? "border-red-500" : ""}`}
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
                    className="text-mobile-sm iphone:text-sm text-stone-200"
                  >
                    Scene Title
                  </Label>
                  <Input
                    id="sceneTitle"
                    value={formData.sceneTitle}
                    onChange={(e) => handleSceneTitleChange(e.target.value)}
                    className={`iphone:min-h-[36px] text-mobile-base iphone:text-sm min-h-[44px] border-stone-600 bg-stone-800 text-stone-100 placeholder:text-stone-400 focus:border-stone-500 ${errors.sceneTitle ? "border-red-500" : ""}`}
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
                  <Button
                    onClick={addLine}
                    variant="outline"
                    size="sm"
                    className="iphone:min-h-[36px] min-h-[44px] touch-manipulation border-stone-600 bg-stone-700 text-stone-100 hover:bg-stone-600 active:bg-stone-600"
                  >
                    Add Line
                  </Button>
                </div>

                {/* Drag and Drop Context */}
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
              </div>

              {/* Bottom Save Button */}
              <div className="flex justify-center border-t border-stone-700 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateScriptMutation.isPending}
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
