import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCspHeader, getConnectSrcOrigins } from "./csp";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getConnectSrcOrigins", () => {
  it("includes localhost fallback and websocket origins by default", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "");
    vi.stubEnv("NEXT_PUBLIC_REUSE_TEST_API_URL", "");

    const values = getConnectSrcOrigins();

    expect(values).toContain("'self'");
    expect(values).toContain("http://localhost:3001");
    expect(values).toContain("wss:");
    expect(values).toContain("ws:");
  });

  it("deduplicates configured origins", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://api.example.com");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "https://api.example.com");

    const values = getConnectSrcOrigins();

    expect(values.filter((value) => value === "https://api.example.com")).toHaveLength(1);
  });
});

describe("buildCspHeader", () => {
  it("uses a nonce-based script policy in production", () => {
    const csp = buildCspHeader({ nonce: "abc123", isDev: false });

    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("keeps unsafe-eval only in development", () => {
    const csp = buildCspHeader({ nonce: "devnonce", isDev: true });

    expect(csp).toContain("script-src 'self' 'nonce-devnonce' 'strict-dynamic' 'unsafe-eval'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("keeps style-src compatibility allowance while scripts are hardened", () => {
    const csp = buildCspHeader({ nonce: "abc123", isDev: false });

    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });
});
