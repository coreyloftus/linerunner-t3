import { getAllProjects } from "~/app/actions";
import { SidebarClient } from "./SidebarClient";

export default async function Sidebar() {
  // Default to local for server-side rendering
  const projectData = await getAllProjects("local");
  return (
    <SidebarClient
      projects={projectData.projects}
      allData={projectData.allData}
    />
  );
}
