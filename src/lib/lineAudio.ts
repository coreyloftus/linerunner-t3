export const projectSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const normalize = (text: string) => text.trim().replace(/\s+/g, " ");

// Must match the key built by scripts/generate-line-audio.mjs
export const lineAudioKey = async (character: string, text: string) => {
  const bytes = new TextEncoder().encode(`${character}::${normalize(text)}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export interface AudioManifest {
  base: string;
  clips: Record<string, string>;
}

const manifests = new Map<string, Promise<AudioManifest>>();

const fetchClips = (url: string) =>
  fetch(url, { cache: "no-store" })
    .then((res) => (res.ok ? (res.json() as Promise<Record<string, string>>) : {}))
    .catch(() => ({}));

// Local files win in dev; otherwise fall back to the signed-in API route in prod
export const loadAudioManifest = (slug: string) => {
  let manifest = manifests.get(slug);
  if (!manifest) {
    const sources = [`/sceneData/audio/${slug}`, `/api/line-audio/${slug}`];
    manifest = (async () => {
      for (const base of sources) {
        const clips = await fetchClips(`${base}/manifest.json`);
        if (Object.keys(clips).length > 0) return { base, clips };
      }
      return { base: "", clips: {} };
    })().then((result) => {
      // Don't keep an empty result, so clips generated later are picked up
      if (!result.base) manifests.delete(slug);
      return result;
    });
    manifests.set(slug, manifest);
  }
  return manifest;
};
