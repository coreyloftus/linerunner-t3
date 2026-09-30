import * as React from "react";
import { api } from "~/trpc/server";
import { ScriptProvider } from "./context";
import { getAllProjects } from "./actions";
import { AppShell } from "~/components/AppShell";

export default async function Home() {
  const projectData = await api.scriptData.getAll({ dataSource: "public" });
  const sidebarData = await getAllProjects("public");

  return (
    <ScriptProvider>
      <AppShell projectData={projectData} sidebarData={sidebarData} />
    </ScriptProvider>
  );
}
