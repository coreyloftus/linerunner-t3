import { adminDb } from "~/lib/firebase-admin";
import { lastSpotSchema, type LastSpot } from "~/lib/last-spot";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const userRef = (userId: string) => adminDb.collection("users").doc(userId);

export const lastSpotRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }): Promise<LastSpot | null> => {
    const doc = await userRef(ctx.session.user.email!).get();
    const parsed = lastSpotSchema.safeParse(doc.data()?.lastSpot);
    return parsed.success ? parsed.data : null;
  }),

  save: protectedProcedure
    .input(lastSpotSchema)
    .mutation(async ({ ctx, input }) => {
      await userRef(ctx.session.user.email!).set(
        { lastSpot: input },
        { merge: true },
      );
    }),
});
