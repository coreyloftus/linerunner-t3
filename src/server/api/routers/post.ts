import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Return mock data since we're not using a database
      return {
        id: "mock-id",
        name: input.name,
        createdBy: { id: ctx.session.user.id },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),

  getLatest: protectedProcedure.query(({ ctx }) => {
    // Return mock data since we're not using a database
    return {
      id: "mock-latest-id",
      name: "Mock Post",
      createdBy: { id: ctx.session.user.id },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
