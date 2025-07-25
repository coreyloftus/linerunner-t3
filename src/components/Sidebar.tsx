import { getAllProjects } from "~/app/actions";
import { SidebarClient } from "./SidebarClient";

export default async function Sidebar() {
  // Default to public for server-side rendering
  const projectData = await getAllProjects("public");
  return (
    <SidebarClient
      projects={projectData.projects}
      allData={projectData.allData}
    />
  );
}
