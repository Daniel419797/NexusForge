const MFA_STEP_UP_KEY = "nexus-forge:mfa-step-up";
const EXPIRY_SKEW_MS = 5_000;

interface StoredMfaStepUp {
  token: string;
  expiresAt: number;
}

export function getStoredMfaStepUpToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(MFA_STEP_UP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredMfaStepUp>;
    if (
      typeof parsed.token !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now() + EXPIRY_SKEW_MS
    ) {
      clearStoredMfaStepUpToken();
      return null;
    }
    return parsed.token;
  } catch {
    clearStoredMfaStepUpToken();
    return null;
  }
}

export function storeMfaStepUpToken(token: string, expiresInSeconds: number): void {
  if (typeof window === "undefined") return;
  const payload: StoredMfaStepUp = {
    token,
    expiresAt: Date.now() + expiresInSeconds * 1_000,
  };
  window.sessionStorage.setItem(MFA_STEP_UP_KEY, JSON.stringify(payload));
}

export function clearStoredMfaStepUpToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(MFA_STEP_UP_KEY);
}
