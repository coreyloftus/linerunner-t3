"use client";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import NewScriptSelect from "./NewScriptSelect";
import { Button } from "./ui/button";
import { useState } from "react";
type SidebarClientProps = {
  projects: string[];
  allData: ProjectJSON[];
};
export function SidebarClient({ projects, allData }: SidebarClientProps) {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <>
      <div className="fixed left-0 top-0 z-20 p-4">
        <Button
          onClick={() => setNavOpen(!navOpen)}
          className={`bg-stone-500 text-white`}
        >
          <h1 className="text-2xl">{!navOpen ? "→" : "←"}</h1>
        </Button>
      </div>
      <div
        className={`border-r-2 border-stone-200 duration-500 md:w-[100vw] lg:w-[33vw] ${navOpen && "opacity-1 h-[100dvh] slide-in-from-left-5"}${!navOpen && "z-0 opacity-0"}`}
      >
        <NewScriptSelect projects={projects} allData={allData} />
      </div>
    </>
  );
}
