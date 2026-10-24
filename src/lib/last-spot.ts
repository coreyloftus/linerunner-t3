import { z } from "zod";

// Where a signed-in user last was, so the next visit opens there
export const lastSpotSchema = z.object({
  mode: z.enum(["runner", "viewer", "scripts", "melody"]),
  project: z.string().max(300).optional(),
  source: z.enum(["public", "shared", "user", "local"]).optional(),
  character: z.string().max(300).optional(),
  scene: z.string().max(300).optional(),
  line: z.number().int().min(0).optional(),
  melody: z.string().max(200).optional(),
});

export type LastSpot = z.infer<typeof lastSpotSchema>;
