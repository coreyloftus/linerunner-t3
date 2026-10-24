import { z } from "zod";
import { SCRIPT_LIMITS } from "./script-limits";

export const PDF_IMPORTS_PER_MONTH = 10;
export const MAX_SCRIPT_PDF_BYTES = 3 * 1024 * 1024;

export interface ImportedLine {
  characters: string[];
  line: string;
  sung?: boolean;
}

export interface ImportedScene {
  title: string;
  lines: ImportedLine[];
}

export interface ImportedShow {
  project: string;
  scenes: ImportedScene[];
  characters: string[];
}

export interface ScriptImportResult {
  show: ImportedShow;
  warnings: string[];
  remaining: number;
}

// Structured output schema: every property required, no extras
export const SCRIPT_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "scenes", "warnings"],
  properties: {
    title: { type: "string", description: "Show title as printed" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "lines"],
        properties: {
          title: {
            type: "string",
            description: 'Scene heading, e.g. "Act 1, Scene 2" or a song title',
          },
          lines: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["characters", "line", "sung"],
              properties: {
                characters: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    'Speaker names as printed, e.g. ["ALICE"]; several when they speak or sing together',
                },
                line: {
                  type: "string",
                  description: "The words spoken or sung, without the speaker name",
                },
                sung: {
                  type: "boolean",
                  description: "True for lyrics, false for spoken dialogue",
                },
              },
            },
          },
        },
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Anything unreadable, skipped, or uncertain",
    },
  },
} as const;

const rawOutputSchema = z.object({
  title: z.string(),
  scenes: z.array(
    z.object({
      title: z.string(),
      lines: z.array(
        z.object({
          characters: z.array(z.string()),
          line: z.string(),
          sung: z.boolean(),
        }),
      ),
    }),
  ),
  warnings: z.array(z.string()),
});

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);

/** Turn Claude's JSON text into a show that fits the script limits */
export function parseScriptResponse(
  text: string,
  fileName = "upload.pdf",
): { show: ImportedShow; warnings: string[] } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("The script reader returned something unreadable. Try again.");
  }
  const parsed = rawOutputSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("The script reader returned an unexpected shape. Try again.");
  }
  const out = parsed.data;
  const warnings = out.warnings.map(clean).filter(Boolean);
  const { maxLinesPerScene, maxLineChars, maxNameChars, maxCharactersPerLine } =
    SCRIPT_LIMITS;

  const scenes: ImportedScene[] = [];
  out.scenes.forEach((rawScene, sceneIndex) => {
    const title =
      clip(clean(rawScene.title), maxNameChars) || `Scene ${sceneIndex + 1}`;
    const lines: ImportedLine[] = [];
    for (const raw of rawScene.lines) {
      const line = clean(raw.line);
      if (!line) continue;
      if (line.length > maxLineChars) {
        warnings.push(`A line in "${title}" was cut to ${maxLineChars} characters.`);
      }
      const characters = [
        ...new Set(
          raw.characters.map((c) => clip(clean(c), maxNameChars)).filter(Boolean),
        ),
      ].slice(0, maxCharactersPerLine);
      lines.push({
        characters,
        line: clip(line, maxLineChars),
        ...(raw.sung ? { sung: true } : {}),
      });
    }
    if (lines.length === 0) return;

    // Split a scene that is too long into numbered parts
    const parts = Math.ceil(lines.length / maxLinesPerScene);
    for (let p = 0; p < parts; p++) {
      scenes.push({
        title: parts > 1 ? clip(`${title} (part ${p + 1})`, maxNameChars) : title,
        lines: lines.slice(p * maxLinesPerScene, (p + 1) * maxLinesPerScene),
      });
    }
    if (parts > 1) {
      warnings.push(`"${title}" was long, so it was split into ${parts} scenes.`);
    }
  });

  if (scenes.length === 0) {
    throw new Error("Could not find any lines in this PDF.");
  }
  if (scenes.length > SCRIPT_LIMITS.maxScenesPerShow) {
    throw new Error(
      `This script has ${scenes.length} scenes; the limit is ${SCRIPT_LIMITS.maxScenesPerShow}. Try a shorter PDF.`,
    );
  }

  const characters = [
    ...new Set(scenes.flatMap((s) => s.lines.flatMap((l) => l.characters))),
  ];

  return {
    show: {
      project:
        clip(clean(out.title), maxNameChars) ||
        fileName.replace(/\.pdf$/i, "") ||
        "Imported script",
      scenes,
      characters,
    },
    warnings,
  };
}

/** Calendar month key in UTC, e.g. "2026-10" */
export const importMonth = (date = new Date()) => date.toISOString().slice(0, 7);
