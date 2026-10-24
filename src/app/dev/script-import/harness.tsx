"use client";

import { useState } from "react";
import { ScriptPdfImport } from "~/components/ScriptPdfImport";
import { type ScriptImportResult } from "~/lib/script-import";

export function ScriptImportHarness() {
  const [result, setResult] = useState<ScriptImportResult | null>(null);
  const lineCount =
    result?.show.scenes.reduce((n, s) => n + s.lines.length, 0) ?? 0;

  return (
    <main className="min-h-dvh bg-background p-5 text-foreground">
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="font-display text-2xl font-semibold">
          Dev: script PDF import
        </h1>
        <ScriptPdfImport onParsed={setResult} />
        {result && (
          <section className="space-y-2">
            <p className="text-sm">
              {result.show.project}: {result.show.scenes.length} scenes,{" "}
              {lineCount} lines, {result.remaining} imports left
            </p>
            <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-surface-raised p-3 font-script text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}
