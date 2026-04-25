import api from "./api";
import { assert, assertNonEmptyString, assertProjectId, isRecord, unwrapDataEnvelope } from "./serviceGuards";

export interface X402Config {
    enabled: boolean;
    walletAddress?: string;
    amount?: string;
    currency?: string;
    chain?: string;
    settings?: Record<string, any>;
}

function requiredBoolean(value: unknown, fieldName: string): boolean {
    assert(typeof value === "boolean", `${fieldName} must be a boolean`);
    return value;
}

function optionalString(value: unknown): string | undefined {
    if (value == null) return undefined;
    assert(typeof value === "string", "Expected string or undefined");
    return value;
}

function asX402Config(value: unknown): X402Config {
    assert(isRecord(value), "Invalid x402 config response");
    return {
        enabled: requiredBoolean(value.enabled, "enabled"),
        walletAddress: optionalString(value.walletAddress),
        amount: optionalString(value.amount),
        currency: optionalString(value.currency),
        chain: optionalString(value.chain),
        settings: isRecord(value.settings) ? value.settings : undefined,
    };
}

const X402Service = {
    async getConfig(projectId: string): Promise<X402Config | null> {
        assertProjectId(projectId);
        const { data } = await api.get("/x402/config", {
            headers: { "x-project-id": projectId },
        });
        const payload = unwrapDataEnvelope(data);
        return payload == null ? null : asX402Config(payload);
    },

    async updateConfig(projectId: string, payload: Partial<X402Config>): Promise<X402Config> {
        assertProjectId(projectId);
        const { data } = await api.put("/x402/config", payload, {
            headers: { "x-project-id": projectId },
        });
        return asX402Config(unwrapDataEnvelope(data));
    },

    async verifyPayment(projectId: string, payload: { txHash: string; chain?: string }) {
        assertProjectId(projectId);
        assertNonEmptyString(payload.txHash, "txHash");
        const { data } = await api.post("/x402/verify", payload, {
            headers: { "x-project-id": projectId },
        });
        return unwrapDataEnvelope(data);
    },
};

export default X402Service;
