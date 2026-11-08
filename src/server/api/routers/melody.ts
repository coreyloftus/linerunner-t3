import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { env } from "~/env";
import { adminDb } from "~/lib/firebase-admin";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { extractMelody } from "~/server/melodyExtraction";
import { pdfImportInputSchema, reserveImport, validatePdf } from "~/server/pdfImport";
import {
  melodyDraftSchema,
  melodyNoteSchema,
  type Melody,
  type MelodyDraft,
  type MelodySummary,
} from "~/lib/melody";

const MELODIES = "melodies";
const MAX_MELODIES = 50;
const melodyIdSchema = z.string().min(1).max(1500).regex(/^[^/]+$/, "Invalid melody ID.");

const melodiesRef = (userId: string) =>
  adminDb.collection("users").doc(userId).collection(MELODIES);

const saveInputSchema = melodyDraftSchema.extend({
  id: melodyIdSchema.optional(),
  notes: z.array(melodyNoteSchema).min(1).max(2000),
});

export const melodyRouter = createTRPCRouter({
  /** Whether PDF import is available on this server */
  status: protectedProcedure.query(() => ({
    importEnabled: !!env.ANTHROPIC_API_KEY,
  })),

  extractFromPdf: protectedProcedure
    .input(pdfImportInputSchema)
    .mutation(async ({ ctx, input }) => {
      validatePdf(input.pdfBase64);
      await reserveImport(ctx.session.user.email!);
      return extractMelody(input.pdfBase64, input.fileName);
    }),

  list: protectedProcedure.query(async ({ ctx }): Promise<MelodySummary[]> => {
    const snap = await melodiesRef(ctx.session.user.email!)
      .select("title", "link", "updatedAt", "noteCount")
      .get();
    return snap.docs
      .map((doc) => {
        const m = doc.data() as Omit<MelodySummary, "id">;
        return {
          id: doc.id,
          title: m.title,
          ...(m.link ? { link: m.link } : {}),
          updatedAt: m.updatedAt,
          ...(m.noteCount !== undefined ? { noteCount: m.noteCount } : {}),
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }),

  get: protectedProcedure
    .input(z.object({ id: melodyIdSchema }))
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
        await adminDb.runTransaction(async (tx) => {
          const existing = await tx.get(ref.doc(id));
          if (!existing.exists) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Melody not found" });
          }
          const createdAt = (existing.data() as Melody).createdAt ?? now;
          tx.set(ref.doc(id), { ...data, noteCount: data.notes.length, createdAt, updatedAt: now });
        });
        return { id };
      }
      const doc = ref.doc();
      const userDoc = adminDb.collection("users").doc(ctx.session.user.email!);
      await adminDb.runTransaction(async (tx) => {
        await tx.get(userDoc);
        const melodies = await tx.get(ref.select().limit(MAX_MELODIES));
        if (melodies.size >= MAX_MELODIES) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You can have up to ${MAX_MELODIES} melodies. Delete one to add another.`,
          });
        }
        // Writing the same user document serializes concurrent melody creation.
        tx.set(userDoc, { melodiesUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
        tx.create(doc, { ...data, noteCount: data.notes.length, createdAt: now, updatedAt: now });
      });
      return { id: doc.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: melodyIdSchema }))
    .mutation(async ({ ctx, input }) => {
      await melodiesRef(ctx.session.user.email!).doc(input.id).delete();
      return { id: input.id };
    }),
});
