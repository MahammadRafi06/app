import { Header } from "@/components/argocd/layout/header";
import { ProjectsList } from "@/components/argocd/settings/projects-list";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProjectsPage() {
  return (
    <>
      <Header title="Projects" description="Logical groupings of applications and policies" />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <ProjectsList />
        </div>
      </ScrollArea>
    </>
  );
}
