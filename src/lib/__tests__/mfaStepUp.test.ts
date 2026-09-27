import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearStoredMfaStepUpToken,
    getStoredMfaStepUpToken,
    storeMfaStepUpToken,
} from "@/lib/mfaStepUp";

describe("MFA step-up storage", () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.useRealTimers();
    });

    it("stores and returns an unexpired token", () => {
        storeMfaStepUpToken("step-token", 600);
        expect(getStoredMfaStepUpToken()).toBe("step-token");
    });

    it("removes expired tokens", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-09-27T10:00:00Z"));
        storeMfaStepUpToken("step-token", 10);
        vi.setSystemTime(new Date("2026-09-27T10:00:11Z"));
        expect(getStoredMfaStepUpToken()).toBeNull();
    });

    it("clears the token explicitly", () => {
        storeMfaStepUpToken("step-token", 600);
        clearStoredMfaStepUpToken();
        expect(getStoredMfaStepUpToken()).toBeNull();
    });
});
