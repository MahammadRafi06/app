"use client";

import { useAccounts } from "@/hooks/argocd/use-misc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/argocd/shared/empty-state";
import { Users } from "lucide-react";
import Link from "next/link";

export function AccountsList() {
  const { data, isLoading } = useAccounts();
  const items = data?.items ?? [];

  if (isLoading) return <Skeleton className="h-64" />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Accounts"
        description="No accounts found in ArgoCD."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead>Capabilities</TableHead>
            <TableHead>Tokens</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((account) => (
            <TableRow key={account.name}>
              <TableCell>
                <Link
                  href={`/argocd-settings/accounts/${encodeURIComponent(account.name)}`}
                  className="text-primary hover:underline font-medium"
                >
                  {account.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={account.enabled ? "default" : "secondary"} className="text-[10px]">
                  {account.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {(account.capabilities ?? []).map((cap) => (
                    <Badge key={cap} variant="outline" className="text-[10px]">{cap}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {account.tokens?.length ?? 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
