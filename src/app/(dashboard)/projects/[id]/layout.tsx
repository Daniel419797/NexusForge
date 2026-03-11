import ProjectNav from "@/components/Projects/ProjectNav";
import ProjectHeaderClient from '@/components/Projects/ProjectHeaderClient'

export default async function ProjectDetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    return (
        <div className="flex">
            <ProjectNav projectId={projectId} />

            <div className="flex-1 w-full">
                <ProjectHeaderClient>{children}</ProjectHeaderClient>
            </div>
        </div>
    );
}
