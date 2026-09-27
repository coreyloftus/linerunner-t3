"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import { FiMinus, FiPlus } from "react-icons/fi";
import { FaPlay, FaPause, FaStop, FaPen, FaDownload, FaTrash, FaRepeat } from "react-icons/fa6";
import { Button } from "../ui/button";
import { renderWav, useMelodyPlayer } from "~/hooks/useMelodyPlayer";
import { type Melody } from "~/lib/melody";
import { groupByMeasure } from "./MelodyReview";

interface MelodyPlayerProps {
  melody: Melody;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground";
const stepButton =
  "flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface-raised text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

const TEMPO_MIN = 50;
const TEMPO_MAX = 150;
const TEMPO_STEP = 5;

export function MelodyPlayer({ melody, onEdit, onDelete }: MelodyPlayerProps) {
  const player = useMelodyPlayer(melody);
  const measures = useMemo(() => groupByMeasure(melody.notes), [melody.notes]);
  const measureNumbers = measures.map(([m]) => m);
  const [loopStart, setLoopStart] = useState(measureNumbers[0] ?? 1);
  const [loopEnd, setLoopEnd] = useState(measureNumbers[Math.min(1, measureNumbers.length - 1)] ?? 1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const currentRef = useRef<HTMLButtonElement | null>(null);

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

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [player.currentNoteIndex]);

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
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold">{melody.title}</h3>
          <p className="text-xs text-muted-foreground">
            ♩ = {melody.tempoBpm} · {melody.timeSignature.join("/")}
            {melody.keySignature && ` · ${melody.keySignature}`}
            {melody.link && ` · ${melody.link.projectName} — ${melody.link.sectionTitle}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
            <FaPen className="h-3 w-3" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleDownload()} disabled={isRendering} className="gap-1.5">
            <FaDownload className="h-3 w-3" /> {isRendering ? "Rendering…" : "Download WAV"}
          </Button>
          {confirmDelete ? (
            <>
              <Button
                size="sm"
                onClick={() => void onDelete()}
                className="bg-curtain text-white hover:bg-curtain/90 dark:bg-curtain dark:text-white"
              >
                Delete for good
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="gap-1.5 text-curtain">
              <FaTrash className="h-3 w-3" /> Delete
            </Button>
          )}
        </div>
      </div>
      {renderError && <p className="text-sm text-curtain">{renderError}</p>}

      {/* Transport + settings */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 rounded-xl border border-border bg-surface-raised/60 p-3">
        <div className="flex gap-1.5">
          {player.isPlaying ? (
            <Button size="sm" onClick={player.pause} className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-accent dark:text-accent-foreground">
              <FaPause className="h-3 w-3" /> Pause
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => void player.play()}
              disabled={player.isLoading}
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-accent dark:text-accent-foreground"
            >
              <FaPlay className="h-3 w-3" /> {player.isLoading ? "Loading piano…" : "Play"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={player.stop} className="gap-1.5">
            <FaStop className="h-3 w-3" /> Stop
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          <span className={labelClass}>Tempo</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={stepButton}
              disabled={tempoPercent <= TEMPO_MIN}
              onClick={() => player.setTempoScale(Math.max(TEMPO_MIN, tempoPercent - TEMPO_STEP) / 100)}
              aria-label="Slower"
            >
              <FiMinus className="h-4 w-4" />
            </button>
            <span className="w-24 text-center text-sm font-medium">
              {tempoPercent}% · {Math.round(melody.tempoBpm * player.tempoScale)}
            </span>
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
        </div>

        <div className="flex flex-col gap-1">
          <span className={labelClass}>Octave</span>
          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            {[
              { v: -1, label: "Down" },
              { v: 0, label: "Normal" },
              { v: 1, label: "Up" },
            ].map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => player.setOctaveShift(v)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  player.octaveShift === v
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className={labelClass}>Loop measures</span>
          <div className="flex items-center gap-1.5">
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
        </div>
      </div>

      {/* Lyrics */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-surface p-4 [overscroll-behavior:contain]">
        <div className="space-y-3 font-script text-lg leading-relaxed">
          {measures.map(([measure, indexes]) => {
            const inLoop = loop && indexes.some((i) => i >= loop.start && i <= loop.end);
            return (
              <div key={measure} className={`flex flex-wrap items-baseline gap-x-1 rounded-md px-1 ${inLoop ? "bg-accent-soft/50" : ""}`}>
                <span className="mr-2 w-6 flex-shrink-0 text-right font-sans text-[11px] text-muted-foreground">{measure}</span>
                {indexes.map((i) => {
                  const n = melody.notes[i]!;
                  const isCurrent = player.currentNoteIndex === i;
                  const text = n.pitch === null ? "·" : n.lyric ?? "~";
                  return (
                    <button
                      key={i}
                      ref={isCurrent ? currentRef : undefined}
                      type="button"
                      onClick={() => void player.play(i)}
                      title={`${n.pitch ?? "rest"} · click to play from here`}
                      className={`rounded px-0.5 transition-colors ${
                        isCurrent
                          ? "bg-accent text-accent-foreground"
                          : n.lyric
                            ? "hover:bg-muted"
                            : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
