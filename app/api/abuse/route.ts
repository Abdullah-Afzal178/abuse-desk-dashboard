import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";

const ENDPOINT = "https://api.ipgeolocation.io/v3/abuse";

export async function GET(request: NextRequest) {
  const ip = request.nextUrl.searchParams.get("ip")?.trim() ?? "";

  if (!isIP(ip)) {
    return NextResponse.json({ error: "Enter a valid public IPv4 or IPv6 address." }, { status: 400 });
  }

  const apiKey = process.env.IPGEOLOCATION_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "The server is missing its IPGeolocation API key." }, { status: 500 });
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("ip", ip);

  try {
    const upstream = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const data: unknown = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const message = data && typeof data === "object" && "message" in data
        ? String(data.message)
        : upstream.status === 423
          ? "Private and reserved IP addresses cannot be looked up."
          : "The abuse contact lookup could not be completed.";
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch {
    return NextResponse.json({ error: "The lookup service did not respond. Please try again." }, { status: 502 });
  }
}
