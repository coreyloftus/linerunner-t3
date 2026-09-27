"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { signIn, useSession } from "next-auth/react";
import { FaFilePdf, FaFileImport, FaMusic } from "react-icons/fa6";
import { api } from "~/trpc/react";
import { melodyDraftSchema, parseMelodyJson } from "~/lib/melody";
import { Button } from "../ui/button";
import { MelodyImport } from "./MelodyImport";
import { MelodyReview, type ReviewInput } from "./MelodyReview";
import { MelodyPlayer } from "./MelodyPlayer";

type View =
  | { kind: "empty" }
  | { kind: "import" }
  | { kind: "review"; input: ReviewInput }
  | { kind: "player"; id: string };

export function MelodyWorkspace() {
  const { data: session, status } = useSession();
  const [view, setView] = useState<View>({ kind: "empty" });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const signedIn = !!session?.user;
  const { data: melodies, isLoading: listLoading } = api.melody.list.useQuery(undefined, {
    enabled: signedIn,
    refetchOnWindowFocus: false,
  });
  const selectedId = view.kind === "player" ? view.id : view.kind === "review" ? view.input.id : undefined;
  const { data: melody, error: melodyError } = api.melody.get.useQuery(
    { id: view.kind === "player" ? view.id : "" },
    { enabled: signedIn && view.kind === "player", refetchOnWindowFocus: false },
  );
  const deleteMelody = api.melody.delete.useMutation();

  const handleJsonFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setJsonError(null);
    try {
      const { draft, warnings } = parseMelodyJson(await file.text(), file.name);
      setView({ kind: "review", input: { draft, warnings } });
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Could not read that file.");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMelody.mutateAsync({ id });
    await utils.melody.list.invalidate();
    setView({ kind: "empty" });
  };

  return (
    <div className="flex h-[90dvh] w-[95dvw] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/5 supports-[height:100svh]:h-[90svh] dark:shadow-black/40">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-raised/90 px-3 py-2 iphone:px-4">
        <h2 className="font-display text-mobile-base font-semibold iphone:text-lg">Melody</h2>
        {signedIn && (
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setView({ kind: "import" })} className="gap-1.5">
              <FaFilePdf className="h-3 w-3" /> New from PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => jsonInputRef.current?.click()} className="gap-1.5">
              <FaFileImport className="h-3 w-3" /> Import JSON
            </Button>
            <input
              ref={jsonInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => void handleJsonFile(e)}
            />
          </div>
        )}
      </div>

      {!signedIn ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <FaMusic className="h-8 w-8 text-muted-foreground" />
          <p className="font-display text-lg">Learn your melodies</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Sign in to turn sheet music into a piano practice track.
          </p>
          {status !== "loading" && (
            <Button variant="outline" size="sm" onClick={() => void signIn()}>
              Sign in
            </Button>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Saved melodies */}
          <aside className="max-h-40 flex-shrink-0 overflow-y-auto border-b border-border p-3 md:max-h-none md:w-60 md:border-b-0 md:border-r">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Saved</p>
            {listLoading ? (
              <p className="font-script text-sm text-muted-foreground">Loading…</p>
            ) : !melodies?.length ? (
              <p className="font-script text-sm text-muted-foreground">No melodies yet.</p>
            ) : (
              <ul className="space-y-1">
                {melodies.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setView({ kind: "player", id: m.id })}
                      className={`w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                        selectedId === m.id ? "bg-accent/15" : "hover:bg-muted/60"
                      }`}
                    >
                      <span className="block truncate text-sm font-medium">{m.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {m.noteCount} notes{m.link ? ` · ${m.link.sectionTitle}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Main area */}
          <main className="min-h-0 flex-1 overflow-y-auto p-3 iphone:p-4">
            {jsonError && (
              <p role="alert" className="mx-auto mb-3 max-w-lg rounded-md border border-curtain/40 bg-curtain/10 px-3 py-2 text-sm text-curtain">
                {jsonError}
              </p>
            )}
            {view.kind === "empty" && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="font-display text-lg">Pick a melody or add a new one</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Upload a PDF of the vocal line, or import a melody JSON file.
                </p>
              </div>
            )}
            {view.kind === "import" && (
              <MelodyImport onExtracted={(draft, warnings) => setView({ kind: "review", input: { draft, warnings } })} />
            )}
            {view.kind === "review" && (
              <MelodyReview
                key={view.input.id ?? "new"}
                {...view.input}
                onSaved={(id) => setView({ kind: "player", id })}
                onCancel={() => setView(view.input.id ? { kind: "player", id: view.input.id } : { kind: "empty" })}
              />
            )}
            {view.kind === "player" &&
              (melodyError ? (
                <p className="text-sm text-curtain">{melodyError.message}</p>
              ) : !melody ? (
                <p className="font-script text-sm text-muted-foreground">Loading…</p>
              ) : (
                <MelodyPlayer
                  key={melody.id + melody.updatedAt}
                  melody={melody}
                  onEdit={() => {
                    const draft = melodyDraftSchema.parse(melody);
                    setView({ kind: "review", input: { id: melody.id, draft, warnings: [] } });
                  }}
                  onDelete={() => handleDelete(melody.id)}
                />
              ))}
          </main>
        </div>
      )}
    </div>
  );
}
