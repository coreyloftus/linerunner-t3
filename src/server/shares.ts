import { randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "~/lib/firebase-admin";
import type { RawProject } from "./scriptService";

// A user share points at the owner's doc, so recipients always read the current content
export interface ShareDoc {
  ownerId: string;
  ownerName?: string;
  sourceDocId?: string;
  project: string;
  allowedUsers: string[];
  shareToken?: string | null;
}

const shares = () => adminDb.collection("shared_projects");
const ownerShows = (email: string) =>
  adminDb.collection("users").doc(email).collection("uploaded_data");

export const newShareToken = () => randomBytes(16).toString("base64url");

// Finds the owner's own show by name, scoped to the signed-in email
export async function findOwnShow(email: string, projectName: string) {
  const snap = await ownerShows(email).get();
  const doc = snap.docs.find(
    (d) => (d.data() as RawProject).project === projectName,
  );
  return doc ? { id: doc.id, data: doc.data() as RawProject } : null;
}

export async function findShareForSource(email: string, sourceDocId: string) {
  const snap = await shares().where("sourceDocId", "==", sourceDocId).get();
  const doc = snap.docs.find((d) => (d.data() as ShareDoc).ownerId === email);
  return doc ? { id: doc.id, data: doc.data() as ShareDoc } : null;
}

export async function findShareByToken(token: string) {
  const snap = await shares().where("shareToken", "==", token).limit(1).get();
  const doc = snap.docs[0];
  return doc ? { id: doc.id, data: doc.data() as ShareDoc } : null;
}

export async function createShare(
  email: string,
  ownerName: string,
  sourceDocId: string,
  project: string,
) {
  const ref = await shares().add({
    ownerId: email,
    ownerName,
    sourceDocId,
    project,
    allowedUsers: [],
    shareToken: newShareToken(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateShare(id: string, data: Record<string, unknown>) {
  await shares()
    .doc(id)
    .update({ ...data, updatedAt: FieldValue.serverTimestamp() });
}

// Live content for a share: the owner's doc for user shares, the stored copy for old admin shares
export async function resolveShareContent(
  share: ShareDoc & RawProject,
): Promise<RawProject | null> {
  if (!share.sourceDocId) return share;
  const snap = await ownerShows(share.ownerId).doc(share.sourceDocId).get();
  return snap.exists ? (snap.data() as RawProject) : null;
}
