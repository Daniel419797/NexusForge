"use client";

import { useEffect, useMemo, useState } from "react";
import type { PluginMeta, PluginConfigField } from "@/services/PluginService";
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

interface PluginInstallDialogProps {
  plugin: PluginMeta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (config: Record<string, unknown>) => Promise<void>;
}

function initialFieldValue(field: PluginConfigField): string {
  if (Array.isArray(field.defaultValue)) return field.defaultValue.join(", ");
  if (field.defaultValue == null) return "";
  return String(field.defaultValue);
}

function apiErrorMessage(error: unknown): string {
  const response = error && typeof error === "object" && "response" in error
    ? (error as { response?: { data?: { message?: unknown } } }).response
    : undefined;
  if (typeof response?.data?.message === "string") return response.data.message;
  if (error instanceof Error && error.name !== "MfaStepUpCancelledError") return error.message;
  return "";
}

function parseField(field: PluginConfigField, raw: string): unknown {
  const value = raw.trim();
  if (!value) {
    if (field.required) throw new Error(`${field.label} is required.`);
    return undefined;
  }

  if (field.type === "number") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`${field.label} must be a valid number.`);
    return parsed;
  }

  if (field.type === "number-array") {
    const parsed = value.split(",").map((item) => Number(item.trim()));
    if (parsed.length === 0 || parsed.some((item) => !Number.isInteger(item) || item <= 0)) {
      throw new Error(`${field.label} must contain positive integer IDs separated by commas.`);
    }
    return parsed;
  }

  if (field.type === "url") {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`${field.label} must be a valid URL.`);
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error(`${field.label} must use http or https.`);
    }
  }

  return value;
}

export default function PluginInstallDialog({
  plugin,
  open,
  onOpenChange,
  onInstall,
}: PluginInstallDialogProps) {
  const fields = useMemo(() => plugin?.configFields ?? [], [plugin]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!open || !plugin) return;
    setValues(Object.fromEntries(fields.map((field) => [field.key, initialFieldValue(field)])));
    setError(null);
    setInstalling(false);
  }, [fields, open, plugin]);

  const submit = async () => {
    if (!plugin) return;
    setError(null);

    let config: Record<string, unknown>;
    try {
      config = {};
      for (const field of fields) {
        const parsed = parseField(field, values[field.key] ?? "");
        if (parsed !== undefined) config[field.key] = parsed;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check the plugin configuration.");
      return;
    }

    setInstalling(true);
    try {
      await onInstall(config);
      onOpenChange(false);
    } catch (err) {
      const message = apiErrorMessage(err);
      if (message) setError(message);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !installing && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {plugin?.displayName || plugin?.name || "plugin"}</DialogTitle>
          <DialogDescription>
            Enter the settings required by this plugin. Nexus Forge validates them again on the backend before installation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`plugin-config-${field.key}`}>
                {field.label}{field.required ? " *" : ""}
              </Label>
              <Input
                id={`plugin-config-${field.key}`}
                type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                inputMode={field.type === "number" || field.type === "number-array" ? "numeric" : undefined}
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(event) => {
                  setValues((current) => ({ ...current, [field.key]: event.target.value }));
                  setError(null);
                }}
              />
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={installing}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={installing}>
            {installing ? "Installing…" : "Continue to install"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
