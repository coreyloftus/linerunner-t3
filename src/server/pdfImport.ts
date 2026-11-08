import { TRPCError } from "@trpc/server";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { env } from "~/env";
import { adminDb } from "~/lib/firebase-admin";
import {
  MAX_SCRIPT_PDF_BYTES,
  PDF_IMPORTS_PER_MONTH,
  importMonth,
} from "~/lib/script-import";

export const pdfImportInputSchema = z.object({
  fileName: z.string().min(1).max(300),
  pdfBase64: z
    .string()
    .min(1)
    .max(Math.ceil(MAX_SCRIPT_PDF_BYTES / 3) * 4, "PDF is over 3 MB."),
});

export function validatePdf(pdfBase64: string): void {
  if (
    pdfBase64.length % 4 !== 0 ||
    /[^A-Za-z0-9+/=]/.test(pdfBase64)
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid PDF encoding." });
  }
  const bytes = Buffer.from(pdfBase64, "base64");
  if (bytes.toString("base64") !== pdfBase64) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid PDF encoding." });
  }
  if (bytes.length > MAX_SCRIPT_PDF_BYTES) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "PDF is over 3 MB." });
  }
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "That file is not a PDF." });
  }
}

const usageRef = (userId: string) => {
  if (!env.NEXTAUTH_SECRET) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "PDF import is not set up yet.",
    });
  }
  const key = createHmac("sha256", env.NEXTAUTH_SECRET)
    .update(userId.trim().toLowerCase())
    .digest("hex");
  return adminDb.collection("pdfImportUsage").doc(key);
};

const readUsed = (data: FirebaseFirestore.DocumentData | undefined, month: string) => {
  const usage = data as { month?: string; count?: number } | undefined;
  return usage?.month === month ? (usage.count ?? 0) : 0;
};

export async function importsUsed(userId: string): Promise<number> {
  const month = importMonth();
  const usage = await usageRef(userId).get();
  if (usage.exists) return readUsed(usage.data(), month);
  const legacy = await adminDb.collection("users").doc(userId).get();
  return readUsed(legacy.data()?.pdfImports as FirebaseFirestore.DocumentData | undefined, month);
}

// Submitted attempts count even when the provider response cannot be used.
export async function reserveImport(userId: string): Promise<number> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "PDF import is not set up yet.",
    });
  }
  const month = importMonth();
  const expiresAt = new Date(`${month}-01T00:00:00.000Z`);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1);
  return adminDb.runTransaction(async (tx) => {
    const ref = usageRef(userId);
    const usage = await tx.get(ref);
    const legacy = usage.exists
      ? undefined
      : (await tx.get(adminDb.collection("users").doc(userId))).data();
    const used = readUsed(
      usage.exists ? usage.data() : legacy?.pdfImports as FirebaseFirestore.DocumentData | undefined,
      month,
    );
    if (used >= PDF_IMPORTS_PER_MONTH) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `You've used all ${PDF_IMPORTS_PER_MONTH} PDF import attempts this month. They reset on the 1st.`,
      });
    }
    tx.set(ref, { month, count: used + 1, expiresAt });
    return PDF_IMPORTS_PER_MONTH - used - 1;
  });
}
