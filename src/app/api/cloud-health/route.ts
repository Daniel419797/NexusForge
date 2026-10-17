import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://20-94-244-232.nip.io/healthz", {
      cache: "no-store",
      signal: controller.signal,
    });
    const body = await response.text();
    return NextResponse.json({
      reachable: response.ok,
      status: response.status,
      body,
    }, { status: response.ok ? 200 : 502 });
  } catch (error) {
    return NextResponse.json({
      reachable: false,
      error: error instanceof Error ? error.message : "unknown error",
    }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
