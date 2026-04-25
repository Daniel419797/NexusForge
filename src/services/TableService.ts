import api from "./api";
import { assert, assertNonEmptyString, assertProjectId, assertUuid, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";

export type FieldType = "string" | "number" | "boolean" | "date" | "array" | "object";

export interface FieldDefinition {
    name: string;
    type: FieldType;
    required: boolean;
    unique: boolean;
    defaultValue?: unknown;
}

export interface CustomTable {
    id: string;
    projectId: string;
    name: string;
    displayName: string;
    fields: FieldDefinition[];
    migratedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTablePayload {
    name: string;
    displayName: string;
    fields: FieldDefinition[];
}

export interface TableDataResult {
    rows: Record<string, unknown>[];
    total: number;
}

function requiredString(value: unknown, fieldName: string): string {
    assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
    return value;
}

function requiredBoolean(value: unknown, fieldName: string): boolean {
    assert(typeof value === "boolean", `${fieldName} must be a boolean`);
    return value;
}

function requiredNumber(value: unknown, fieldName: string): number {
    assert(typeof value === "number" && Number.isFinite(value), `${fieldName} must be a number`);
    return value;
}

function asFieldDefinition(value: unknown): FieldDefinition {
    assert(isRecord(value), "Invalid table field definition");
    const type = requiredString(value.type, "field.type") as FieldType;
    return {
        name: requiredString(value.name, "field.name"),
        type,
        required: requiredBoolean(value.required, "field.required"),
        unique: requiredBoolean(value.unique, "field.unique"),
        defaultValue: value.defaultValue,
    };
}

function asCustomTable(value: unknown): CustomTable {
    assert(isRecord(value), "Invalid table response");
    return {
        id: requiredString(value.id, "table.id"),
        projectId: requiredString(value.projectId, "table.projectId"),
        name: requiredString(value.name, "table.name"),
        displayName: requiredString(value.displayName, "table.displayName"),
        fields: toArray(value.fields, asFieldDefinition),
        migratedAt: value.migratedAt == null ? null : requiredString(value.migratedAt, "table.migratedAt"),
        createdAt: requiredString(value.createdAt, "table.createdAt"),
        updatedAt: requiredString(value.updatedAt, "table.updatedAt"),
    };
}

function asMigrateResult(value: unknown): { ddl: string; migrated: boolean } {
    assert(isRecord(value), "Invalid table migration response");
    return {
        ddl: requiredString(value.ddl, "ddl"),
        migrated: requiredBoolean(value.migrated, "migrated"),
    };
}

function asTableDataResult(value: unknown): TableDataResult {
    assert(isRecord(value), "Invalid table data response");
    return {
        rows: toArray(value.rows, (row): Record<string, unknown> => {
            assert(isRecord(row), "Invalid table row item");
            return row;
        }),
        total: requiredNumber(value.total, "total"),
    };
}

function asRowRecord(value: unknown): Record<string, unknown> {
    assert(isRecord(value), "Invalid row record response");
    return value;
}

const TableService = {
    async listTables(projectId: string): Promise<CustomTable[]> {
        assertProjectId(projectId);
        const { data } = await api.get(`/projects/${projectId}/tables`);
        const payload = unwrapDataEnvelope(data);
        return isRecord(payload) ? toArray(payload.tables, asCustomTable) : [];
    },

    async createTable(projectId: string, payload: CreateTablePayload): Promise<CustomTable> {
        assertProjectId(projectId);
        assertNonEmptyString(payload.name, "name");
        assertNonEmptyString(payload.displayName, "displayName");
        assert(Array.isArray(payload.fields), "fields must be an array");
        const { data } = await api.post(`/projects/${projectId}/tables`, payload);
        return asCustomTable(unwrapDataEnvelope(data));
    },

    async deleteTable(projectId: string, tableId: string): Promise<void> {
        assertProjectId(projectId);
        assertUuid(tableId, "tableId");
        await api.delete(`/projects/${projectId}/tables/${tableId}`);
    },

    async updateTable(projectId: string, tableId: string, payload: Partial<Pick<CustomTable, 'displayName' | 'fields'>>): Promise<CustomTable> {
        assertProjectId(projectId);
        assertUuid(tableId, "tableId");
        const { data } = await api.patch(`/projects/${projectId}/tables/${tableId}`, payload);
        return asCustomTable(unwrapDataEnvelope(data));
    },

    async migrateTable(projectId: string, tableId: string): Promise<{ ddl: string; migrated: boolean }> {
        assertProjectId(projectId);
        assertUuid(tableId, "tableId");
        const { data } = await api.post(`/projects/${projectId}/tables/${tableId}/migrate`);
        return asMigrateResult(unwrapDataEnvelope(data));
    },

    async listRows(projectId: string, tableId: string, limit = 20, offset = 0): Promise<TableDataResult> {
        assertProjectId(projectId);
        assertUuid(tableId, "tableId");
        assert(Number.isInteger(limit) && limit > 0, "limit must be a positive integer");
        assert(Number.isInteger(offset) && offset >= 0, "offset must be a non-negative integer");
        const { data } = await api.get(`/projects/${projectId}/tables/${tableId}/data`, {
            params: { limit, offset },
        });
        return asTableDataResult(unwrapDataEnvelope(data));
    },

    async insertRow(projectId: string, tableId: string, row: Record<string, unknown>): Promise<Record<string, unknown>> {
        assertProjectId(projectId);
        assertUuid(tableId, "tableId");
        assert(isRecord(row), "row must be an object");
        const { data } = await api.post(`/projects/${projectId}/tables/${tableId}/data`, row);
        return asRowRecord(unwrapDataEnvelope(data));
    },

    async updateRow(projectId: string, tableId: string, rowId: string, row: Record<string, unknown>): Promise<Record<string, unknown>> {
        assertProjectId(projectId);
        assertUuid(tableId, "tableId");
        assertUuid(rowId, "rowId");
        assert(isRecord(row), "row must be an object");
        const { data } = await api.patch(`/projects/${projectId}/tables/${tableId}/data/${rowId}`, row);
        return asRowRecord(unwrapDataEnvelope(data));
    },

    async deleteRow(projectId: string, tableId: string, rowId: string): Promise<void> {
        assertProjectId(projectId);
        assertUuid(tableId, "tableId");
        assertUuid(rowId, "rowId");
        await api.delete(`/projects/${projectId}/tables/${tableId}/data/${rowId}`);
    },
};

export default TableService;
