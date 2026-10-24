import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { FirestoreService } from "~/server/firebase";
import { ScriptService } from "~/server/scriptService";
import {
  createShare,
  findOwnShow,
  findShareByToken,
  findShareForSource,
  newShareToken,
  resolveShareContent,
  updateShare,
} from "~/server/shares";

const tokenInput = z.object({ token: z.string().min(16).max(64) });
const projectInput = z.object({ projectName: z.string().min(1) });

// Every owner route resolves the show from the session email, never from the request
const sessionEmail = (email: string | null | undefined) => {
  if (!email) throw new TRPCError({ code: "UNAUTHORIZED" });
  return email;
};

const requireOwnShow = async (email: string, projectName: string) => {
  const show = await findOwnShow(email, projectName);
  if (!show) throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
  return show;
};

const requireOwnShare = async (email: string, projectName: string) => {
  const show = await requireOwnShow(email, projectName);
  const share = await findShareForSource(email, show.id);
  if (!share) throw new TRPCError({ code: "NOT_FOUND", message: "Not shared" });
  return share;
};

const toView = (share: { id: string; data: { shareToken?: string | null; allowedUsers: string[] } }) => ({
  id: share.id,
  token: share.data.shareToken ?? null,
  members: share.data.allowedUsers ?? [],
});

export const shareRouter = createTRPCRouter({
  // The owner's share for one of their shows, or null
  getMine: protectedProcedure.input(projectInput).query(async ({ ctx, input }) => {
    const email = sessionEmail(ctx.session.user.email);
    const show = await requireOwnShow(email, input.projectName);
    const share = await findShareForSource(email, show.id);
    return share ? toView(share) : null;
  }),

  create: protectedProcedure.input(projectInput).mutation(async ({ ctx, input }) => {
    const email = sessionEmail(ctx.session.user.email);
    const show = await requireOwnShow(email, input.projectName);
    const existing = await findShareForSource(email, show.id);
    if (existing) {
      if (!existing.data.shareToken) {
        const shareToken = newShareToken();
        await updateShare(existing.id, { shareToken });
        existing.data.shareToken = shareToken;
      }
      return toView(existing);
    }
    const ownerName = ctx.session.user.name ?? email.split("@")[0] ?? "Someone";
    const id = await createShare(email, ownerName, show.id, input.projectName);
    const created = await findShareForSource(email, show.id);
    return created ? toView(created) : { id, token: null, members: [] };
  }),

  // A new link ends the old one
  newLink: protectedProcedure.input(projectInput).mutation(async ({ ctx, input }) => {
    const email = sessionEmail(ctx.session.user.email);
    const share = await requireOwnShare(email, input.projectName);
    const shareToken = newShareToken();
    await updateShare(share.id, { shareToken });
    return toView({ id: share.id, data: { ...share.data, shareToken } });
  }),

  turnOffLink: protectedProcedure.input(projectInput).mutation(async ({ ctx, input }) => {
    const email = sessionEmail(ctx.session.user.email);
    const share = await requireOwnShare(email, input.projectName);
    await updateShare(share.id, { shareToken: null });
    return toView({ id: share.id, data: { ...share.data, shareToken: null } });
  }),

  removeMember: protectedProcedure
    .input(projectInput.extend({ memberEmail: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const email = sessionEmail(ctx.session.user.email);
      const share = await requireOwnShare(email, input.projectName);
      await updateShare(share.id, {
        allowedUsers: FieldValue.arrayRemove(input.memberEmail),
      });
      const members = share.data.allowedUsers.filter((m) => m !== input.memberEmail);
      return toView({ id: share.id, data: { ...share.data, allowedUsers: members } });
    }),

  // What the join page shows; public so a signed-out visitor sees the show name
  byToken: publicProcedure.input(tokenInput).query(async ({ ctx, input }) => {
    const share = await findShareByToken(input.token);
    if (!share) return null;
    const content = await resolveShareContent(share.data);
    if (!content) return null;
    const project = ScriptService.normalizeProject(content);
    const email = ctx.session?.user?.email;
    return {
      project: project.project,
      ownerName: share.data.ownerName ?? "Someone",
      sceneCount: project.scenes.length,
      isOwner: !!email && email === share.data.ownerId,
      joined: !!email && share.data.allowedUsers.includes(email),
    };
  }),

  join: protectedProcedure.input(tokenInput).mutation(async ({ ctx, input }) => {
    const email = sessionEmail(ctx.session.user.email);
    const share = await findShareByToken(input.token);
    const content = share && (await resolveShareContent(share.data));
    if (!share || !content) {
      throw new TRPCError({ code: "NOT_FOUND", message: "This link is off" });
    }
    const project = ScriptService.normalizeProject(content);
    const isOwner = email === share.data.ownerId;
    if (!isOwner) {
      await updateShare(share.id, { allowedUsers: FieldValue.arrayUnion(email) });
    }
    return {
      project: project.project,
      source: isOwner ? "user" : "shared",
      scene: project.scenes[0]?.title ?? "",
    };
  }),

  // Copies a show shared with the caller into their own scripts
  copyToMine: protectedProcedure.input(projectInput).mutation(async ({ ctx, input }) => {
    const email = sessionEmail(ctx.session.user.email);
    const { allData } = await ScriptService.getScripts("shared", email);
    const source = allData.find((p) => p.project === input.projectName);
    if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });

    const own = await ScriptService.getScripts("firestore", email);
    let name = source.project;
    for (let n = 1; own.projects.includes(name); n++) {
      name = `${source.project} (copy${n > 1 ? ` ${n}` : ""})`;
    }
    await FirestoreService.addUserDocument(email, "uploaded_data", {
      project: name,
      scenes: source.scenes,
      characters: source.characters ?? [],
    });
    return { project: name };
  }),
});
