// Bundled shows ("local") are a dev-only source
export const LOCAL_SOURCE_ENABLED = process.env.NODE_ENV !== "production";

// The one public-domain show signed-out visitors can try
export const DEMO_PROJECT = "The Importance of Being Earnest";

// Key for a show in the per-user "my character" map
export const showKey = (source: string, project: string) =>
  `${source}:${project}`;

// Builds the ?project=&source=&character=&scene= query the app reads on load
export function selectionQuery({
  project,
  source,
  character,
  scene,
}: {
  project: string;
  source: string;
  character?: string;
  scene?: string;
}) {
  const params = new URLSearchParams({ project, source });
  if (character) params.set("character", character);
  if (scene) params.set("scene", scene);
  return `?${params.toString()}`;
}
