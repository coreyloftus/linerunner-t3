import { getAllProjects } from "~/app/actions";
import NewScriptSelect from "./NewScriptSelect";

export default async function Sidebar() {
  const projectData = await getAllProjects();

  return (
    <div>
      <h1>NavBar</h1>
      <NewScriptSelect
        projects={projectData.projects}
        allData={projectData.allData}
      />
    </div>
  );
}
