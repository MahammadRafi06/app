import { Header } from "@/components/argocd/layout/header";
import { ClustersList } from "@/components/argocd/settings/clusters-list";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ClustersPage() {
  return (
    <>
      <Header
        title="Clusters"
        description="Kubernetes clusters registered with ArgoCD"
      />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <ClustersList />
        </div>
      </ScrollArea>
    </>
  );
}
