"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type * as VexNS from "vexflow/bravura";
import {
  badMeasures,
  groupByMeasure,
  PITCH_PATTERN,
  type Melody,
  type MelodyNote,
} from "~/lib/melody";
import { scrollWithinParent } from "~/lib/utils";

type Vex = typeof VexNS;
type StaveNote = InstanceType<Vex["StaveNote"]>;

interface MelodyStaffProps {
  melody: Pick<Melody, "notes" | "timeSignature" | "keySignature" | "pickupBeats">;
  currentNoteIndex?: number;
  onNoteClick?: (index: number) => void;
  className?: string;
}

const VALID_KEYS = new Set(
  "C Am F Dm Bb Gm Eb Cm Ab Fm Db Bbm Gb Ebm Cb Abm G Em D Bm A F#m E C#m B G#m F# D#m C# A#m".split(" "),
);

/** "Eb major" → "Eb", "F# minor" → "F#m"; anything unknown → "C" */
export const toVexKey = (keySignature?: string): string => {
  const m = /^\s*([A-Ga-g])\s*(#|b|♯|♭|-?flat|-?sharp)?\s*(major|minor|maj|min|m)?\b/i.exec(keySignature ?? "");
  if (!m) return "C";
  const acc = m[2] ? (/#|♯|sharp/i.test(m[2]) ? "#" : "b") : "";
  const minor = m[3] ? /^min|^m$/i.test(m[3]) && !/^maj/i.test(m[3]) : false;
  const key = `${m[1]!.toUpperCase()}${acc}${minor ? "m" : ""}`;
  return VALID_KEYS.has(key) ? key : "C";
};

// Beats → VexFlow duration; odd values snap to the nearest drawable one
const DURATIONS: [number, string][] = [
  [4, "w"],
  [3, "hd"],
  [2, "h"],
  [1.5, "qd"],
  [1, "q"],
  [0.75, "8d"],
  [0.5, "8"],
  [0.375, "16d"],
  [0.25, "16"],
  [0.125, "32"],
];
const toVexDuration = (beats: number): string =>
  DURATIONS.reduce((best, d) => (Math.abs(d[0] - beats) < Math.abs(best[0] - beats) ? d : best))[1];

const toVexPitch = (pitch: string): string | null => {
  const m = PITCH_PATTERN.exec(pitch);
  return m ? `${m[1]!.toLowerCase()}${m[2] ?? ""}/${m[3]}` : null;
};

let measureCanvas: HTMLCanvasElement | null = null;
const measureText = (text: string, font: string): number => {
  if (!text) return 0;
  measureCanvas ??= document.createElement("canvas");
  const c = measureCanvas.getContext("2d");
  if (!c) return text.length * 9;
  c.font = `13pt ${font}`;
  return c.measureText(text).width;
};

const SVG_NS = "http://www.w3.org/2000/svg";
// Near 1 = even spacing; keeps short notes wide enough for their syllables
const FORMAT_OPTIONS = { softmaxFactor: 2 };
const LYRIC_GAP = 8;
const SYSTEM_GAP = 150; // vertical space per system, room for lyrics below
const STAVE_TOP = 30; // room for measure numbers and high notes
const MEASURE_PADDING = 28;
const MIN_MEASURE = 90;

interface BuiltMeasure {
  measure: number;
  notes: StaveNote[];
  indexes: number[];
  voice: InstanceType<Vex["Voice"]>;
  minWidth: number;
}

function buildMeasure(
  Vex: Vex,
  measure: number,
  indexes: number[],
  notes: MelodyNote[],
  keySpec: string,
  timeSignature: [number, number],
  lyricFont: string,
): BuiltMeasure {
  const { StaveNote, Voice, Formatter, Accidental, Annotation, Dot } = Vex;
  const staveNotes = indexes.map((i) => {
    const n = notes[i]!;
    const duration = toVexDuration(n.beats);
    const key = n.pitch ? toVexPitch(n.pitch) : null;
    const note = new StaveNote({
      keys: [key ?? "b/4"],
      duration: key ? duration : `${duration}r`,
      autoStem: true,
    });
    if (duration.endsWith("d")) Dot.buildAndAttach([note], { all: true });
    note.setLedgerLineStyle({ strokeStyle: "currentColor" });
    if (n.lyric) {
      note.addModifier(
        new Annotation(n.lyric)
          .setFont(lyricFont, 13)
          .setVerticalJustification(Annotation.VerticalJustify.BOTTOM),
      );
    }
    return note;
  });
  // SOFT mode: a measure that does not add up still draws
  const voice = new Voice({ numBeats: timeSignature[0], beatValue: timeSignature[1] })
    .setMode(Voice.Mode.SOFT)
    .addTickables(staveNotes);
  Accidental.applyAccidentals([voice], keySpec);
  const formatter = new Formatter(FORMAT_OPTIONS).joinVoices([voice]);
  // Lyrics need their own room or neighbouring syllables run together
  const lyricWidth = indexes.reduce((sum, i) => sum + Math.max(18, measureText(notes[i]!.lyric ?? "", lyricFont) + 10), 0);
  const minWidth = Math.max(MIN_MEASURE, formatter.preCalculateMinTotalWidth([voice]), lyricWidth) + MEASURE_PADDING;
  return { measure, notes: staveNotes, indexes, voice, minWidth };
}

export function MelodyStaff({ melody, currentNoteIndex = -1, onNoteClick, className = "" }: MelodyStaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const noteElsRef = useRef<Map<number, SVGElement>>(new Map());
  const clickRef = useRef(onNoteClick);
  clickRef.current = onNoteClick;
  const [vex, setVex] = useState<Vex | null>(null);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const mod = await import("vexflow/bravura");
      // Glyph metrics are wrong until the embedded music font is ready
      await document.fonts.load("30px Bravura").catch(() => undefined);
      if (!cancelled) setVex(mod);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let frame = 0;
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(Math.floor(entries[0]!.contentRect.width)));
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!vex || !el || width < 50) return;
    el.innerHTML = "";
    noteElsRef.current = new Map();
    setError(null);
    try {
      renderStaff(vex, el, melody, width, noteElsRef.current, (i) => clickRef.current?.(i));
    } catch (err) {
      console.error("[MelodyStaff] render failed:", err);
      el.innerHTML = "";
      setError("This melody could not be drawn as notation.");
    }
  }, [vex, melody, width]);

  // Highlight by class so playback never re-renders the SVG
  useEffect(() => {
    const els = noteElsRef.current;
    els.forEach((g) => g.classList.remove("vf-current"));
    const current = els.get(currentNoteIndex);
    if (current) {
      current.classList.add("vf-current");
      scrollWithinParent(current, 40, true);
    }
  }, [currentNoteIndex, vex, melody, width]);

  return (
    <div className={`melody-staff text-foreground ${className}`}>
      {!vex && <p className="py-6 text-center font-script text-sm text-muted-foreground">Drawing the staff…</p>}
      {error && <p className="py-3 text-sm text-curtain">{error}</p>}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

function renderStaff(
  Vex: Vex,
  el: HTMLDivElement,
  melody: MelodyStaffProps["melody"],
  containerWidth: number,
  noteEls: Map<number, SVGElement>,
  onClick: (index: number) => void,
) {
  const { Renderer, Stave, Formatter, Beam, StaveTie } = Vex;
  const scale = containerWidth < 640 ? 0.75 : 1;
  const width = containerWidth / scale;
  const keySpec = toVexKey(melody.keySignature);
  const timeSpec = melody.timeSignature.join("/");
  const lyricFont =
    getComputedStyle(document.body).getPropertyValue("--font-courier-prime").trim() || "Courier New";
  const bad = badMeasures(melody);

  const built = groupByMeasure(melody.notes).map(([measure, indexes]) =>
    buildMeasure(Vex, measure, indexes, melody.notes, keySpec, melody.timeSignature, lyricFont),
  );
  if (built.length === 0) return;

  // Width taken by clef + key (+ time) at the start of a system
  const prefixWidth = (withTime: boolean) => {
    const s = new Stave(0, 0, 400).addClef("treble").addKeySignature(keySpec);
    if (withTime) s.addTimeSignature(timeSpec);
    const plain = new Stave(0, 0, 400);
    return s.getNoteStartX() - plain.getNoteStartX();
  };
  const prefixFirst = prefixWidth(true);
  const prefixRest = prefixWidth(false);

  // Greedy wrap into systems
  const systems: BuiltMeasure[][] = [];
  let row: BuiltMeasure[] = [];
  let used = 0;
  for (const m of built) {
    const prefix = row.length === 0 ? (systems.length === 0 ? prefixFirst : prefixRest) : 0;
    const need = m.minWidth + prefix;
    if (row.length > 0 && used + need > width - 2) {
      systems.push(row);
      row = [];
      used = 0;
    }
    used += m.minWidth + (row.length === 0 ? (systems.length === 0 ? prefixFirst : prefixRest) : 0);
    row.push(m);
  }
  if (row.length) systems.push(row);

  const height = systems.length * SYSTEM_GAP + 20;
  const renderer = new Renderer(el, Renderer.Backends.SVG);
  renderer.resize(containerWidth, height * scale);
  const ctx = renderer.getContext();
  ctx.scale(scale, scale);
  ctx.setFillStyle("currentColor");
  ctx.setStrokeStyle("currentColor");

  const svg = el.querySelector("svg")!;
  const placed = new Map<number, { note: StaveNote; system: number }>();

  systems.forEach((system, s) => {
    const y = STAVE_TOP + s * SYSTEM_GAP;
    const prefix = s === 0 ? prefixFirst : prefixRest;
    const natural = system.reduce((sum, m) => sum + m.minWidth, 0) + prefix;
    const isLast = s === systems.length - 1;
    // Stretch full systems to the edge; a short last system keeps natural spacing
    const stretch = isLast && natural < width * 0.7 ? 1 : (width - 2) / natural;
    let x = 0;
    system.forEach((m, j) => {
      const w = m.minWidth * stretch + (j === 0 ? prefix * stretch : 0);
      const stave = new Stave(x, y, w);
      if (j === 0) {
        stave.addClef("treble").addKeySignature(keySpec);
        if (s === 0) stave.addTimeSignature(timeSpec);
      }
      stave.setContext(ctx).draw();

      if (bad.has(m.measure)) {
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(stave.getYForLine(0) - 6));
        rect.setAttribute("width", String(w));
        rect.setAttribute("height", String(stave.getYForLine(4) - stave.getYForLine(0) + 12));
        rect.setAttribute("rx", "4");
        rect.setAttribute("class", "vf-bad-measure");
        svg.insertBefore(rect, svg.firstChild);
      }

      const beams = Beam.generateBeams(m.notes);
      new Formatter(FORMAT_OPTIONS)
        .joinVoices([m.voice])
        .format([m.voice], Math.max(10, stave.getNoteEndX() - stave.getNoteStartX() - 10));
      m.voice.draw(ctx, stave);
      beams.forEach((b) => b.setContext(ctx).draw());

      m.notes.forEach((note, k) => {
        const index = m.indexes[k]!;
        placed.set(index, { note, system: s });
        const g = note.getSVGElement();
        if (!g) return;
        g.classList.add("vf-note");
        g.addEventListener("click", () => onClick(index));
        noteEls.set(index, g);
      });
      x += w;
    });

    const number = document.createElementNS(SVG_NS, "text");
    number.setAttribute("x", "2");
    number.setAttribute("y", String(y + 22));
    number.setAttribute("class", "vf-measure-number");
    number.textContent = String(system[0]!.measure);
    svg.appendChild(number);

    // One lyric baseline per system, under its lowest note
    const lyrics = system.flatMap((m) =>
      m.indexes.flatMap((i) => [...(noteEls.get(i)?.querySelectorAll<SVGTextElement>(".vf-annotation text") ?? [])]),
    );
    const baseline = Math.max(...lyrics.map((t) => Number(t.getAttribute("y")) || 0));
    lyrics.forEach((t) => t.setAttribute("y", String(baseline)));
    // Nudge any syllable that still overlaps the one before it
    let prevRight = -Infinity;
    for (const t of lyrics) {
      const tx = Number(t.getAttribute("x")) || 0;
      const x0 = Math.max(tx, prevRight + LYRIC_GAP);
      if (x0 !== tx) t.setAttribute("x", String(x0));
      prevRight = x0 + t.getComputedTextLength();
    }
  });

  // Ties; a tie across a system break draws as two open halves
  melody.notes.forEach((n, i) => {
    if (!n.tieToNext || n.pitch === null) return;
    const next = melody.notes[i + 1];
    const a = placed.get(i);
    const b = placed.get(i + 1);
    if (!a || !b || next?.pitch !== n.pitch) return;
    const ties =
      a.system === b.system
        ? [new StaveTie({ firstNote: a.note, lastNote: b.note, firstIndexes: [0], lastIndexes: [0] })]
        : [
            new StaveTie({ firstNote: a.note, firstIndexes: [0] }),
            new StaveTie({ lastNote: b.note, lastIndexes: [0] }),
          ];
    ties.forEach((t) => t.setContext(ctx).draw());
  });
}
