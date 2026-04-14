import { redirect } from "next/navigation";

export default async function ProjectApiPage({
    params,
}: Readonly<{
    params: Promise<{ id: string }>;
}>) {
    const { id } = await params;
    redirect(`/projects/${id}/documentation`);
}
