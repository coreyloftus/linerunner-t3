import { z } from "zod";

export interface MelodyNote {
  pitch: string | null; // scientific pitch, e.g. "C4", "F#4", "Bb3"; null = rest
  beats: number; // duration in quarter-note beats
  lyric?: string; // syllable under this note, hyphen kept for split words
  tieToNext?: boolean;
  measure: number; // 1-based
}

export type MelodySource = "local" | "public" | "shared" | "user";

export interface MelodyLink {
  projectName: string;
  source: MelodySource;
  sectionTitle: string;
}

export interface Melody {
  id: string;
  title: string;
  tempoBpm: number;
  timeSignature: [number, number];
  keySignature?: string;
  pickupBeats?: number;
  notes: MelodyNote[];
  link?: MelodyLink;
  sourceFileName: string;
  extractionModel: string;
  createdAt: string;
  updatedAt: string;
}

export type MelodyDraft = Omit<Melody, "id" | "createdAt" | "updatedAt">;

export interface MelodySummary {
  id: string;
  title: string;
  link?: MelodyLink;
  updatedAt: string;
  noteCount: number;
}

export const PITCH_PATTERN = /^([A-Ga-g])(##|bb|#|b)?(-?\d)$/;

export const melodyNoteSchema = z.object({
  pitch: z
    .string()
    .regex(PITCH_PATTERN, "Pitch must look like C4, F#4 or Bb3")
    .nullable(),
  beats: z.number().positive().max(16),
  lyric: z.string().max(40).optional(),
  tieToNext: z.boolean().optional(),
  measure: z.number().int().min(1),
});

export const melodyLinkSchema = z.object({
  projectName: z.string().min(1),
  source: z.enum(["local", "public", "shared", "user"]),
  sectionTitle: z.string().min(1),
});

export const melodySchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  tempoBpm: z.number().min(20).max(300),
  timeSignature: z.tuple([
    z.number().int().min(1).max(16),
    z.number().int().refine((n) => [1, 2, 4, 8, 16].includes(n), {
      message: "Time signature bottom must be 1, 2, 4, 8 or 16",
    }),
  ]),
  keySignature: z.string().max(40).optional(),
  pickupBeats: z.number().min(0).max(16).optional(),
  notes: z.array(melodyNoteSchema).max(2000),
  link: melodyLinkSchema.optional(),
  sourceFileName: z.string().max(300),
  extractionModel: z.string().max(100),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const melodyDraftSchema = melodySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/** Beats one full measure holds, in quarter notes */
export const measureLength = ([top, bottom]: [number, number]): number =>
  (top * 4) / bottom;

/** Cumulative start offset (in quarter-note beats) of every note */
export const noteStartBeats = (notes: MelodyNote[]): number[] => {
  const starts: number[] = [];
  let t = 0;
  for (const note of notes) {
    starts.push(t);
    t += note.beats;
  }
  return starts;
};

export const totalBeats = (notes: MelodyNote[]): number =>
  notes.reduce((sum, n) => sum + n.beats, 0);

const LETTER_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};
const ACCIDENTAL: Record<string, number> = {
  "": 0,
  "#": 1,
  "##": 2,
  b: -1,
  bb: -2,
};

/** MIDI number for a scientific pitch (C4 = 60), or null when unparseable */
export const pitchToMidi = (pitch: string): number | null => {
  const m = PITCH_PATTERN.exec(pitch.trim());
  if (!m) return null;
  const letter = m[1]!.toUpperCase();
  const acc = ACCIDENTAL[m[2] ?? ""] ?? 0;
  const octave = Number(m[3]);
  return (octave + 1) * 12 + LETTER_SEMITONES[letter]! + acc;
};

/** Normalize user input like "f#4" or "bb3" to "F#4" / "Bb3" */
export const normalizePitch = (pitch: string): string | null => {
  const m = PITCH_PATTERN.exec(pitch.trim());
  if (!m) return null;
  return `${m[1]!.toUpperCase()}${m[2] ?? ""}${m[3]}`;
};

/** Shift a pitch by semitones, keeping its spelling when shifting by octaves */
export const transpose = (pitch: string, semitones: number): string => {
  const m = PITCH_PATTERN.exec(pitch.trim());
  if (!m) return pitch;
  if (semitones % 12 === 0) {
    return `${m[1]!.toUpperCase()}${m[2] ?? ""}${Number(m[3]) + semitones / 12}`;
  }
  const midi = pitchToMidi(pitch)! + semitones;
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
};

const C2 = 36;
const C7 = 96;

/** Measure numbers whose beats do not add up to the time signature */
export const badMeasures = (
  m: Pick<Melody, "notes" | "timeSignature" | "pickupBeats">,
): Set<number> => {
  const expected = measureLength(m.timeSignature);
  const sums = new Map<number, number>();
  for (const n of m.notes) sums.set(n.measure, (sums.get(n.measure) ?? 0) + n.beats);
  const bad = new Set<number>();
  const measures = [...sums.keys()].sort((a, b) => a - b);
  const last = measures[measures.length - 1];
  for (const measure of measures) {
    const sum = sums.get(measure)!;
    if (Math.abs(sum - expected) < 1e-6) continue;
    if (measure === 1 && (m.pickupBeats ?? 0) > 0) continue;
    // A song that opens with a pickup usually ends on a short last measure
    if (measure === last && (m.pickupBeats ?? 0) > 0 && sum < expected) continue;
    bad.add(measure);
  }
  return bad;
};

/** Human-readable problems with a melody */
export const validateMelody = (
  m: Pick<Melody, "notes" | "timeSignature" | "pickupBeats">,
): string[] => {
  const warnings: string[] = [];
  if (m.notes.length === 0) {
    warnings.push("No notes were found.");
    return warnings;
  }
  const expected = measureLength(m.timeSignature);
  const sums = new Map<number, number>();
  for (const n of m.notes) sums.set(n.measure, (sums.get(n.measure) ?? 0) + n.beats);
  for (const measure of badMeasures(m)) {
    warnings.push(
      `Measure ${measure} has ${formatBeats(sums.get(measure) ?? 0)} beats; expected ${formatBeats(expected)}.`,
    );
  }
  m.notes.forEach((n, i) => {
    if (n.pitch === null) return;
    const midi = pitchToMidi(n.pitch);
    if (midi === null) {
      warnings.push(`Note ${i + 1} (measure ${n.measure}) has an unreadable pitch "${n.pitch}".`);
    } else if (midi < C2 || midi > C7) {
      warnings.push(`Note ${i + 1} (measure ${n.measure}) pitch ${n.pitch} is outside C2–C7.`);
    }
  });
  return warnings;
};

export const formatBeats = (b: number): string =>
  Number.isInteger(b) ? String(b) : String(Math.round(b * 1000) / 1000);

export const DURATION_OPTIONS: { beats: number; label: string }[] = [
  { beats: 4, label: "whole" },
  { beats: 3, label: "dotted half" },
  { beats: 2, label: "half" },
  { beats: 1.5, label: "dotted quarter" },
  { beats: 1, label: "quarter" },
  { beats: 0.75, label: "dotted eighth" },
  { beats: 0.5, label: "eighth" },
  { beats: 0.25, label: "sixteenth" },
];

export const durationLabel = (beats: number): string =>
  DURATION_OPTIONS.find((d) => Math.abs(d.beats - beats) < 1e-6)?.label ??
  `${formatBeats(beats)} beats`;

const importFileSchema = melodyDraftSchema
  .extend({
    sourceFileName: z.string().max(300).optional(),
    extractionModel: z.string().max(100).optional(),
    warnings: z.array(z.string()).optional(),
  })
  .passthrough();

/** Parse a hand-written melody JSON file into a draft plus its warnings */
export const parseMelodyJson = (
  text: string,
  fileName: string,
): { draft: MelodyDraft; warnings: string[] } => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const parsed = importFileSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `That JSON is not a melody: ${issue?.path.join(".") ?? ""} ${issue?.message ?? ""}`.trim(),
    );
  }
  const d = parsed.data;
  const draft: MelodyDraft = {
    title: d.title,
    tempoBpm: d.tempoBpm,
    timeSignature: d.timeSignature,
    ...(d.keySignature ? { keySignature: d.keySignature } : {}),
    pickupBeats: d.pickupBeats ?? 0,
    notes: d.notes.map((n) => ({
      ...n,
      pitch: n.pitch === null ? null : (normalizePitch(n.pitch) ?? n.pitch),
    })),
    ...(d.link ? { link: d.link } : {}),
    sourceFileName: d.sourceFileName ?? fileName,
    extractionModel: d.extractionModel ?? "json import",
  };
  return { draft, warnings: d.warnings ?? [] };
};
