"use client";

import { useEffect, useMemo, useRef } from "react";
import { MelodyStaff } from "./MelodyStaff";
import { groupByMeasure, type Melody } from "~/lib/melody";
import type { MelodyView } from "~/lib/preferences";
import { scrollWithinParent } from "~/lib/utils";

interface MelodyPanelProps {
  melody: Melody;
  view: MelodyView;
  staffScale: number;
  currentNoteIndex: number;
  loop: { start: number; end: number } | null;
  onNoteClick: (index: number) => void;
  /** Percent of the text-lg base, like displayPreferences.fontSize */
  lyricFontSize?: number;
  className?: string;
}

const LYRIC_BASE_REM = 1.125;
const boxClass = "min-h-0 overflow-y-auto rounded-xl border border-border bg-surface [overscroll-behavior:contain]";

// Staff + lyrics that size to their parent; playback state comes in through props
export function MelodyPanel({
  melody,
  view,
  staffScale,
  currentNoteIndex,
  loop,
  onNoteClick,
  lyricFontSize = 100,
  className = "",
}: MelodyPanelProps) {
  const measures = useMemo(() => groupByMeasure(melody.notes), [melody.notes]);
  const currentRef = useRef<HTMLButtonElement | null>(null);
  const showScore = view !== "lyrics";
  const showLyrics = view !== "score";

  useEffect(() => {
    if (currentRef.current) scrollWithinParent(currentRef.current);
  }, [currentNoteIndex, view]);

  return (
    <div className={`flex min-h-0 flex-col gap-2 ${className}`}>
      {showScore && (
        <div className={`${boxClass} px-2 py-1 ${showLyrics ? "flex-[3]" : "flex-1"}`}>
          <MelodyStaff melody={melody} currentNoteIndex={currentNoteIndex} onNoteClick={onNoteClick} scale={staffScale} />
        </div>
      )}

      {showLyrics && (
        <div className={`${boxClass} p-4 ${showScore ? "flex-[2]" : "flex-1"}`}>
          <div
            className="space-y-3 font-script leading-relaxed"
            style={{ fontSize: `${(LYRIC_BASE_REM * lyricFontSize) / 100}rem` }}
          >
            {measures.map(([measure, indexes]) => {
              const inLoop = loop && indexes.some((i) => i >= loop.start && i <= loop.end);
              return (
                <div key={measure} className={`flex flex-wrap items-baseline gap-x-1 rounded-md px-1 ${inLoop ? "bg-accent-soft/50" : ""}`}>
                  <span className="mr-2 w-6 flex-shrink-0 text-right font-sans text-[11px] text-muted-foreground">{measure}</span>
                  {indexes.map((i) => {
                    const n = melody.notes[i]!;
                    const isCurrent = currentNoteIndex === i;
                    const text = n.pitch === null ? "·" : n.lyric ?? "~";
                    return (
                      <button
                        key={i}
                        ref={isCurrent ? currentRef : undefined}
                        type="button"
                        onClick={() => onNoteClick(i)}
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
      )}
    </div>
  );
}
