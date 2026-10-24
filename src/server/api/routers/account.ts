import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { FirestoreService } from "~/server/firebase";

export const accountRouter = createTRPCRouter({
  // Deletes the signed-in user's data; the session email is the only input that counts
  delete: protectedProcedure
    .input(z.object({ confirm: z.literal("DELETE") }))
    .mutation(async ({ ctx }) => {
      const email = ctx.session.user.email;
      if (!email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No email on this account." });
      }
      const result = await FirestoreService.deleteUserData(email);
      console.log(
        `🗑️ [account.delete] Deleted user data (${result.sharesDeleted} shares deleted, left ${result.sharesLeft})`,
      );
      return { success: true, ...result };
    }),
});
