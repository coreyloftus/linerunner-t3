"use client";

import { type ProjectJSON } from "~/server/api/routers/scriptData";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ScriptContext } from "~/app/context";
import { useContext, useState } from "react";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { useSession } from "next-auth/react";

interface ScriptDataProps {
  data: {
    projects: string[];
    allData: ProjectJSON[];
  };
}
export const ScriptData = ({ data }: ScriptDataProps) => {
  const { data: session } = useSession();
  const { selectedProject, selectedScene, userConfig } =
    useContext(ScriptContext);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedScript, setEditedScript] = useState<string>("");
  const [originalScript, setOriginalScript] = useState<string>("");

  // Dynamic data fetching based on data source
  const { data: dynamicData, refetch } = api.scriptData.getAll.useQuery(
    { dataSource: userConfig.dataSource },
    {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Always refetch when data source changes
    },
  );

  // Use dynamic data if available, otherwise fall back to static data
  const currentData = dynamicData ?? data;

  const script = currentData.allData
    .find((project) => project.project === selectedProject)
    ?.scenes.find((scene) => scene.title === selectedScene);

  const updateScriptMutation = api.scriptData.updateScript.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success!",
          description: data.message,
        });
        setIsEditing(false);
        setEditedScript("");
        setOriginalScript("");
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

  const handleEditScript = () => {
    if (!script) return;

    const scriptJson = JSON.stringify(script, null, 2);
    setEditedScript(scriptJson);
    setOriginalScript(scriptJson);
    setIsEditing(true);
  };

  const handleSaveScript = () => {
    if (!script || !selectedProject || !selectedScene) return;

    try {
      const parsedScene = JSON.parse(editedScript) as {
        title: string;
        lines: { character: string; line: string; sung?: boolean }[];
      };

      // Create the full project structure
      const updatedScript: ProjectJSON = {
        project: selectedProject,
        scenes: [parsedScene], // Wrap the scene in an array
      };

      updateScriptMutation.mutate({
        projectName: selectedProject,
        sceneTitle: selectedScene,
        updatedScript: updatedScript,
        dataSource:
          userConfig.dataSource === "public"
            ? "firestore"
            : userConfig.dataSource,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format. Please check your script data.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedScript("");
    setOriginalScript("");
  };

  // If user is not authenticated, show message
  if (!session?.user) {
    return (
      <div className="flex h-[90dvh] w-[80dvw] flex-col items-center justify-center rounded-md border-2 border-stone-200">
        <div className="text-center">
          <h2 className="mb-4 text-lg font-semibold text-stone-900 dark:text-stone-100">
            Authentication Required
          </h2>
          <p className="text-stone-600 dark:text-stone-400">
            Please sign in to edit scripts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[90dvh] w-[80dvw] flex-col rounded-md border-2 border-stone-200">
        <div className="flex h-full flex-col rounded-md">
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Script Data
            </h2>
            {!isEditing && (
              <Button
                onClick={handleEditScript}
                disabled={!script}
                variant="outline"
                size="sm"
                className="text-stone-900 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-700  "
              >
                Edit Script
              </Button>
            )}
            {isEditing && (
              <div className="flex gap-2 text-stone-900 dark:text-stone-100">
                <Button
                  onClick={handleSaveScript}
                  disabled={updateScriptMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  {updateScriptMutation.isPending ? "Saving..." : "Save Script"}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  disabled={updateScriptMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 p-4">
            <Textarea
              value={isEditing ? editedScript : JSON.stringify(script, null, 2)}
              onChange={
                isEditing ? (e) => setEditedScript(e.target.value) : undefined
              }
              readOnly={!isEditing}
              className="h-full min-h-[60px] resize-none border-0 bg-transparent text-sm leading-relaxed text-stone-100 focus-visible:ring-0 dark:text-stone-100"
              placeholder="No script selected..."
            />
          </div>
        </div>
      </div>
    </>
  );
};
