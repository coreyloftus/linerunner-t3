import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env";
import { adminDb } from "~/lib/firebase-admin";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { extractMelody } from "~/server/melodyExtraction";
import {
  melodyDraftSchema,
  melodyNoteSchema,
  type Melody,
  type MelodyDraft,
  type MelodySummary,
} from "~/lib/melody";

const MELODIES = "melodies";
const MAX_PDF_BYTES = 3 * 1024 * 1024;

const melodiesRef = (userId: string) =>
  adminDb.collection("users").doc(userId).collection(MELODIES);

const saveInputSchema = melodyDraftSchema.extend({
  id: z.string().optional(),
  notes: z.array(melodyNoteSchema).min(1).max(2000),
});

export const melodyRouter = createTRPCRouter({
  /** Whether PDF import is available on this server */
  status: protectedProcedure.query(() => ({
    importEnabled: !!env.ANTHROPIC_API_KEY,
  })),

  extractFromPdf: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(300),
        pdfBase64: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const bytes = Buffer.from(input.pdfBase64, "base64");
      if (bytes.length > MAX_PDF_BYTES) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: "PDF is over 3 MB.",
        });
      }
      if (bytes.subarray(0, 4).toString("latin1") !== "%PDF") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That file is not a PDF.",
        });
      }
      return extractMelody(input.pdfBase64, input.fileName);
    }),

  list: protectedProcedure.query(async ({ ctx }): Promise<MelodySummary[]> => {
    const snap = await melodiesRef(ctx.session.user.email!).get();
    return snap.docs
      .map((doc) => {
        const m = doc.data() as Omit<Melody, "id">;
        return {
          id: doc.id,
          title: m.title,
          ...(m.link ? { link: m.link } : {}),
          updatedAt: m.updatedAt,
          noteCount: m.notes?.length ?? 0,
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }): Promise<Melody> => {
      const doc = await melodiesRef(ctx.session.user.email!).doc(input.id).get();
      if (!doc.exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Melody not found" });
      }
      return { id: doc.id, ...(doc.data() as Omit<Melody, "id">) };
    }),

  save: protectedProcedure
    .input(saveInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const now = new Date().toISOString();
      const ref = melodiesRef(ctx.session.user.email!);
      // Firestore rejects undefined values
      const data = JSON.parse(JSON.stringify(rest)) as MelodyDraft;
      if (id) {
        const existing = await ref.doc(id).get();
        if (!existing.exists) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Melody not found" });
        }
        const createdAt = (existing.data() as Melody).createdAt ?? now;
        await ref.doc(id).set({ ...data, createdAt, updatedAt: now });
        return { id };
      }
      const doc = await ref.add({ ...data, createdAt: now, updatedAt: now });
      return { id: doc.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await melodiesRef(ctx.session.user.email!).doc(input.id).delete();
      return { id: input.id };
    }),
});
