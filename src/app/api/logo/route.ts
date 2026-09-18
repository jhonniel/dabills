import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
const memoryCache = new Map<
  string,
  { body: ArrayBuffer; contentType: string; expires: number }
>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function sourcesFor(domain: string) {
  return [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`,
  ];
}

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim().toLowerCase();

  if (!domain || !DOMAIN_RE.test(domain) || domain.includes("..")) {
    return new NextResponse("Invalid domain", { status: 400 });
  }

  const cached = memoryCache.get(domain);
  if (cached && cached.expires > Date.now()) {
    return new NextResponse(cached.body, {
      status: 200,
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Logo-Cache": "HIT",
      },
    });
  }

  for (const src of sourcesFor(domain)) {
    try {
      const upstream = await fetch(src, {
        headers: { Accept: "image/*" },
        next: { revalidate: 60 * 60 * 24 * 7 },
      });
      if (!upstream.ok) continue;

      const contentType = upstream.headers.get("content-type") ?? "image/png";
      if (!contentType.startsWith("image/")) continue;

      const buffer = await upstream.arrayBuffer();
      if (buffer.byteLength < 32) continue;

      memoryCache.set(domain, {
        body: buffer,
        contentType,
        expires: Date.now() + CACHE_TTL_MS,
      });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=604800, immutable",
          "X-Logo-Cache": "MISS",
        },
      });
    } catch {
      // try next source
    }
  }

  return new NextResponse("Logo not found", { status: 404 });
}
