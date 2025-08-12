import * as React from "react";
import { api } from "~/trpc/server";
import { ScriptProvider } from "./context";
import { getAllProjects } from "./actions";
import { AppContent } from "~/components/AppContent";

export default async function Home() {
  const projectData = await api.scriptData.getAll({ dataSource: "public" });
  const sidebarData = await getAllProjects("public");
  
  return (
    <div>
      <ScriptProvider>
        <AppContent projectData={projectData} sidebarData={sidebarData} />
      </ScriptProvider>
    </div>
  );
}
