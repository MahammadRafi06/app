"use client";

import { Header } from "@/components/argocd/layout/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccountsList } from "@/components/argocd/settings/accounts-list";

export default function AccountsPage() {
  return (
    <>
      <Header title="Accounts" description="Manage ArgoCD user accounts" />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <AccountsList />
        </div>
      </ScrollArea>
    </>
  );
}
