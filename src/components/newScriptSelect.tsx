"use client";
import { ScriptContext } from "~/app/context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useContext, useEffect } from "react";

export default function NewScriptSelect({ projects }: { projects: string[] }) {
  const { selectedProject, setSelectedProject } = useContext(ScriptContext);
  const handleChange = (value: string) => {
    setSelectedProject(value);
    console.log("Selected project", selectedProject);
  };
  useEffect(() => {
    console.log("current project:", selectedProject);
  }, [selectedProject]);
  return (
    <Select onValueChange={handleChange} value={selectedProject}>
      <SelectTrigger>
        <SelectValue placeholder="Select a project">
          {selectedProject ?? "abc"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {projects.map((project, index) => (
          <SelectItem value={project} key={index}>
            {project}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
