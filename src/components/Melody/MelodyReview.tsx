"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FaPlay, FaPause, FaStop, FaPlus, FaTrash } from "react-icons/fa6";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { useMelodyPlayer } from "~/hooks/useMelodyPlayer";
import { MelodyStaff } from "./MelodyStaff";
import {
  badMeasures,
  DURATION_OPTIONS,
  durationLabel,
  formatBeats,
  groupByMeasure,
  measureLength,
  normalizePitch,
  placeSpokenLines,
  sortCues,
  validateMelody,
  type MelodyDraft,
  type MelodyLink,
  type MelodyNote,
  type MelodySource,
  type MelodySpokenCue,
} from "~/lib/melody";

export interface ReviewInput {
  id?: string;
  draft: MelodyDraft;
  warnings: string[];
}

interface MelodyReviewProps extends ReviewInput {
  onSaved: (id: string) => void;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground";
// Same field look, sized by the row instead of full width
const cueInputClass = inputClass.replace("w-full ", "");

export function MelodyReview({ id, draft: initial, warnings: sourceWarnings, onSaved, onCancel }: MelodyReviewProps) {
  const [draft, setDraft] = useState<MelodyDraft>(initial);
  const [selected, setSelected] = useState<number | null>(null);
  const [systems, setSystems] = useState<number[][]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const player = useMelodyPlayer(draft);
  const utils = api.useUtils();
  const save = api.melody.save.useMutation();

  const liveWarnings = useMemo(() => validateMelody(draft), [draft]);
  const bad = useMemo(() => badMeasures(draft), [draft]);
  const measures = useMemo(() => groupByMeasure(draft.notes), [draft.notes]);
  const expectedBeats = measureLength(draft.timeSignature);

  // The drawn line (system) that holds the selected note, measure by measure
  const selectedMeasure = selected !== null ? draft.notes[selected]?.measure : undefined;
  const lineMeasures = useMemo(() => {
    if (selectedMeasure === undefined) return [];
    const line = systems.find((sys) => sys.includes(selectedMeasure)) ?? [selectedMeasure];
    return measures.filter(([m]) => line.includes(m));
  }, [systems, measures, selectedMeasure]);

  // Left/right arrows step through notes while nothing is being typed into
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected === null) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") setSelected(Math.min(draft.notes.length - 1, selected + 1));
      else if (e.key === "ArrowLeft") setSelected(Math.max(0, selected - 1));
      else if (e.key === "Escape") setSelected(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, draft.notes.length]);

  const updateNote = (i: number, patch: Partial<MelodyNote>) =>
    setDraft((d) => ({
      ...d,
      notes: d.notes.map((n, j) => (j === i ? { ...n, ...patch } : n)),
    }));

  // New note copies the pitch and measure of its neighbour; `at` is where it lands
  const insertAt = (at: number, from: number) => {
    setDraft((d) => {
      const src = d.notes[from]!;
      const note: MelodyNote = { pitch: src.pitch, beats: 1, measure: src.measure };
      return { ...d, notes: [...d.notes.slice(0, at), note, ...d.notes.slice(at)] };
    });
    setSelected(at);
  };

  // Selection moves to the note that takes the deleted one's place, or the new last note
  const deleteNote = (i: number) => {
    const remaining = draft.notes.length - 1;
    setDraft((d) => ({ ...d, notes: d.notes.filter((_, j) => j !== i) }));
    setSelected(remaining > 0 ? Math.min(i, remaining - 1) : null);
  };

  const { data: session } = useSession();
  const linkSource = draft.link?.source === "user" ? "firestore" : (draft.link?.source ?? "local");
  const { data: linkData } = api.scriptData.getAll.useQuery(
    { dataSource: linkSource },
    {
      refetchOnWindowFocus: false,
      enabled: !!draft.link && (linkSource === "local" || linkSource === "public" || !!session?.user),
    },
  );
  const sectionLines = draft.link
    ? linkData?.allData
        .find((p) => p.project === draft.link!.projectName)
        ?.scenes.find((s) => s.title === draft.link!.sectionTitle)?.lines
    : undefined;
  const spokenInSection = sectionLines?.filter((l) => !l.sung).length ?? 0;

  const setSpoken = (spoken: MelodySpokenCue[]) =>
    setDraft((d) => ({ ...d, spoken: spoken.length ? spoken : undefined }));
  const updateCue = (k: number, patch: Partial<MelodySpokenCue>) =>
    setSpoken((draft.spoken ?? []).map((c, j) => (j === k ? { ...c, ...patch } : c)));
  const addCue = () => {
    const measure = selected !== null ? draft.notes[selected]!.measure : (measures[0]?.[0] ?? 1);
    setSpoken(sortCues([...(draft.spoken ?? []), { measure, character: "", line: "…" }]));
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      const result = await save.mutateAsync({ ...draft, ...(id ? { id } : {}) });
      await utils.melody.list.invalidate();
      await utils.melody.get.invalidate({ id: result.id });
      player.stop();
      onSaved(result.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-8">
      {/* Header fields */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="col-span-2 space-y-1">
          <span className={labelClass}>Title</span>
          <input
            className={`${inputClass} font-display text-base`}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Tempo (BPM)</span>
          <input
            type="number"
            min={20}
            max={300}
            className={inputClass}
            value={draft.tempoBpm}
            onChange={(e) =>
              setDraft({ ...draft, tempoBpm: Math.min(300, Math.max(20, Number(e.target.value) || 20)) })
            }
          />
        </label>
        <div className="space-y-1">
          <span className={labelClass}>Time signature</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={16}
              aria-label="Beats per measure"
              className={inputClass}
              value={draft.timeSignature[0]}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  timeSignature: [Math.min(16, Math.max(1, Number(e.target.value) || 1)), draft.timeSignature[1]],
                })
              }
            />
            <span className="text-muted-foreground">/</span>
            <select
              aria-label="Beat unit"
              className={inputClass}
              value={draft.timeSignature[1]}
              onChange={(e) =>
                setDraft({ ...draft, timeSignature: [draft.timeSignature[0], Number(e.target.value)] })
              }
            >
              {[2, 4, 8, 16].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="space-y-1">
          <span className={labelClass}>Pickup beats</span>
          <input
            type="number"
            min={0}
            max={16}
            step={0.5}
            className={inputClass}
            value={draft.pickupBeats ?? 0}
            onChange={(e) => setDraft({ ...draft, pickupBeats: Math.max(0, Number(e.target.value) || 0) })}
          />
        </label>
        <div className="col-span-2 space-y-1 sm:col-span-3">
          <span className={labelClass}>Link to song</span>
          <LinkPicker value={draft.link} onChange={(link) => setDraft({ ...draft, link })} />
        </div>
      </div>

      {/* Warnings */}
      {(sourceWarnings.length > 0 || liveWarnings.length > 0) && (
        <div className="space-y-2 rounded-xl border border-accent/40 bg-accent-soft/60 p-3">
          <p className={labelClass}>Check these</p>
          <ul className="list-disc space-y-0.5 pl-5 text-sm">
            {sourceWarnings.map((w, i) => (
              <li key={`s${i}`}>{w}</li>
            ))}
            {liveWarnings.map((w, i) => (
              <li key={`l${i}`} className="text-curtain">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Playback */}
      <div className="flex flex-wrap items-center gap-2">
        {player.isPlaying ? (
          <Button variant="outline" size="sm" onClick={player.pause} className="gap-1.5">
            <FaPause className="h-3 w-3" /> Pause
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void player.play(selected ?? undefined)}
            disabled={player.isLoading || draft.notes.length === 0}
            className="gap-1.5"
          >
            <FaPlay className="h-3 w-3" />
            {player.isLoading ? "Loading piano…" : selected !== null ? "Play from note" : "Play"}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={player.stop} className="gap-1.5">
          <FaStop className="h-3 w-3" /> Stop
        </Button>
        <span className="text-xs text-muted-foreground">
          {draft.notes.length} notes · {measures.length} measures · {formatBeats(expectedBeats)} beats per measure
        </span>
      </div>

      {/* Staff: redraws live as notes are edited; click a note or rest to edit it */}
      <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-border bg-surface px-2 py-1 [overscroll-behavior:contain]">
        <MelodyStaff
          melody={draft}
          currentNoteIndex={player.currentNoteIndex}
          selectedNoteIndex={selected}
          onNoteClick={(i) => setSelected(selected === i ? null : i)}
          onLayout={(next) => setSystems((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))}
        />
      </div>

      {/* Editor for the selected note, with the rest of its line for context */}
      {selected === null || !draft.notes[selected] ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center font-script text-sm text-muted-foreground">
          Click a note or rest on the staff to edit it.
        </p>
      ) : (
        <div className="space-y-3 rounded-xl border border-accent/40 bg-surface-raised/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className={labelClass}>
              Line · {lineMeasures.length > 1 ? "measures" : "measure"} {lineMeasures[0]?.[0]}
              {lineMeasures.length > 1 ? `–${lineMeasures[lineMeasures.length - 1]![0]}` : ""}
            </span>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">← → move · Esc closes</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {lineMeasures.map(([measure, indexes]) => {
              const sum = indexes.reduce((s, i) => s + draft.notes[i]!.beats, 0);
              const isBad = bad.has(measure);
              const lyricLine = indexes.map((i) => draft.notes[i]!.lyric).filter(Boolean).join(" ");
              return (
                <div
                  key={measure}
                  className={`min-w-fit flex-shrink-0 rounded-lg border p-2 ${isBad ? "border-curtain/60 bg-curtain/5" : "border-border bg-surface"}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3 px-0.5">
                    <span className={labelClass}>m. {measure}</span>
                    <span className={`text-[11px] ${isBad ? "font-semibold text-curtain" : "text-muted-foreground"}`}>
                      {formatBeats(sum)} / {formatBeats(expectedBeats)}
                    </span>
                  </div>
                  <p className="mb-1.5 px-0.5 font-script text-sm">{lyricLine || <span className="text-muted-foreground">—</span>}</p>
                  <div className="flex gap-1">
                    {indexes.map((i) => {
                      const n = draft.notes[i]!;
                      const isCurrent = player.currentNoteIndex === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelected(i)}
                          className={`min-w-[3.25rem] rounded-md border px-1.5 py-1 text-left transition-colors ${
                            selected === i
                              ? "border-accent ring-2 ring-accent/50"
                              : "border-border hover:border-muted-foreground/50"
                          } ${isCurrent ? "bg-accent text-accent-foreground" : "bg-surface"}`}
                        >
                          <span className="block font-display text-sm font-semibold">
                            {n.pitch ?? "rest"}
                            {n.tieToNext && <span title="Tied to next"> ⁀</span>}
                          </span>
                          <span className={`block text-[11px] ${isCurrent ? "" : "text-muted-foreground"}`}>
                            {durationLabel(n.beats)}
                          </span>
                          <span className="block font-script text-xs">{n.lyric ?? "\u00a0"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <NoteEditor
            // Remount after insert/delete so the pitch box never shows the previous note
            key={`${selected}:${draft.notes.length}`}
            note={draft.notes[selected]}
            onChange={(patch) => updateNote(selected, patch)}
            onInsertBefore={() => insertAt(selected, selected)}
            onInsertAfter={() => insertAt(selected + 1, selected)}
            onDelete={() => deleteNote(selected)}
          />
        </div>
      )}

      {/* Spoken lines */}
      <div className="space-y-2 rounded-xl border border-border bg-surface-raised/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={labelClass}>Spoken lines</span>
          <span className="text-xs text-muted-foreground">
            {draft.spoken?.length ?? 0} · shown at the start of their measure
          </span>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {draft.link && spokenInSection > 0 && (
              <Button
                variant="outline"
                size="sm"
                title="Replaces the spoken lines below"
                onClick={() => setSpoken(placeSpokenLines(sectionLines ?? [], draft.notes))}
              >
                Pull spoken lines from {draft.link.sectionTitle}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={addCue} className="gap-1.5">
              <FaPlus className="h-3 w-3" /> Add spoken line
            </Button>
          </div>
        </div>
        {(draft.spoken ?? []).map((c, k) => (
          <div key={k} className="flex flex-wrap items-start gap-1.5 sm:flex-nowrap">
            <input
              type="number"
              min={1}
              aria-label="Measure"
              className={`${cueInputClass} w-16 flex-shrink-0`}
              value={c.measure}
              onChange={(e) => updateCue(k, { measure: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
              onBlur={() => setSpoken(sortCues(draft.spoken ?? []))}
            />
            <input
              aria-label="Character"
              placeholder="Character (blank = direction)"
              className={`${cueInputClass} w-40 flex-shrink-0`}
              value={c.character}
              onChange={(e) => updateCue(k, { character: e.target.value })}
            />
            <textarea
              aria-label="Spoken line"
              rows={1}
              className={`${cueInputClass} min-w-0 flex-1 font-script`}
              value={c.line}
              onChange={(e) => updateCue(k, { line: e.target.value })}
            />
            <Button
              variant="ghost"
              size="sm"
              aria-label="Delete spoken line"
              onClick={() => setSpoken((draft.spoken ?? []).filter((_, j) => j !== k))}
              className="text-curtain"
            >
              <FaTrash className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface/95 py-3">
        {saveError && <p className="mr-auto text-sm text-curtain">{saveError}</p>}
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => void handleSave()}
          disabled={save.isPending || draft.notes.length === 0 || !draft.title.trim()}
          className="bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/90"
        >
          {save.isPending ? "Saving…" : "Save melody"}
        </Button>
      </div>
    </div>
  );
}

interface NoteEditorProps {
  note: MelodyNote;
  onChange: (patch: Partial<MelodyNote>) => void;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onDelete: () => void;
}

function NoteEditor({ note, onChange, onInsertBefore, onInsertAfter, onDelete }: NoteEditorProps) {
  const [pitchText, setPitchText] = useState(note.pitch ?? "");
  const pitchValid = pitchText.trim() === "" || normalizePitch(pitchText) !== null;

  const commitPitch = (text: string) => {
    setPitchText(text);
    if (text.trim() === "") onChange({ pitch: null, tieToNext: undefined });
    else {
      const p = normalizePitch(text);
      if (p) onChange({ pitch: p });
    }
  };

  const hasPresetDuration = DURATION_OPTIONS.some((d) => Math.abs(d.beats - note.beats) < 1e-6);

  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface p-2 sm:grid-cols-6">
      <label className="space-y-1">
        <span className={labelClass}>Pitch</span>
        <input
          className={`${inputClass} ${pitchValid ? "" : "border-curtain ring-1 ring-curtain"}`}
          value={pitchText}
          placeholder="rest"
          aria-invalid={!pitchValid}
          onChange={(e) => commitPitch(e.target.value)}
        />
        {!pitchValid && <span className="text-[11px] text-curtain">Like C4, F#4, Bb3</span>}
      </label>
      <label className="space-y-1">
        <span className={labelClass}>Duration</span>
        <select
          className={inputClass}
          value={note.beats}
          onChange={(e) => onChange({ beats: Number(e.target.value) })}
        >
          {!hasPresetDuration && <option value={note.beats}>{formatBeats(note.beats)} beats</option>}
          {DURATION_OPTIONS.map((d) => (
            <option key={d.beats} value={d.beats}>
              {d.label} ({formatBeats(d.beats)})
            </option>
          ))}
        </select>
      </label>
      <label className="col-span-2 space-y-1">
        <span className={labelClass}>Lyric</span>
        <input
          className={`${inputClass} font-script`}
          value={note.lyric ?? ""}
          onChange={(e) => onChange({ lyric: e.target.value || undefined })}
        />
      </label>
      <label className="space-y-1">
        <span className={labelClass}>Measure</span>
        <input
          type="number"
          min={1}
          className={inputClass}
          value={note.measure}
          onChange={(e) => onChange({ measure: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
        />
      </label>
      <label className="flex items-end gap-2 pb-2 text-sm">
        <input
          type="checkbox"
          checked={!!note.tieToNext}
          disabled={note.pitch === null}
          onChange={(e) => onChange({ tieToNext: e.target.checked || undefined })}
        />
        Tie to next
      </label>
      <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-6">
        <Button variant="outline" size="sm" onClick={onInsertBefore} className="gap-1.5">
          <FaPlus className="h-3 w-3" /> Insert before
        </Button>
        <Button variant="outline" size="sm" onClick={onInsertAfter} className="gap-1.5">
          <FaPlus className="h-3 w-3" /> Insert after
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="gap-1.5 text-curtain">
          <FaTrash className="h-3 w-3" /> Delete
        </Button>
      </div>
    </div>
  );
}

interface LinkOption {
  key: string;
  source: MelodySource;
  projectName: string;
  sections: string[];
}

function LinkPicker({ value, onChange }: { value?: MelodyLink; onChange: (link?: MelodyLink) => void }) {
  const { data: session } = useSession();
  const opts = { refetchOnWindowFocus: false };
  const { data: userData } = api.scriptData.getAll.useQuery(
    { dataSource: "firestore" },
    { ...opts, enabled: !!session?.user },
  );
  const { data: sharedData } = api.scriptData.getAll.useQuery(
    { dataSource: "shared" },
    { ...opts, enabled: !!session?.user },
  );
  const { data: publicData } = api.scriptData.getAll.useQuery({ dataSource: "public" }, opts);
  const { data: localData } = api.scriptData.getAll.useQuery({ dataSource: "local" }, opts);

  const projects: LinkOption[] = useMemo(() => {
    const out: LinkOption[] = [];
    const add = (source: MelodySource, data?: { allData: { project: string; scenes: { title: string }[] }[] }) =>
      data?.allData.forEach((p) =>
        out.push({
          key: `${source}::${p.project}`,
          source,
          projectName: p.project,
          sections: p.scenes.map((s) => s.title),
        }),
      );
    add("user", userData);
    add("shared", sharedData);
    add("public", publicData);
    add("local", localData);
    return out;
  }, [userData, sharedData, publicData, localData]);

  const projectKey = value ? `${value.source}::${value.projectName}` : "";
  const project = projects.find((p) => p.key === projectKey);
  const sourceLabel: Record<MelodySource, string> = {
    user: "Yours",
    shared: "Shared",
    public: "Public",
    local: "Local",
  };

  return (
    <div className="flex flex-col gap-1 sm:flex-row">
      <select
        aria-label="Project"
        className={inputClass}
        value={projectKey}
        onChange={(e) => {
          const p = projects.find((x) => x.key === e.target.value);
          onChange(p?.sections[0] ? { projectName: p.projectName, source: p.source, sectionTitle: p.sections[0] } : undefined);
        }}
      >
        <option value="">Not linked</option>
        {value && !project && <option value={projectKey}>{value.projectName}</option>}
        {projects.map((p) => (
          <option key={p.key} value={p.key}>
            {p.projectName} ({sourceLabel[p.source]})
          </option>
        ))}
      </select>
      {value && (
        <select
          aria-label="Section"
          className={inputClass}
          value={value.sectionTitle}
          onChange={(e) => onChange({ ...value, sectionTitle: e.target.value })}
        >
          {!project?.sections.includes(value.sectionTitle) && (
            <option value={value.sectionTitle}>{value.sectionTitle}</option>
          )}
          {project?.sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
