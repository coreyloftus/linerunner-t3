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
      <div className="fixed left-0 top-0 z-20">
        <Button
          onClick={() => setNavOpen(!navOpen)}
          className={`bg-stone-500 text-white`}
        >
          <h1 className="text-2xl">{!navOpen ? "→" : "X"}</h1>
        </Button>
      </div>
      {/* sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-[33vw] transform rounded-md border-r-2 border-t-2 border-stone-200 bg-stone-400 transition-all duration-500 ease-in-out ${
          navOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
        style={{ zIndex: 15 }}
      >
        <div className="pt-10">
          <NewScriptSelect projects={projects} allData={allData} />
        </div>
        <div className="fixed bottom-0 pb-2 pl-2 font-mono text-sm">
          LineRunner by Corey -- ©2025
        </div>
      </div>
      {/* overlay */}
      {navOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-500"
          style={{ zIndex: 10 }}
          onClick={() => setNavOpen(false)} // Close sidebar when clicking outside
        />
      )}
    </>
  );
}
