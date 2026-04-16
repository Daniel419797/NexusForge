type BuildCspOptions = {
  nonce: string;
  isDev?: boolean;
};

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function getConnectSrcOrigins(): string[] {
  return uniqueValues([
    "'self'",
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001",
    process.env.NEXT_PUBLIC_API_URL || "",
    process.env.NEXT_PUBLIC_BACKEND_URL || "",
    process.env.NEXT_PUBLIC_REUSE_TEST_API_URL || "",
    "wss:",
    "ws:",
  ]);
}

export function buildCspHeader({ nonce, isDev = process.env.NODE_ENV === "development" }: BuildCspOptions): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes are still used in the current UI, so styles remain compatibility-permissive for now.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${getConnectSrcOrigins().join(" ")}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
