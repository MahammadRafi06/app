import { Header } from "@/components/argocd/layout/header";
import { RepositoriesList } from "@/components/argocd/settings/repositories-list";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RepositoriesPage() {
  return (
    <>
      <Header
        title="Repositories"
        description="Git and Helm repositories connected to ArgoCD"
      />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <RepositoriesList />
        </div>
      </ScrollArea>
    </>
  );
}
