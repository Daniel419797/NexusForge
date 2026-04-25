import api from "./api";
import { assert, assertNonEmptyString, assertProjectId, isRecord, toArray, unwrapDataEnvelope } from "./serviceGuards";

export interface ProjectMember {
    id: string;
    email: string;
    name: string | null;
    avatarUrl?: string | null;
    role: string;
    joinedAt: string;
}

function requiredString(value: unknown, fieldName: string): string {
    assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
    return value;
}

function asProjectMember(value: unknown): ProjectMember {
    assert(isRecord(value), "Invalid project member response");
    return {
        id: requiredString(value.id, "member.id"),
        email: requiredString(value.email, "member.email"),
        name: value.name == null ? null : requiredString(value.name, "member.name"),
        avatarUrl: value.avatarUrl == null ? undefined : requiredString(value.avatarUrl, "member.avatarUrl"),
        role: requiredString(value.role, "member.role"),
        joinedAt: requiredString(value.joinedAt, "member.joinedAt"),
    };
}

function asUpdateRoleResult(value: unknown): { userId: string; role: string } {
    assert(isRecord(value), "Invalid update member role response");
    return {
        userId: requiredString(value.userId, "userId"),
        role: requiredString(value.role, "role"),
    };
}

const MemberService = {
    async list(projectId: string): Promise<ProjectMember[]> {
        assertProjectId(projectId);
        const { data } = await api.get(`/projects/${projectId}/members`);
        return toArray(unwrapDataEnvelope(data), asProjectMember);
    },

    async add(projectId: string, email: string, role: string = "viewer"): Promise<ProjectMember> {
        assertProjectId(projectId);
        assertNonEmptyString(email, "email");
        assertNonEmptyString(role, "role");
        const { data } = await api.post(`/projects/${projectId}/members`, { email, role });
        return asProjectMember(unwrapDataEnvelope(data));
    },

    async updateRole(projectId: string, userId: string, role: string): Promise<{ userId: string; role: string }> {
        assertProjectId(projectId);
        assertNonEmptyString(userId, "userId");
        assertNonEmptyString(role, "role");
        const { data } = await api.patch(`/projects/${projectId}/members/${userId}`, { role });
        return asUpdateRoleResult(unwrapDataEnvelope(data));
    },

    async remove(projectId: string, userId: string): Promise<void> {
        assertProjectId(projectId);
        assertNonEmptyString(userId, "userId");
        await api.delete(`/projects/${projectId}/members/${userId}`);
    },
};

export default MemberService;
