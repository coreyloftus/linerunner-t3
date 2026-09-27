"use client";

import { useState } from "react";
import { FileDropZone } from "../FileDropZone";
import { api } from "~/trpc/react";
import { type MelodyDraft } from "~/lib/melody";

const MAX_PDF_BYTES = 3 * 1024 * 1024;

interface MelodyImportProps {
  onExtracted: (draft: MelodyDraft, warnings: string[]) => void;
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

export function MelodyImport({ onExtracted }: MelodyImportProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { data: status } = api.melody.status.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const extract = api.melody.extractFromPdf.useMutation();

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_PDF_BYTES) {
      setError("That PDF is over 3 MB. Try a shorter excerpt.");
      return;
    }
    setFileName(file.name);
    try {
      const pdfBase64 = await readBase64(file);
      const result = await extract.mutateAsync({ fileName: file.name, pdfBase64 });
      onExtracted(result.melody, result.warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that PDF.");
    }
  };

  if (status && !status.importEnabled) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface-raised/60 p-4 text-center">
        <p className="font-display text-base font-semibold">
          Melody import is not configured
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reading sheet music needs an API key on the server. Saved melodies
          still play and can be edited.
        </p>
      </div>
    );
  }

  if (extract.isPending) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="font-display text-lg">Reading the music…</p>
        <p className="font-script text-sm text-muted-foreground">
          {fileName} · this can take a minute
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        New from PDF
      </p>
      <FileDropZone
        onFile={(file) => void handleFile(file)}
        acceptedTypes={["application/pdf", ".pdf"]}
        maxSizeBytes={MAX_PDF_BYTES}
        prompt="Drop a sheet music PDF here"
      />
      <p className="text-sm text-muted-foreground">
        Works best with a vocal-line-only PDF: one staff, one note at a time,
        lyrics under the notes. You can fix anything before saving.
      </p>
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
