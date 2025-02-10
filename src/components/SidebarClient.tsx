"use client";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import NewScriptSelect from "./NewScriptSelect";
import { Button } from "./ui/button";
import { useContext, useEffect, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { ScriptContext } from "~/app/context";
import { Switch } from "./ui/switch";

type SidebarClientProps = {
  projects: string[];
  allData: ProjectJSON[];
};
export function SidebarClient({ projects, allData }: SidebarClientProps) {
  const [navOpen, setNavOpen] = useState(false);
  const { userConfig, setUserConfig } = useContext(ScriptContext);

  useEffect(() => {
    console.log(userConfig);
  }, [userConfig]);
  return (
    <>
      <div className="fixed left-0 top-0 z-20">
        <Button
          onClick={() => setNavOpen(!navOpen)}
          className={`bg-stone-500 text-white`}
        >
          <h1 className="text-2xl">{!navOpen ? <GiHamburgerMenu /> : "X"}</h1>
        </Button>
      </div>
      {/* sidebar */}
      <div
        className={`fixed left-0 top-0 h-full transform rounded-md border-r-2 border-t-2 border-stone-200 bg-stone-400 transition-all duration-500 ease-in-out sm:w-[75vw] md:w-[33vw] ${
          navOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
        style={{ zIndex: 15 }}
      >
        <div className="pt-10">
          <div className="px-1">
            <p className="mb-2 font-bold">Script Select</p>
            <NewScriptSelect projects={projects} allData={allData} />
          </div>
          <div className="mt-2 flex flex-col p-2">
            {/* add a toggle for the "Auto Advance" feature -- when TRUE set the context.autoAdvance to TRUE */}
            <p className="font-bold">NPC Settings</p>
            <div className="flex justify-between p-2">
              <p>Word-by-word</p>
              <Switch
                checked={userConfig.autoAdvanceScript}
                onCheckedChange={(checked) =>
                  setUserConfig({
                    ...userConfig,
                    autoAdvanceScript: checked,
                  })
                }
                className="bg-stone-500 text-white"
              />
            </div>
          </div>
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
