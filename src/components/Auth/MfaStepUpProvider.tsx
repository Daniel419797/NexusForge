"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import AuthService from "@/services/AuthService";
import {
  clearStoredMfaStepUpToken,
  getStoredMfaStepUpToken,
  storeMfaStepUpToken,
} from "@/lib/mfaStepUp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApiErrorShape {
  response?: {
    data?: {
      error?: unknown;
      message?: unknown;
    };
  };
}

function getApiError(error: unknown): { code?: string; message: string } {
  const response = (error as ApiErrorShape | undefined)?.response;
  return {
    code: typeof response?.data?.error === "string" ? response.data.error : undefined,
    message:
      typeof response?.data?.message === "string"
        ? response.data.message
        : "Unable to verify multi-factor authentication.",
  };
}

export class MfaStepUpCancelledError extends Error {
  constructor() {
    super("MFA verification cancelled");
    this.name = "MfaStepUpCancelledError";
  }
}

interface PendingVerification {
  promise: Promise<string>;
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface MfaStepUpContextValue {
  requireMfa: () => Promise<string>;
  runWithMfa: <T>(action: (stepUpToken: string) => Promise<T>) => Promise<T>;
  invalidateMfa: () => void;
}

const MfaStepUpContext = createContext<MfaStepUpContextValue | null>(null);

export function MfaStepUpProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pendingRef = useRef<PendingVerification | null>(null);
  const [open, setOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const invalidateMfa = useCallback(() => {
    clearStoredMfaStepUpToken();
  }, []);

  const rejectPending = useCallback((reason: unknown = new MfaStepUpCancelledError()) => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) pending.reject(reason);
  }, []);

  const requireMfa = useCallback((): Promise<string> => {
    const cached = getStoredMfaStepUpToken();
    if (cached) return Promise.resolve(cached);
    if (pendingRef.current) return pendingRef.current.promise;

    let resolve!: (token: string) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<string>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    pendingRef.current = { promise, resolve, reject };
    setCode("");
    setError(null);
    setMfaEnabled(null);
    setOpen(true);
    return promise;
  }, []);

  const runWithMfa = useCallback(
    async <T,>(action: (stepUpToken: string) => Promise<T>): Promise<T> => {
      let token = await requireMfa();
      try {
        return await action(token);
      } catch (err) {
        const { code: errorCode } = getApiError(err);
        if (
          errorCode === "MFA_STEP_UP_INVALID" ||
          errorCode === "MFA_STEP_UP_REQUIRED"
        ) {
          invalidateMfa();
          token = await requireMfa();
          return action(token);
        }
        if (errorCode === "MFA_NOT_ENABLED") {
          invalidateMfa();
        }
        throw err;
      }
    },
    [invalidateMfa, requireMfa],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatusLoading(true);
    setError(null);
    AuthService.getMfaStatus()
      .then((status) => {
        if (!cancelled) setMfaEnabled(status.enabled);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setCode("");
    setError(null);
    rejectPending();
  }, [rejectPending]);

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const result = await AuthService.createMfaStepUp(code);
      storeMfaStepUpToken(result.stepUpToken, result.expiresInSeconds);
      const pending = pendingRef.current;
      pendingRef.current = null;
      setOpen(false);
      setCode("");
      pending?.resolve(result.stepUpToken);
    } catch (err: unknown) {
      setError(getApiError(err).message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <MfaStepUpContext.Provider value={{ requireMfa, runWithMfa, invalidateMfa }}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Verify sensitive action</DialogTitle>
            <DialogDescription>
              Nexus Forge requires a recent authenticator verification before this change can continue.
            </DialogDescription>
          </DialogHeader>

          {statusLoading ? (
            <p className="py-6 text-sm text-muted-foreground">Checking MFA status…</p>
          ) : mfaEnabled === false ? (
            <div className="space-y-4 py-2">
              <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-100/80">
                Multi-factor authentication is not enabled for your account. Enable it before performing sensitive actions.
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button
                  onClick={() => {
                    router.push("/account/security");
                    closeDialog();
                  }}
                >
                  Set up MFA
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="mfa-step-up-code">Authenticator code</Label>
                <Input
                  id="mfa-step-up-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void verify();
                  }}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={verifying}>Cancel</Button>
                <Button onClick={() => void verify()} disabled={verifying || code.length !== 6}>
                  {verifying ? "Verifying…" : "Verify"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MfaStepUpContext.Provider>
  );
}

export function useMfaStepUp(): MfaStepUpContextValue {
  const context = useContext(MfaStepUpContext);
  if (!context) {
    throw new Error("useMfaStepUp must be used within MfaStepUpProvider");
  }
  return context;
}
