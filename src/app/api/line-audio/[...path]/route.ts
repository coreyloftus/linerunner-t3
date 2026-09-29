import { get } from "@vercel/blob";
import { getServerAuthSession } from "~/server/auth";

const PATH_PATTERN = /^[a-z0-9-]+\/[a-z0-9]+\.(mp3|json)$/;

// Streams a private Blob clip to signed-in users, with Range support for Safari
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await getServerAuthSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const path = (await params).path.join("/");
  if (!PATH_PATTERN.test(path)) return new Response("Not found", { status: 404 });

  const result = await get(`voiceClips/${path}`, { access: "private" });
  if (result?.statusCode !== 200) return new Response("Not found", { status: 404 });

  const body = new Uint8Array(await new Response(result.stream).arrayBuffer());
  const headers = {
    "Content-Type": result.blob.contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
    if (start > end) return new Response(null, { status: 416 });
    return new Response(body.slice(start, end + 1), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${body.length}` },
    });
  }
  return new Response(body, { headers });
}
