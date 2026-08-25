import { createHash } from "node:crypto";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { adminDb } from "~/lib/firebase-admin";

/**
 * Scene-partner voice (TTS) — STUB, not live yet.
 *
 * The plan: generate audio for the *other* characters' lines with a TTS
 * provider, and cache every generated clip forever so each unique line is
 * paid for exactly once.
 *
 * Cache design:
 * - Key: sha256(voiceId + "::" + normalized line text). Script lines rarely
 *   change, so repeat practice sessions are 100% cache hits.
 * - Index: Firestore collection `voiceClips`, doc id = key, fields:
 *   { voiceId, text, storagePath, createdAt, byUser }
 * - Audio bytes: Firebase Storage at `voiceClips/{key}.mp3`, served via a
 *   long-lived download URL stored on the doc.
 *
 * To go live:
 * 1. Pick a provider (OpenAI `tts-1` or ElevenLabs; both ~ $0.015/1k chars —
 *    a full scene is pennies, and the cache makes reruns free).
 * 2. Add the API key to env.js + .env (e.g. OPENAI_API_KEY), and flip
 *    VOICE_GENERATION_ENABLED=true.
 * 3. Implement generateClip() below: call the provider, upload the bytes to
 *    Firebase Storage, write the `voiceClips` doc, return the URL.
 * 4. Client: a usePartnerVoice hook that prefetches the next few other-
 *    character lines when a scene starts, and plays each clip as its line
 *    is revealed. Wire the "Scene Partner Voice" sidebar toggle to it.
 */

const VOICE_CLIPS_COLLECTION = "voiceClips";
const DEFAULT_VOICE_ID = "default";

const generationEnabled = () =>
  process.env.VOICE_GENERATION_ENABLED === "true";

/** Deterministic cache key: one clip per unique (voice, line) pair */
export const clipKey = (voiceId: string, text: string): string =>
  createHash("sha256")
    .update(`${voiceId}::${text.trim().toLowerCase()}`)
    .digest("hex");

export const voiceRouter = createTRPCRouter({
  /**
   * Look up (or eventually generate) the audio clip for one line.
   * While generation is disabled this only ever reports cache status,
   * so it is safe to call from the client today.
   */
  getLineAudio: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(2000),
        voiceId: z.string().default(DEFAULT_VOICE_ID),
      }),
    )
    .query(async ({ input }) => {
      const key = clipKey(input.voiceId, input.text);

      const doc = await adminDb
        .collection(VOICE_CLIPS_COLLECTION)
        .doc(key)
        .get();

      if (doc.exists) {
        const data = doc.data() as { url?: string };
        if (data.url) {
          return { status: "cached" as const, key, url: data.url };
        }
      }

      if (!generationEnabled()) {
        // TODO(voice): call generateClip(input) here once a TTS provider is
        // wired up and VOICE_GENERATION_ENABLED is set.
        return { status: "unavailable" as const, key, url: null };
      }

      return { status: "pending" as const, key, url: null };
    }),
});
