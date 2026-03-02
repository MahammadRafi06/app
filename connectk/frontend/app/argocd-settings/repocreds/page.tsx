"use client";

import { Header } from "@/components/argocd/layout/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RepoCredsList } from "@/components/argocd/settings/repo-creds-list";

export default function RepoCredsPage() {
  return (
    <>
      <Header title="Repository Credentials" description="Credential templates for repository access" />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <RepoCredsList />
        </div>
      </ScrollArea>
    </>
  );
}
