import api from "./api";

export interface ProjectMember {
    id: string;
    email: string;
    name: string | null;
    avatarUrl?: string | null;
    role: string;
    joinedAt: string;
}

const MemberService = {
    async list(projectId: string): Promise<ProjectMember[]> {
        const { data } = await api.get(`/projects/${projectId}/members`);
        return data.data || [];
    },

    async add(projectId: string, email: string, role: string = "viewer"): Promise<ProjectMember> {
        const { data } = await api.post(`/projects/${projectId}/members`, { email, role });
        return data.data;
    },

    async updateRole(projectId: string, userId: string, role: string): Promise<{ userId: string; role: string }> {
        const { data } = await api.patch(`/projects/${projectId}/members/${userId}`, { role });
        return data.data;
    },

    async remove(projectId: string, userId: string): Promise<void> {
        await api.delete(`/projects/${projectId}/members/${userId}`);
    },
};

export default MemberService;
