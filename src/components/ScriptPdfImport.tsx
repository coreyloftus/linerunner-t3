"use client";

import { useEffect, useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { api } from "~/trpc/react";
import {
  MAX_SCRIPT_PDF_BYTES,
  type ScriptImportResult,
} from "~/lib/script-import";

interface ScriptPdfImportProps {
  onParsed: (result: ScriptImportResult) => void;
  className?: string;
}

const readBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      resolve(url.slice(url.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const Notice = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-xl border border-border bg-surface-raised/60 p-4 text-center">
    <p className="font-display text-base font-semibold">{title}</p>
    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
  </div>
);

/** Pick a script PDF, send it to the server, and hand back the parsed show */
export function ScriptPdfImport({ onParsed, className = "" }: ScriptPdfImportProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stage, setStage] = useState<"reading" | "sending" | null>(null);
  const [seconds, setSeconds] = useState(0);
  const utils = api.useUtils();
  const status = api.scriptData.pdfImportStatus.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: false,
  });
  const extract = api.scriptData.extractFromPdf.useMutation({
    onSettled: () => void utils.scriptData.pdfImportStatus.invalidate(),
  });

  // Elapsed timer: a long script can take a few minutes
  useEffect(() => {
    if (!stage) return;
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [stage]);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_SCRIPT_PDF_BYTES) {
      setError("That PDF is over 3 MB. Try one act at a time.");
      return;
    }
    setFileName(file.name);
    try {
      setStage("reading");
      const pdfBase64 = await readBase64(file);
      setStage("sending");
      const result = await extract.mutateAsync({ fileName: file.name, pdfBase64 });
      onParsed(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that PDF.");
    } finally {
      setStage(null);
    }
  };

  if (status.error) {
    return (
      <div className={className}>
        <Notice
          title="Sign in to import a PDF"
          body="PDF import reads your script and saves it to your shows."
        />
      </div>
    );
  }

  if (status.isLoading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (status.data && !status.data.enabled) {
    return (
      <div className={className}>
        <Notice
          title="PDF import is not set up yet"
          body="You can still paste your script or upload a text file."
        />
      </div>
    );
  }

  if (stage) {
    const mm = Math.floor(seconds / 60);
    const ss = String(seconds % 60).padStart(2, "0");
    return (
      <div
        className={`flex flex-col items-center gap-3 py-12 text-center ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="font-display text-lg">
          {stage === "reading" ? "Opening the PDF…" : "Reading the script…"}
        </p>
        <p className="font-script text-sm text-muted-foreground">
          {fileName} · {mm}:{ss}
        </p>
        <p className="text-sm text-muted-foreground">
          A full show can take a few minutes. Keep this page open.
        </p>
      </div>
    );
  }

  const remaining = status.data?.remaining ?? 0;
  const limit = status.data?.limit ?? 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {remaining === 0 ? (
        <Notice
          title="No PDF imports left this month"
          body={`You get ${limit} a month. They reset on the 1st.`}
        />
      ) : (
        <>
          <FileDropZone
            onFile={(file) => void handleFile(file)}
            acceptedTypes={["application/pdf", ".pdf"]}
            maxSizeBytes={MAX_SCRIPT_PDF_BYTES}
            prompt="Drop a script PDF here"
          />
          <p className="text-sm text-muted-foreground">
            {remaining} of {limit} PDF imports left this month. You can fix
            anything before saving.
          </p>
        </>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-curtain/40 bg-curtain/10 px-3 py-2 text-sm text-curtain"
        >
          {error}
        </p>
      )}
    </div>
  );
}
