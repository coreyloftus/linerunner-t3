import { ScriptContext } from "~/app/context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useContext } from "react";

export default function NewScriptSelect({ projects }: { projects: string[] }) {
  const { selectedProject, setSelectedProject } = useContext(ScriptContext);
  const handleChange = (value: string) => {
    console.log("Selected project", value);
    setSelectedProject(value);
  };
  return (
    <Select onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue>Project</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {projects.map((project, index) => (
          <SelectItem value={selectedProject} key={index}>
            {project}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
