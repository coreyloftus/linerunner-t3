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

  const showPlayer = view.kind === "player" && !!melody && !melodyError;
  const actionClass = "min-w-[44px] gap-1.5 px-2.5 md:px-3";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface">
      <div className="flex min-h-14 items-center gap-2 border-b border-border bg-surface-raised/90 py-2 pl-12 pr-3 iphone:pr-4 md:pl-4">
        <h2 className="flex-shrink-0 font-display text-mobile-base font-semibold iphone:text-lg">Melody</h2>
        {signedIn && (
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
            {!!melodies?.length && (
              <select
                aria-label="Saved melodies"
                value={selectedId ?? ""}
                onChange={(e) => e.target.value && setView({ kind: "player", id: e.target.value })}
                className="h-9 min-w-0 flex-1 truncate rounded-md border border-border bg-surface px-2 text-sm md:max-w-xs"
              >
                <option value="" disabled>
                  Open a melody…
                </option>
                {melodies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView({ kind: "import" })}
              aria-label="New from PDF"
              className={actionClass}
            >
              <FaFilePdf className="h-3 w-3" /> <span className="hidden md:inline">New from PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => jsonInputRef.current?.click()}
              aria-label="Import JSON"
              className={actionClass}
            >
              <FaFileImport className="h-3 w-3" /> <span className="hidden md:inline">Import JSON</span>
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
        <>
          {jsonError && (
            <p role="alert" className="mx-3 mt-3 rounded-md border border-curtain/40 bg-curtain/10 px-3 py-2 text-sm text-curtain">
              {jsonError}
            </p>
          )}
          <main className={`min-h-0 flex-1 ${showPlayer ? "flex flex-col overflow-hidden" : "overflow-y-auto p-3 iphone:p-4"}`}>
            {view.kind === "empty" && (
              <div className="flex min-h-full flex-col items-center justify-center gap-4 text-center">
                <div className="space-y-2">
                  <p className="font-display text-lg">Pick a melody or add a new one</p>
                  <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                    Upload a PDF of the vocal line, or import a melody JSON file.
                  </p>
                </div>
                {listLoading ? (
                  <p className="font-script text-sm text-muted-foreground">Loading…</p>
                ) : !melodies?.length ? (
                  <p className="font-script text-sm text-muted-foreground">No melodies yet.</p>
                ) : (
                  <ul className="w-full max-w-md space-y-2">
                    {melodies.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setView({ kind: "player", id: m.id })}
                          className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-left transition-colors hover:bg-accent-soft"
                        >
                          <span className="block truncate font-medium">{m.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {m.noteCount} notes{m.link ? ` · ${m.link.sectionTitle}` : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
        </>
      )}
    </div>
  );
}
