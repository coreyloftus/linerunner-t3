"use client";
import React, { useState } from "react";
import { mdToJSON, type Project } from "~/lib/utils";
import { saveAs } from "file-saver";

export const ConvertScriptBox: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>("");
  const [jsonOutput, setJsonOutput] = useState<Project[] | null>(null);

  const handleConvert = async () => {
    try {
      const result: Project[] = await mdToJSON(markdown);
      setJsonOutput(result);
      const jsonString: string = JSON.stringify(result, null, 2);
      const blob: Blob = new Blob([jsonString], { type: "application/json" });
      saveAs(blob, `${jsonOutput?.[0]?.project ?? "script"}.json`);
    } catch (error) {
      console.error("error converting", error);
    }
  };

  return (
    <div className="">
      <textarea
        className="h-96 w-full bg-slate-800 p-2 text-white"
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        placeholder="Enter your markdown here"
      />
      <button onClick={handleConvert}>Convert to Script</button>
      {jsonOutput && (
        <div>
          <pre className="overflow-y-scroll">
            {JSON.stringify(jsonOutput, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
