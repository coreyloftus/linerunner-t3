import { getAllProjects } from "~/app/actions";
import { SidebarClient } from "./SidebarClient";

export default async function Sidebar() {
  const projectData = await getAllProjects();
  return (
    <SidebarClient
      projects={projectData.projects}
      allData={projectData.allData}
    />
  );
}
