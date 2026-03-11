"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useProjectStore } from "@/store/projectStore";

export default function ProjectApiPage() {
    const params = useParams();
    const projectId = params.id as string | undefined;
    const project = useProjectStore((s) => s.activeProject);

    if (!projectId) return null;

    const baseUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/projects/${projectId}`;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-lg font-semibold">Project API</h2>
                <p className="text-sm text-muted-foreground">Base endpoints and example requests for this project.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Base URL</CardTitle>
                </CardHeader>
                <CardContent>
                    <code className="block p-2 rounded bg-card border border-border font-mono">{baseUrl}</code>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Example: Submit Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">POST /events</p>
                    <pre className="p-3 rounded bg-muted/5 border border-border text-sm overflow-auto">{
                        `POST ${baseUrl}/events
{
  "type": "message.created",
  "payload": { "text": "Hello" }
}`
                    }</pre>
                </CardContent>
            </Card>
        </div>
    );
}
