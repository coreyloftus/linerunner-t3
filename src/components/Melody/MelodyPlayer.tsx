"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { FiMinus, FiPlus } from "react-icons/fi";
import { FaPlay, FaPause, FaStop, FaPen, FaDownload, FaTrash, FaRepeat, FaSliders } from "react-icons/fa6";
import { Button } from "../ui/button";
import { renderWav, useMelodyPlayer } from "~/hooks/useMelodyPlayer";
import { MelodyPanel } from "./MelodyPanel";
import { groupByMeasure, type Melody } from "~/lib/melody";
import { ScriptContext } from "~/app/context";
import {
  clampStaffScale,
  STAFF_SCALE_MAX,
  STAFF_SCALE_MIN,
  STAFF_SCALE_STEP,
  type MelodyView,
} from "~/lib/preferences";

interface MelodyPlayerProps {
  melody: Melody;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground";
const stepButton =
  "flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface-raised text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

const segmentButton = (active: boolean) =>
  `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
    active ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
  }`;

const TEMPO_MIN = 50;
const TEMPO_MAX = 150;
const TEMPO_STEP = 5;

const VIEWS: { v: MelodyView; label: string }[] = [
  { v: "score", label: "Score" },
  { v: "lyrics", label: "Lyrics" },
  { v: "both", label: "Both" },
];
const OCTAVES = [
  { v: -1, label: "Down" },
  { v: 0, label: "Normal" },
  { v: 1, label: "Up" },
];

export function MelodyPlayer({ melody, onEdit, onDelete }: MelodyPlayerProps) {
  const player = useMelodyPlayer(melody);
  const { melodyPreferences, setMelodyPreferences, displayPreferences } = useContext(ScriptContext);
  const { view, staffScale } = melodyPreferences;
  const measures = useMemo(() => groupByMeasure(melody.notes), [melody.notes]);
  const measureNumbers = measures.map(([m]) => m);
  const [loopStart, setLoopStart] = useState(measureNumbers[0] ?? 1);
  const [loopEnd, setLoopEnd] = useState(measureNumbers[Math.min(1, measureNumbers.length - 1)] ?? 1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const tempoPercent = Math.round(player.tempoScale * 100);
  const { setLoop, loop } = player;

  const loopRange = useMemo(() => {
    const lo = Math.min(loopStart, loopEnd);
    const hi = Math.max(loopStart, loopEnd);
    const start = melody.notes.findIndex((n) => n.measure >= lo);
    let end = -1;
    melody.notes.forEach((n, i) => {
      if (n.measure <= hi) end = i;
    });
    return start >= 0 && end >= start ? { start, end } : null;
  }, [loopStart, loopEnd, melody.notes]);

  // Keep an active loop in step with its measure selects
  useEffect(() => {
    if (loop) setLoop(loopRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopRange]);

  const setStaffScale = (next: number) =>
    setMelodyPreferences((prev) => ({ ...prev, staffScale: clampStaffScale(next) }));

  const meta = [
    `♩ = ${melody.tempoBpm}`,
    melody.timeSignature.join("/"),
    melody.keySignature,
    melody.link && `${melody.link.projectName} — ${melody.link.sectionTitle}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const handleDownload = async () => {
    setRenderError(null);
    setIsRendering(true);
    try {
      const blob = await renderWav(melody, player.tempoScale, player.octaveShift);
      const safeTitle = melody.title.replace(/[^\w\s-]/g, "").trim() || "melody";
      saveAs(blob, `${safeTitle} (${tempoPercent}%).wav`);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : "Could not render audio");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <h3 title={meta} className="min-w-0 max-w-full truncate font-display text-lg font-semibold md:max-w-[16rem]">
          {melody.title}
        </h3>

        <div className="flex gap-1.5">
          {player.isPlaying ? (
            <Button
              size="sm"
              onClick={player.pause}
              aria-label="Pause"
              className="min-w-[44px] gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-accent dark:text-accent-foreground md:min-h-0"
            >
              <FaPause className="h-3 w-3" /> <span className="hidden md:inline">Pause</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => void player.play()}
              disabled={player.isLoading}
              aria-label={player.isLoading ? "Loading piano" : "Play"}
              className="min-w-[44px] gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-accent dark:text-accent-foreground md:min-h-0"
            >
              <FaPlay className="h-3 w-3" />{" "}
              <span className="hidden md:inline">{player.isLoading ? "Loading piano…" : "Play"}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={player.stop} aria-label="Stop" className="min-w-[44px] gap-1.5 md:min-h-0">
            <FaStop className="h-3 w-3" /> <span className="hidden md:inline">Stop</span>
          </Button>
        </div>

        <div className="flex items-center gap-1.5" title={`${Math.round(melody.tempoBpm * player.tempoScale)} bpm`}>
          <span className={labelClass}>Tempo</span>
          <button
            type="button"
            className={stepButton}
            disabled={tempoPercent <= TEMPO_MIN}
            onClick={() => player.setTempoScale(Math.max(TEMPO_MIN, tempoPercent - TEMPO_STEP) / 100)}
            aria-label="Slower"
          >
            <FiMinus className="h-4 w-4" />
          </button>
          <span className="w-11 text-center text-sm font-medium">{tempoPercent}%</span>
          <button
            type="button"
            className={stepButton}
            disabled={tempoPercent >= TEMPO_MAX}
            onClick={() => player.setTempoScale(Math.min(TEMPO_MAX, tempoPercent + TEMPO_STEP) / 100)}
            aria-label="Faster"
          >
            <FiPlus className="h-4 w-4" />
          </button>
        </div>

        <div role="group" aria-label="View" className="flex rounded-lg border border-border bg-surface p-0.5">
          {VIEWS.map(({ v, label }) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setMelodyPreferences((prev) => ({ ...prev, view: v }))}
              className={segmentButton(view === v)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className={labelClass}>Zoom</span>
          <button
            type="button"
            className={stepButton}
            disabled={view === "lyrics" || staffScale <= STAFF_SCALE_MIN}
            onClick={() => setStaffScale(staffScale - STAFF_SCALE_STEP)}
            aria-label="Zoom out"
          >
            <FiMinus className="h-4 w-4" />
          </button>
          <span className={`w-11 text-center text-sm font-medium ${view === "lyrics" ? "opacity-50" : ""}`}>
            {Math.round(staffScale * 100)}%
          </span>
          <button
            type="button"
            className={stepButton}
            disabled={view === "lyrics" || staffScale >= STAFF_SCALE_MAX}
            onClick={() => setStaffScale(staffScale + STAFF_SCALE_STEP)}
            aria-label="Zoom in"
          >
            <FiPlus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          aria-controls="melody-more-controls"
          aria-label="More controls"
          title="More controls"
          className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
            showMore ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface-raised text-foreground hover:bg-muted"
          }`}
        >
          <FaSliders className="h-3.5 w-3.5" />
        </button>
      </div>

      {showMore && (
        <div
          id="melody-more-controls"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border bg-surface-raised/60 px-3 py-2"
        >
          <div className="flex items-center gap-1.5">
            <span className={labelClass}>Octave</span>
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              {OCTAVES.map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => player.setOctaveShift(v)}
                  className={segmentButton(player.octaveShift === v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={labelClass}>Loop</span>
            <select
              aria-label="Loop start measure"
              className="rounded-md border border-border bg-surface px-1.5 py-1 text-sm"
              value={loopStart}
              onChange={(e) => setLoopStart(Number(e.target.value))}
            >
              {measureNumbers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">to</span>
            <select
              aria-label="Loop end measure"
              className="rounded-md border border-border bg-surface px-1.5 py-1 text-sm"
              value={loopEnd}
              onChange={(e) => setLoopEnd(Number(e.target.value))}
            >
              {measureNumbers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setLoop(loop ? null : loopRange)}
              aria-pressed={!!loop}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                loop ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <FaRepeat className="h-3 w-3" /> {loop ? "Looping" : "Loop"}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 md:ml-auto">
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5 md:min-h-0">
              <FaPen className="h-3 w-3" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleDownload()}
              disabled={isRendering}
              className="gap-1.5 md:min-h-0"
            >
              <FaDownload className="h-3 w-3" /> {isRendering ? "Rendering…" : "Download WAV"}
            </Button>
            {confirmDelete ? (
              <>
                <Button
                  size="sm"
                  onClick={() => void onDelete()}
                  className="bg-curtain text-white hover:bg-curtain/90 dark:bg-curtain dark:text-white md:min-h-0"
                >
                  Delete for good
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} className="md:min-h-0">
                  Keep
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="gap-1.5 text-curtain md:min-h-0">
                <FaTrash className="h-3 w-3" /> Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {renderError && <p className="px-3 pt-2 text-sm text-curtain">{renderError}</p>}

      <MelodyPanel
        melody={melody}
        view={view}
        staffScale={staffScale}
        currentNoteIndex={player.currentNoteIndex}
        loop={loop}
        onNoteClick={(i) => void player.play(i)}
        lyricFontSize={displayPreferences.fontSize}
        className="flex-1 p-2 iphone:p-3"
      />
    </div>
  );
}
