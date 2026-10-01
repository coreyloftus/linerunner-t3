"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type * as VexNS from "vexflow/bravura";
import {
  badMeasures,
  cuesByMeasure,
  groupByMeasure,
  PITCH_PATTERN,
  type Melody,
  type MelodyNote,
  type MelodySpokenCue,
} from "~/lib/melody";
import { scrollWithinParent } from "~/lib/utils";

type Vex = typeof VexNS;
type StaveNote = InstanceType<Vex["StaveNote"]>;

interface MelodyStaffProps {
  melody: Pick<Melody, "notes" | "timeSignature" | "keySignature" | "pickupBeats" | "spoken">;
  currentNoteIndex?: number;
  selectedNoteIndex?: number | null;
  onNoteClick?: (index: number) => void;
  /** Measure numbers on each drawn line, reported after every render */
  onLayout?: (systems: number[][]) => void;
  /** Zoom factor; phones draw at 0.75 of it */
  scale?: number;
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
const measureText = (text: string, font: string, size = "13pt"): number => {
  if (!text) return 0;
  measureCanvas ??= document.createElement("canvas");
  const c = measureCanvas.getContext("2d");
  if (!c) return text.length * 9;
  c.font = `${size} ${font}`;
  return c.measureText(text).width;
};

const CUE_SIZE = 13; // px, spoken line text
const CUE_NAME_SIZE = 10; // px, character name in small caps
const CUE_LINE_HEIGHT = 18;
const CUE_MIN_WIDTH = 320;
const CUE_GAP = 6; // between two cues in one system

interface CueRow {
  x: number;
  dy: number; // offset from the top of the system's cue band
  name?: string;
  text: string;
  measure: number;
  direction: boolean;
}

/** Word-wrap one cue into rows; the first row leaves room for the character name */
function layoutCue(cue: MelodySpokenCue, x: number, maxWidth: number, font: string): Omit<CueRow, "dy">[] {
  const name = cue.character.trim().toUpperCase();
  const nameWidth = name ? measureText(name, "sans-serif", `${CUE_NAME_SIZE}px`) * 1.15 + 8 : 0;
  const rows: Omit<CueRow, "dy">[] = [];
  let row = "";
  let room = maxWidth - nameWidth;
  for (const word of cue.line.split(/\s+/).filter(Boolean)) {
    const next = row ? `${row} ${word}` : word;
    if (row && measureText(next, font, `${CUE_SIZE}px`) > room) {
      rows.push({ x, text: row, measure: cue.measure, direction: !name });
      row = word;
      room = maxWidth;
    } else row = next;
  }
  rows.push({ x, text: row, measure: cue.measure, direction: !name });
  if (name) rows[0]!.name = name;
  return rows;
}

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

export function MelodyStaff({
  melody,
  currentNoteIndex = -1,
  selectedNoteIndex = null,
  onNoteClick,
  onLayout,
  scale = 1,
  className = "",
}: MelodyStaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const noteElsRef = useRef<Map<number, SVGElement>>(new Map());
  const clickRef = useRef(onNoteClick);
  clickRef.current = onNoteClick;
  const layoutRef = useRef(onLayout);
  layoutRef.current = onLayout;
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
      const systems = renderStaff(vex, el, melody, width, scale, noteElsRef.current, (i) => clickRef.current?.(i));
      layoutRef.current?.(systems);
    } catch (err) {
      console.error("[MelodyStaff] render failed:", err);
      el.innerHTML = "";
      setError("This melody could not be drawn as notation.");
    }
  }, [vex, melody, width, scale]);

  // Highlight by class so playback never re-renders the SVG
  useEffect(() => {
    const els = noteElsRef.current;
    els.forEach((g) => g.classList.remove("vf-current"));
    const current = els.get(currentNoteIndex);
    if (current) {
      current.classList.add("vf-current");
      scrollWithinParent(current, 40, true);
    }
    // Spoken lines light up while playback is in their measure
    const measure = String(melody.notes[currentNoteIndex]?.measure ?? "");
    containerRef.current?.querySelectorAll<SVGGElement>(".vf-cue").forEach((g) => {
      g.classList.toggle("vf-current", g.dataset.measure === measure);
    });
  }, [currentNoteIndex, vex, melody, width, scale]);

  useEffect(() => {
    const els = noteElsRef.current;
    els.forEach((g) => g.classList.remove("vf-selected"));
    if (selectedNoteIndex !== null) els.get(selectedNoteIndex)?.classList.add("vf-selected");
  }, [selectedNoteIndex, vex, melody, width, scale]);

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
  zoom: number,
  noteEls: Map<number, SVGElement>,
  onClick: (index: number) => void,
): number[][] {
  const { Renderer, Stave, Formatter, Beam, StaveTie } = Vex;
  const scale = zoom * (containerWidth < 640 ? 0.75 : 1);
  const width = containerWidth / scale;
  const keySpec = toVexKey(melody.keySignature);
  const timeSpec = melody.timeSignature.join("/");
  const lyricFont =
    getComputedStyle(document.body).getPropertyValue("--font-courier-prime").trim() || "Courier New";
  const bad = badMeasures(melody);

  const built = groupByMeasure(melody.notes).map(([measure, indexes]) =>
    buildMeasure(Vex, measure, indexes, melody.notes, keySpec, melody.timeSignature, lyricFont),
  );
  if (built.length === 0) return [];

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

  // Measure boxes per system, plus the band of spoken lines each system needs above it
  const cues = cuesByMeasure(melody.spoken);
  const layouts = systems.map((system, s) => {
    const prefix = s === 0 ? prefixFirst : prefixRest;
    const natural = system.reduce((sum, m) => sum + m.minWidth, 0) + prefix;
    const isLast = s === systems.length - 1;
    // Stretch full systems to the edge; a short last system keeps natural spacing
    const stretch = isLast && natural < width * 0.7 ? 1 : (width - 2) / natural;
    let x = 0;
    const boxes = system.map((m, j) => {
      const w = m.minWidth * stretch + (j === 0 ? prefix * stretch : 0);
      const box = { x, w, noteX: x + (j === 0 ? prefix * stretch : 0) };
      x += w;
      return box;
    });
    const rows: CueRow[] = [];
    let dy = 0;
    system.forEach((m, j) => {
      for (const cue of cues.get(m.measure) ?? []) {
        const start = Math.max(0, Math.min(boxes[j]!.noteX + 4, width - CUE_MIN_WIDTH));
        if (rows.length) dy += CUE_GAP;
        for (const r of layoutCue(cue, start, width - 2 - start, lyricFont)) {
          rows.push({ ...r, dy });
          dy += CUE_LINE_HEIGHT;
        }
      }
    });
    return { boxes, rows, band: rows.length ? dy + 6 : 0 };
  });

  let cursor = 0;
  const tops = layouts.map((l) => {
    const top = cursor;
    cursor += l.band + SYSTEM_GAP;
    return top;
  });
  const height = cursor + 20;
  const renderer = new Renderer(el, Renderer.Backends.SVG);
  renderer.resize(containerWidth, height * scale);
  const ctx = renderer.getContext();
  ctx.scale(scale, scale);
  ctx.setFillStyle("currentColor");
  ctx.setStrokeStyle("currentColor");

  const svg = el.querySelector("svg")!;
  const placed = new Map<number, { note: StaveNote; system: number }>();

  systems.forEach((system, s) => {
    const { boxes, rows, band } = layouts[s]!;
    const y = tops[s]! + band + STAVE_TOP;

    for (const r of rows) {
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", `vf-cue${r.direction ? " vf-cue-direction" : ""}`);
      g.dataset.measure = String(r.measure);
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", String(r.x));
      text.setAttribute("y", String(tops[s]! + 8 + r.dy + CUE_SIZE));
      text.style.fontFamily = lyricFont;
      if (r.name) {
        const name = document.createElementNS(SVG_NS, "tspan");
        name.setAttribute("class", "vf-cue-name");
        name.textContent = r.name;
        text.appendChild(name);
      }
      const body = document.createElementNS(SVG_NS, "tspan");
      if (r.name) body.setAttribute("dx", "8");
      body.textContent = r.text;
      text.appendChild(body);
      g.appendChild(text);
      svg.appendChild(g);
    }

    system.forEach((m, j) => {
      const { x, w } = boxes[j]!;
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

      const number = document.createElementNS(SVG_NS, "text");
      number.setAttribute("x", String(x + w - 3));
      number.setAttribute("y", String(stave.getYForLine(0) - 4));
      number.setAttribute("text-anchor", "end");
      number.setAttribute("class", "vf-measure-number");
      number.textContent = String(m.measure);
      svg.appendChild(number);

      m.notes.forEach((note, k) => {
        const index = m.indexes[k]!;
        placed.set(index, { note, system: s });
        const g = note.getSVGElement();
        if (!g) return;
        g.classList.add("vf-note");
        g.addEventListener("click", () => onClick(index));
        noteEls.set(index, g);
      });
    });

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

  return systems.map((system) => system.map((m) => m.measure));
}
