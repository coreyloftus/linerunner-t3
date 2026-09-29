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

const manifests = new Map<string, Promise<Record<string, string>>>();

export const loadAudioManifest = (slug: string) => {
  let manifest = manifests.get(slug);
  if (!manifest) {
    manifest = fetch(`/sceneData/audio/${slug}/manifest.json`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? (res.json() as Promise<Record<string, string>>) : {}))
      .catch(() => ({}))
      .then((data) => {
        // Don't keep an empty result, so clips generated later are picked up
        if (Object.keys(data).length === 0) manifests.delete(slug);
        return data;
      });
    manifests.set(slug, manifest);
  }
  return manifest;
};
