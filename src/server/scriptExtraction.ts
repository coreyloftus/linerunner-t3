import Anthropic from "@anthropic-ai/sdk";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";
import {
  SCRIPT_OUTPUT_SCHEMA,
  parseScriptResponse,
  type ImportedShow,
} from "~/lib/script-import";

const MODEL = "claude-opus-5-5";

const EXTRACTION_PROMPT = `This PDF is a script for a play or musical. Read it and return every line of dialogue and lyric as JSON in the given schema.

How to read it:
- Read the whole document in page order. Skip the cover, cast list, table of contents, page headers and footers, and page numbers.
- Start a new scene at each act or scene heading. Use the heading as the scene title (for example "Act 1, Scene 2"). In a musical, a song with its own heading or number can be its own scene; use its number and title (for example "#4 - My Psychopharmacologist and I").
- One entry per speech: the speaker and the words they say, without the speaker name. Join a speech that runs across a page break into one entry.
- Give speaker names as printed in the script, but in a consistent form for each character, and as a list. When several characters speak or sing together ("BOTH", "ALICE and BEN"), list each one if you can tell who they are; otherwise keep the printed name ("ENSEMBLE").
- Mark lyrics with sung: true and spoken dialogue with sung: false. Join the lines of one sung passage by one speaker into one entry, with " / " between lyric lines.
- Leave out stage directions, including ones in parentheses inside a speech.
- Put anything unreadable, skipped, or uncertain in warnings, each as one short sentence that names the page or scene.`;

/** Turn Claude API failures into messages a user can act on */
const toTRPCError = (err: unknown): TRPCError => {
  if (err instanceof TRPCError) return err;
  console.error("[script import] extraction failed:", err);
  if (
    err instanceof Anthropic.AuthenticationError ||
    err instanceof Anthropic.PermissionDeniedError
  ) {
    return new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "PDF import is misconfigured: the API key was rejected.",
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
      message: "The script reader could not open this PDF.",
    });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "The script reader failed. Try again.",
  });
};

export const scriptImportEnabled = () => !!env.ANTHROPIC_API_KEY;

/** Send a script PDF to Claude and parse the scenes and lines it reads */
export async function extractScript(
  pdfBase64: string,
  sourceFileName = "upload.pdf",
): Promise<{ show: ImportedShow; warnings: string[] }> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "PDF import is not set up yet.",
    });
  }
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  try {
    // Streaming: a whole script is long output and would time out a plain request
    const response = await client.beta.messages
      .stream({
        model: MODEL,
        max_tokens: 128000,
        output_config: {
          effort: "medium",
          format: { type: "json_schema", schema: SCRIPT_OUTPUT_SCHEMA },
        },
        // Retry a safety decline on Anthropic's recommended fallback model
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
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
      .finalMessage();

    if (response.stop_reason === "refusal") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "The script reader declined to read this file.",
      });
    }
    if (response.stop_reason === "max_tokens") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This script is too long to read in one go. Try a PDF of one act.",
      });
    }

    // A mid-stream fallback continues the partial text, so join every text block
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    try {
      return parseScriptResponse(text, sourceFileName);
    } catch (err) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: err instanceof Error ? err.message : "Could not read this PDF.",
      });
    }
  } catch (err) {
    throw toTRPCError(err);
  }
}
