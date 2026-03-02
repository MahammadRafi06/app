import { Header } from "@/components/argocd/layout/header";
import { GpgKeysList } from "@/components/argocd/settings/gpgkeys-list";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GpgKeysPage() {
  return (
    <>
      <Header
        title="GPG Keys"
        description="Public keys for Git commit verification"
      />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <GpgKeysList />
        </div>
      </ScrollArea>
    </>
  );
}
