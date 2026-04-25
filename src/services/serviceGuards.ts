const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export function assertProjectId(projectId: string): void {
    assert(typeof projectId === "string" && UUID_PATTERN.test(projectId), "Invalid projectId");
}

export function assertUuid(value: string, fieldName: string): void {
    assert(typeof value === "string" && UUID_PATTERN.test(value), `Invalid ${fieldName}`);
}

export function assertNonEmptyString(value: string, fieldName: string): void {
    assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
}

export function assertObject(value: unknown, fieldName: string): asserts value is Record<string, unknown> {
    assert(isRecord(value), `${fieldName} must be an object`);
}

export function unwrapDataEnvelope(payload: unknown): unknown {
    assert(isRecord(payload), "Invalid API response envelope");
    return payload.data;
}

export function unwrapDataObject(payload: unknown): Record<string, unknown> {
    const data = unwrapDataEnvelope(payload);
    assertObject(data, "response data");
    return data;
}

export function unwrapDataArray(payload: unknown): unknown[] {
    const data = unwrapDataEnvelope(payload);
    assert(Array.isArray(data), "response data must be an array");
    return data;
}

export function toArray<T>(value: unknown, mapper: (item: unknown) => T): T[] {
    if (!Array.isArray(value)) return [];
    return value.map(mapper);
}

export function toStringOrNull(value: unknown): string | null {
    if (value == null) return null;
    return String(value);
}
