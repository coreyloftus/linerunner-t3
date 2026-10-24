import { z } from "zod";

// Generous: a full musical is about 60 scenes of up to 400 lines
export const SCRIPT_LIMITS = {
  maxShowsPerUser: 50,
  maxScenesPerShow: 150,
  maxLinesPerScene: 1500,
  maxLineChars: 5000,
  maxCharactersPerLine: 20,
  maxNameChars: 200,
  // Firestore rejects documents over 1 MiB; leave room for field overhead
  maxShowBytes: 950_000,
} as const;

const fmt = (n: number) => n.toLocaleString("en-US");

export const nameSchema = (label: string) =>
  z
    .string()
    .max(
      SCRIPT_LIMITS.maxNameChars,
      `${label} can be at most ${fmt(SCRIPT_LIMITS.maxNameChars)} characters.`,
    );

export const lineInputSchema = z.object({
  characters: z
    .array(nameSchema("A character name"))
    .max(
      SCRIPT_LIMITS.maxCharactersPerLine,
      `A line can have at most ${SCRIPT_LIMITS.maxCharactersPerLine} characters speaking.`,
    ),
  line: z
    .string()
    .max(
      SCRIPT_LIMITS.maxLineChars,
      `A line can be at most ${fmt(SCRIPT_LIMITS.maxLineChars)} characters long.`,
    ),
  sung: z.boolean().optional(),
});

export const linesInputSchema = z
  .array(lineInputSchema)
  .max(
    SCRIPT_LIMITS.maxLinesPerScene,
    `A scene can have at most ${fmt(SCRIPT_LIMITS.maxLinesPerScene)} lines. Split it into two scenes.`,
  );

export const sceneInputSchema = z.object({
  title: nameSchema("A scene title"),
  lines: linesInputSchema,
});

export const scenesInputSchema = z
  .array(sceneInputSchema)
  .max(
    SCRIPT_LIMITS.maxScenesPerShow,
    `A show can have at most ${SCRIPT_LIMITS.maxScenesPerShow} scenes.`,
  );

export const showInputSchema = z.object({
  project: nameSchema("A show name"),
  scenes: scenesInputSchema,
  characters: z
    .array(nameSchema("A character name"))
    .max(2000, "A show can have at most 2,000 characters.")
    .optional(),
});

export const SHOW_LIMIT_MESSAGE = `You can have up to ${SCRIPT_LIMITS.maxShowsPerUser} shows. Delete one to add another.`;

/** Message for a saved show that breaks the whole-show limits, or null */
export const showSizeError = <T extends { scenes: unknown[] }>(
  show: T,
): string | null => {
  if (show.scenes.length > SCRIPT_LIMITS.maxScenesPerShow) {
    return `A show can have at most ${SCRIPT_LIMITS.maxScenesPerShow} scenes.`;
  }
  const bytes = new TextEncoder().encode(JSON.stringify(show)).length;
  if (bytes > SCRIPT_LIMITS.maxShowBytes) {
    return `This show is too big to save (${fmt(Math.ceil(bytes / 1000))} KB, limit ${fmt(SCRIPT_LIMITS.maxShowBytes / 1000)} KB). Split it into two shows.`;
  }
  return null;
};
