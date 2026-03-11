// "use client";

// import Link from "next/link";
// import { useProjectStore } from "@/store/projectStore";

// export default function ProjectSidebarContent() {
//     const project = useProjectStore((s) => s.activeProject);

//     if (!project) return null;

//     return (
//         <div className="space-y-6">
//             <div className="mb-2">
//                 <h2 className="text-2xl font-bold">{project.name}</h2>
//                 <p className="text-sm text-muted-foreground mt-1">{project.description || "Project dashboard"}</p>
//             </div>

//             {project.enabledModules && project.enabledModules.length > 0 && (
//                 <div>
//                     <h3 className="text-sm font-medium text-muted-foreground mb-2">Enabled Modules</h3>
//                     <div className="grid grid-cols-2 gap-2">
//                         {project.enabledModules.map((m: string) => (
//                             <Link key={m} href={`/projects/${project.id}/documentation/${m}`} className="p-3 rounded-md border border-border bg-card text-sm">
//                                 {m}
//                             </Link>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             <div>
//                 <h3 className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</h3>
//                 <div className="flex gap-2">
//                     <Link href={`/projects/${project.id}/api`} className="px-3 py-2 rounded-md bg-primary/5 text-primary text-sm">API</Link>
//                     <Link href={`/projects/${project.id}/plugins`} className="px-3 py-2 rounded-md border border-border text-sm">Plugins</Link>
//                 </div>
//             </div>
//         </div>
//     );
// }
