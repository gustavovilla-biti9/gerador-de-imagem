import { NextResponse } from "next/server";

// Only ever proxy images coming from our own Blob store or from Replicate's
// output CDN — this endpoint must not become an open URL-fetching proxy.
const ALLOWED_HOST_SUFFIXES = [
  ".public.blob.vercel-storage.com",
  ".replicate.delivery",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const isAllowedHost = ALLOWED_HOST_SUFFIXES.some((suffix) =>
    parsed.hostname.endsWith(suffix),
  );
  if (parsed.protocol !== "https:" || !isAllowedHost) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  const upstream = await fetch(parsed);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "image/png";
  const extension = contentType.split("/")[1]?.split(";")[0] ?? "png";

  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="gerador-de-imagem.${extension}"`,
    },
  });
}
