"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { FiTrash2, FiUserPlus, FiRefreshCw, FiShare2 } from "react-icons/fi";

export function AdminSharingPanel() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch admin's Firestore projects
  const { data: adminProjects } = api.scriptData.getAll.useQuery(
    { dataSource: "firestore" },
    {
      refetchOnWindowFocus: false,
    },
  );

  // Fetch all shared projects
  const {
    data: sharedProjects,
    refetch: refetchSharedProjects,
  } = api.scriptData.getAllSharedProjects.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Mutations
  const shareProject = api.scriptData.shareExistingProject.useMutation({
    onSuccess: () => {
      void refetchSharedProjects();
      setSelectedProject("");
    },
  });

  const updatePermissions = api.scriptData.updateSharedProjectPermissions.useMutation({
    onSuccess: () => {
      void refetchSharedProjects();
    },
  });

  const syncProject = api.scriptData.syncSharedProject.useMutation({
    onSuccess: () => {
      void refetchSharedProjects();
    },
  });

  const deleteProject = api.scriptData.deleteSharedProject.useMutation({
    onSuccess: () => {
      void refetchSharedProjects();
      setSelectedProject("");
    },
  });

  // Find if selected project is already shared
  const selectedSharedProject = sharedProjects?.find(
    (sp) => sp.project === selectedProject,
  );

  const handleShareProject = async (): Promise<void> => {
    if (!selectedProject) return;
    setIsLoading(true);
    try {
      await shareProject.mutateAsync({
        projectName: selectedProject,
        allowedUsers: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (): Promise<void> => {
    if (!selectedSharedProject?.id || !newUserEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail.trim())) {
      alert("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const updatedUsers = [...selectedSharedProject.allowedUsers, newUserEmail.trim()];
      await updatePermissions.mutateAsync({
        projectId: selectedSharedProject.id,
        allowedUsers: updatedUsers,
      });
      setNewUserEmail("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (emailToRemove: string): Promise<void> => {
    if (!selectedSharedProject?.id) return;
    setIsLoading(true);
    try {
      const updatedUsers = selectedSharedProject.allowedUsers.filter(
        (email: string) => email !== emailToRemove,
      );
      await updatePermissions.mutateAsync({
        projectId: selectedSharedProject.id,
        allowedUsers: updatedUsers,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncProject = async (): Promise<void> => {
    if (!selectedSharedProject?.id || !selectedProject) return;
    setIsLoading(true);
    try {
      await syncProject.mutateAsync({
        sharedProjectId: selectedSharedProject.id,
        sourceProjectName: selectedProject,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (): Promise<void> => {
    if (!selectedSharedProject?.id) return;
    if (!confirm(`Are you sure you want to stop sharing "${selectedProject}"?`)) {
      return;
    }
    setIsLoading(true);
    try {
      await deleteProject.mutateAsync({
        projectId: selectedSharedProject.id,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const projectsList = adminProjects?.projects ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* Project Selection */}
      <div>
        <Label className="text-xs text-stone-600 dark:text-stone-400">
          Select Project
        </Label>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choose a project..." />
          </SelectTrigger>
          <SelectContent>
            {projectsList.map((project) => {
              const isShared = sharedProjects?.some((sp) => sp.project === project);
              return (
                <SelectItem key={project} value={project}>
                  {isShared ? `🔗 ${project}` : project}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Actions based on selected project */}
      {selectedProject && (
        <div className="flex flex-col gap-2">
          {selectedSharedProject ? (
            <>
              {/* Already shared - show management options */}
              <div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                Shared with {selectedSharedProject.allowedUsers.length} user(s)
              </div>

              {/* Permitted Users List */}
              {selectedSharedProject.allowedUsers.length > 0 && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-stone-600 dark:text-stone-400">
                    Permitted Users
                  </Label>
                  <div className="max-h-24 overflow-y-auto rounded-md border border-stone-200 dark:border-stone-700">
                    {selectedSharedProject.allowedUsers.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between border-b border-stone-100 px-2 py-1 last:border-b-0 dark:border-stone-800"
                      >
                        <span className="truncate text-xs text-stone-700 dark:text-stone-300">
                          {email}
                        </span>
                        <button
                          onClick={() => handleRemoveUser(email)}
                          disabled={isLoading}
                          className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Remove user"
                        >
                          <FiTrash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add User Form */}
              <div className="flex gap-1">
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@email.com"
                  className="flex-1 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddUser}
                  disabled={isLoading || !newUserEmail.trim()}
                  className="px-2"
                >
                  <FiUserPlus className="h-4 w-4" />
                </Button>
              </div>

              {/* Sync and Delete buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncProject}
                  disabled={isLoading}
                  className="flex-1 text-xs"
                  title="Sync shared project with your latest changes"
                >
                  <FiRefreshCw className={`mr-1 h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                  Sync
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteProject}
                  disabled={isLoading}
                  className="text-xs"
                  title="Stop sharing this project"
                >
                  <FiTrash2 className="h-3 w-3" />
                </Button>
              </div>
            </>
          ) : (
            /* Not shared yet - show share button */
            <Button
              size="sm"
              onClick={handleShareProject}
              disabled={isLoading}
              className="w-full"
            >
              <FiShare2 className="mr-2 h-4 w-4" />
              Share Project
            </Button>
          )}
        </div>
      )}

      {/* Summary of all shared projects */}
      {sharedProjects && sharedProjects.length > 0 && (
        <div className="mt-2 border-t border-stone-200 pt-2 dark:border-stone-700">
          <Label className="text-xs text-stone-600 dark:text-stone-400">
            All Shared Projects ({sharedProjects.length})
          </Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {sharedProjects.map((sp) => (
              <span
                key={sp.id}
                className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400"
              >
                {sp.project}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
