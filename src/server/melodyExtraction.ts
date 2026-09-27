import Anthropic from "@anthropic-ai/sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env";
import {
  melodyDraftSchema,
  normalizePitch,
  validateMelody,
  type MelodyDraft,
} from "~/lib/melody";

const DEFAULT_MODEL = "claude-opus-5-5";

export const extractionModel = () =>
  env.MELODY_EXTRACTION_MODEL ?? DEFAULT_MODEL;

// Strict tool schema: every property required, optional values are nullable
const RECORD_MELODY_TOOL: Anthropic.Tool = {
  name: "record_melody",
  description:
    "Record the melody read from the sheet music: header data plus every note and rest in page order.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "tempoBpm",
      "timeSignature",
      "keySignature",
      "pickupBeats",
      "notes",
      "warnings",
    ],
    properties: {
      title: { type: "string", description: "Song title as printed" },
      tempoBpm: {
        type: "number",
        description: "Quarter notes per minute",
      },
      timeSignature: {
        type: "array",
        items: { type: "integer" },
        description: "[beats per measure, beat unit], e.g. [4, 4] or [6, 8]",
      },
      keySignature: {
        type: ["string", "null"],
        description: 'e.g. "C major", "Eb major", "D minor"',
      },
      pickupBeats: {
        type: "number",
        description:
          "Length of the pickup (anacrusis) in quarter-note beats; 0 when none",
      },
      notes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["pitch", "beats", "lyric", "tieToNext", "measure"],
          properties: {
            pitch: {
              type: ["string", "null"],
              description:
                'Sounding pitch in scientific notation ("C4", "F#4", "Bb3"); null for a rest',
            },
            beats: {
              type: "number",
              description:
                "Duration in quarter-note beats: 4 whole, 2 half, 1 quarter, 0.5 eighth, 1.5 dotted quarter",
            },
            lyric: {
              type: ["string", "null"],
              description:
                'Syllable under this note, hyphen kept for split words ("Twin-"); null for rests and melisma continuation notes',
            },
            tieToNext: {
              type: "boolean",
              description: "True when this note is tied into the next note",
            },
            measure: {
              type: "integer",
              description:
                "1-based measure number; a pickup measure is measure 1",
            },
          },
        },
      },
      warnings: {
        type: "array",
        items: { type: "string" },
        description:
          "Anything uncertain or unsupported: chords, a second staff, repeats, unreadable measures",
      },
    },
  },
};

const EXTRACTION_PROMPT = `This PDF is sheet music for a song's vocal line. Read the melody and record it by calling the record_melody tool exactly once. Do not reply with text.

How to read it:
- Read only the single vocal staff (the staff with lyrics under it). If there is a piano reduction or other staves, ignore them and add a warning.
- Read every note and rest left to right, system by system from top to bottom, in page order across all pages. Do not unroll repeats; if you see repeat signs, D.S., or coda marks, add a warning.
- Give each pitch in scientific notation (middle C = C4). Apply the clef, the key signature, and any accidentals, which carry through the rest of their measure.
- If the part is in treble clef with an 8 below it, or is marked for a male voice (tenor, baritone, bass) in treble clef, report the sounding pitch (one octave lower than written).
- Give duration in quarter-note beats, including dots (dotted half = 3, dotted quarter = 1.5, dotted eighth = 0.75).
- Attach each lyric syllable to the note it sits under. Keep the hyphen on the first part of a split word ("Twin-", "kle"). Leave notes that continue a melisma without a lyric (null). Rests have no lyric. If there are multiple verses, use only the first.
- Mark ties with tieToNext on the first note of the tie.
- Number measures from 1. If the song opens with a pickup, that partial measure is measure 1 and pickupBeats is its length.
- Tempo: use the metronome mark if present. Otherwise map the Italian term to a typical BPM (Largo 50, Adagio 70, Andante 90, Moderato 110, Allegro 130, Presto 170). Otherwise 100.
- If a measure has more than one note sounding at once (a chord), record only the top note and add a warning.
- Put anything uncertain, unreadable, or unsupported in warnings, each as one short sentence naming the measure.`;

const toolOutputSchema = z.object({
  title: z.string(),
  tempoBpm: z.number(),
  timeSignature: z.array(z.number().int()).length(2),
  keySignature: z.string().nullable(),
  pickupBeats: z.number(),
  notes: z.array(
    z.object({
      pitch: z.string().nullable(),
      beats: z.number(),
      lyric: z.string().nullable(),
      tieToNext: z.boolean(),
      measure: z.number().int(),
    }),
  ),
  warnings: z.array(z.string()),
});

export interface ExtractionResult {
  melody: MelodyDraft;
  warnings: string[];
}

/** Turn Claude API failures into messages a user can act on */
const toTRPCError = (err: unknown): TRPCError => {
  console.error("[melody] extraction failed:", err);
  if (
    err instanceof Anthropic.AuthenticationError ||
    err instanceof Anthropic.PermissionDeniedError
  ) {
    return new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Melody import is misconfigured: the API key was rejected.",
    });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many imports right now. Try again in a minute.",
    });
  }
  if (err instanceof Anthropic.BadRequestError) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "The music reader could not open this PDF.",
    });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "The music reader failed. Try again.",
  });
};

const getClient = () => {
  if (!env.ANTHROPIC_API_KEY) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Melody import is not configured",
    });
  }
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
};

/** Send a PDF to Claude and parse the melody it reads */
export async function extractMelody(
  pdfBase64: string,
  sourceFileName = "upload.pdf",
): Promise<ExtractionResult> {
  const client = getClient();
  const model = extractionModel();

  const response = await client.messages
    .create({
      model,
      max_tokens: 16000,
      output_config: { effort: "high" },
      tools: [RECORD_MELODY_TOOL],
      // Opus 5.5 rejects forced tool_choice; auto + strict + prompt does the same job
      tool_choice: { type: "auto" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
    })
    .catch((err: unknown) => {
      throw toTRPCError(err);
    });

  if (response.stop_reason === "refusal") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The model declined to read this file.",
    });
  }
  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === RECORD_MELODY_TOOL.name,
  );
  if (!toolUse) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Could not read any music from this PDF.",
    });
  }

  const parsed = toolOutputSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new TRPCError({ code: "BAD_REQUEST", message: parsed.error.message });
  }
  const out = parsed.data;

  const extraWarnings: string[] = [];
  const notes = out.notes.map((n, i) => {
    let pitch = n.pitch === null ? null : normalizePitch(n.pitch);
    if (n.pitch !== null && pitch === null) {
      extraWarnings.push(
        `Note ${i + 1} (measure ${n.measure}): unreadable pitch "${n.pitch}", set to a rest.`,
      );
      pitch = null;
    }
    return {
      pitch,
      beats: n.beats,
      ...(n.lyric ? { lyric: n.lyric } : {}),
      ...(n.tieToNext ? { tieToNext: true } : {}),
      measure: Math.max(1, n.measure),
    };
  });

  const draft = melodyDraftSchema.safeParse({
    title: out.title.trim() || sourceFileName.replace(/\.pdf$/i, ""),
    tempoBpm: Math.min(300, Math.max(20, Math.round(out.tempoBpm))),
    timeSignature: [out.timeSignature[0], out.timeSignature[1]],
    ...(out.keySignature ? { keySignature: out.keySignature } : {}),
    pickupBeats: Math.max(0, out.pickupBeats),
    notes,
    sourceFileName,
    extractionModel: model,
  });
  if (!draft.success) {
    throw new TRPCError({ code: "BAD_REQUEST", message: draft.error.message });
  }

  return {
    melody: draft.data as MelodyDraft,
    warnings: [
      ...out.warnings,
      ...extraWarnings,
      ...validateMelody(draft.data as MelodyDraft),
    ],
  };
}
