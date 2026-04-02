"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import MemberService, { ProjectMember } from "@/services/MemberService";
import { useAuthStore } from "@/store/authStore";

export default function MembersPage() {
    const params = useParams();
    const projectId = params.id as string;
    const currentUser = useAuthStore((s) => s.user);

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add member form
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");
    const [adding, setAdding] = useState(false);
    const [addMessage, setAddMessage] = useState<string | null>(null);

    const fetchMembers = async () => {
        try {
            const data = await MemberService.list(projectId);
            setMembers(data);
        } catch {
            setError("Failed to load members.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const currentMember = members.find((m) => m.id === currentUser?.id);
    const isOwnerOrAdmin = currentMember?.role === "owner" || currentMember?.role === "admin";

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        setAddMessage(null);
        try {
            await MemberService.add(projectId, email, role);
            setEmail("");
            setRole("viewer");
            setAddMessage("Member added successfully.");
            await fetchMembers();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setAddMessage(axiosErr.response?.data?.message || "Failed to add member.");
        } finally {
            setAdding(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await MemberService.updateRole(projectId, userId, newRole);
            await fetchMembers();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || "Failed to update role.");
        }
    };

    const handleRemove = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            await MemberService.remove(projectId, userId);
            await fetchMembers();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || "Failed to remove member.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
            <div>
                <h1 className="text-2xl font-bold font-display tracking-tight">Members</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage who has access to this project and their roles.
                </p>
            </div>

            {error && (
                <div role="alert" className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Add Member */}
            {isOwnerOrAdmin && (
                <section className="animate-in-up">
                    <h2 className="text-sm font-semibold font-display tracking-tight mb-4">Add Member</h2>
                    <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="member-email" className="sr-only">Email</Label>
                            <Input
                                id="member-email"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="w-32 space-y-1">
                            <Label htmlFor="member-role" className="sr-only">Role</Label>
                            <select
                                id="member-role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <Button type="submit" disabled={adding}>
                            {adding ? "Adding..." : "Add"}
                        </Button>
                    </form>
                    {addMessage && (
                        <p className="mt-3 text-sm text-muted-foreground">{addMessage}</p>
                    )}
                </section>
            )}

            {/* Member List */}
            <section className="animate-in-up stagger-2">
                <h2 className="text-sm font-semibold font-display tracking-tight mb-4">Team ({members.length})</h2>
                <div className="divide-y divide-border">
                        {members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-medium text-primary">
                                                {(member.name || member.email)?.[0]?.toUpperCase() || "?"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {member.name || "Unnamed"}
                                            {member.id === currentUser?.id && (
                                                <span className="text-xs text-muted-foreground ml-1">(you)</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {isOwnerOrAdmin && member.role !== "owner" && member.id !== currentUser?.id ? (
                                        <>
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                            >
                                                <option value="viewer">Viewer</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemove(member.id)}
                                            >
                                                Remove
                                            </Button>
                                        </>
                                    ) : (
                                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                                            {member.role}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {members.length === 0 && (
                            <p className="text-sm text-muted-foreground py-4 text-center">No members found.</p>
                        )}
                    </div>
            </section>
        </div>
    );
}
