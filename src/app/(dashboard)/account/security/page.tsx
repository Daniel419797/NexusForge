"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";

import AuthService, { type MfaSetup } from "@/services/AuthService";
import { clearStoredMfaStepUpToken } from "@/lib/mfaStepUp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";

interface ApiErrorShape {
  response?: { data?: { message?: unknown } };
}

function errorMessage(error: unknown, fallback: string): string {
  const message = (error as ApiErrorShape | undefined)?.response?.data?.message;
  return typeof message === "string" ? message : fallback;
}

export default function AccountSecurityPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const status = await AuthService.getMfaStatus();
      setEnabled(status.enabled);
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not load MFA status."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  const beginSetup = async () => {
    setBusy(true);
    setError(null);
    try {
      setSetup(await AuthService.setupMfa());
      setCode("");
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not start MFA setup."));
    } finally {
      setBusy(false);
    }
  };

  const enableMfa = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await AuthService.enableMfa(code);
      clearStoredMfaStepUpToken();
      setEnabled(true);
      setSetup(null);
      setCode("");
      toast("Multi-factor authentication enabled.", "success");
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not enable MFA."));
    } finally {
      setBusy(false);
    }
  };

  const disableMfa = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter your current 6-digit authenticator code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await AuthService.disableMfa(code);
      clearStoredMfaStepUpToken();
      setEnabled(false);
      setCode("");
      toast("Multi-factor authentication disabled.", "success");
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not disable MFA."));
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!setup?.manualEntrySecret) return;
    await navigator.clipboard.writeText(setup.manualEntrySecret);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-cyan-200">
          <ShieldCheck className="size-5" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.12em]">Account security</span>
        </div>
        <h1 className="text-2xl font-bold">Multi-factor authentication</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Protect sensitive Nexus Forge actions with a time-based one-time password from an authenticator app.
        </p>
      </div>

      <section className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading security status…</p>
        ) : enabled ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                <Check className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold">Authenticator MFA is enabled</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sensitive actions require a recent 6-digit authenticator verification. A successful verification remains valid for up to 10 minutes in this browser tab.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disable-mfa-code">Authenticator code to disable MFA</Label>
              <div className="flex gap-2">
                <Input
                  id="disable-mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <Button variant="destructive" onClick={() => void disableMfa()} disabled={busy || code.length !== 6}>
                  {busy ? "Disabling…" : "Disable MFA"}
                </Button>
              </div>
            </div>
          </div>
        ) : setup ? (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold">Add Nexus Forge to your authenticator</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add an account manually with the setup key below, or use the authenticator deep link if your device supports it. The secret stays between your browser and Nexus Forge; it is not sent to an external QR-code service.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Manual setup key</Label>
              <div className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-black/20 p-3">
                <code className="min-w-0 flex-1 break-all text-sm text-cyan-100">{setup.manualEntrySecret}</code>
                <Button variant="outline" size="sm" onClick={() => void copySecret()}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <a href={setup.otpauthUrl} className="inline-block text-sm text-cyan-300 hover:underline">
                Open in authenticator app
              </a>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enable-mfa-code">Verify the first 6-digit code</Label>
              <Input
                id="enable-mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => void enableMfa()} disabled={busy || code.length !== 6}>
                {busy ? "Verifying…" : "Verify and enable"}
              </Button>
              <Button variant="outline" onClick={() => { setSetup(null); setCode(""); setError(null); }} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">Authenticator MFA is not enabled</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Plugin lifecycle changes, database credential rotation, blockchain signing, and other sensitive operations are blocked until MFA is configured.
              </p>
            </div>
            <Button onClick={() => void beginSetup()} disabled={busy}>
              {busy ? "Starting…" : "Set up authenticator MFA"}
            </Button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </section>
    </div>
  );
}
