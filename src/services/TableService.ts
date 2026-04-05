import api from "./api";

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

const TableService = {
    async listTables(projectId: string): Promise<CustomTable[]> {
        const { data } = await api.get(`/projects/${projectId}/tables`);
        return data.data.tables;
    },

    async createTable(projectId: string, payload: CreateTablePayload): Promise<CustomTable> {
        const { data } = await api.post(`/projects/${projectId}/tables`, payload);
        return data.data;
    },

    async deleteTable(projectId: string, tableId: string): Promise<void> {
        await api.delete(`/projects/${projectId}/tables/${tableId}`);
    },

    async updateTable(projectId: string, tableId: string, payload: Partial<Pick<CustomTable, 'displayName' | 'fields'>>): Promise<CustomTable> {
        const { data } = await api.patch(`/projects/${projectId}/tables/${tableId}`, payload);
        return data.data;
    },

    async migrateTable(projectId: string, tableId: string): Promise<{ ddl: string; migrated: boolean }> {
        const { data } = await api.post(`/projects/${projectId}/tables/${tableId}/migrate`);
        return data.data;
    },

    async listRows(projectId: string, tableId: string, limit = 20, offset = 0): Promise<TableDataResult> {
        const { data } = await api.get(`/projects/${projectId}/tables/${tableId}/data`, {
            params: { limit, offset },
        });
        return data.data;
    },

    async insertRow(projectId: string, tableId: string, row: Record<string, unknown>): Promise<Record<string, unknown>> {
        const { data } = await api.post(`/projects/${projectId}/tables/${tableId}/data`, row);
        return data.data;
    },

    async updateRow(projectId: string, tableId: string, rowId: string, row: Record<string, unknown>): Promise<Record<string, unknown>> {
        const { data } = await api.patch(`/projects/${projectId}/tables/${tableId}/data/${rowId}`, row);
        return data.data;
    },

    async deleteRow(projectId: string, tableId: string, rowId: string): Promise<void> {
        await api.delete(`/projects/${projectId}/tables/${tableId}/data/${rowId}`);
    },
};

export default TableService;
