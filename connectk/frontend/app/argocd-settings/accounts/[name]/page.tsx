"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/argocd/layout/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccountDetail } from "@/components/argocd/settings/account-detail";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function AccountDetailPage() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name);

  return (
    <>
      <Header title={decodedName} />
      <ScrollArea className="flex-1">
        <div className="p-6">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <Link href="/argocd-settings/accounts" className="hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />
              Accounts
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{decodedName}</span>
          </nav>
          <AccountDetail name={decodedName} />
        </div>
      </ScrollArea>
    </>
  );
}
