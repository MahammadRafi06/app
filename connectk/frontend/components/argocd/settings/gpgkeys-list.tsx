"use client";

import { useState } from "react";
import { useGpgKeys, useDeleteGpgKey, useCreateGpgKey } from "@/hooks/argocd/use-misc";
import { EmptyState } from "@/components/argocd/shared/empty-state";
import { TableSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { ConfirmDialog } from "@/components/argocd/shared/confirm-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { KeyRound, Plus, Trash2 } from "lucide-react";

export function GpgKeysList() {
  const { data, isLoading, error } = useGpgKeys();
  const deleteKey = useDeleteGpgKey();
  const createKey = useCreateGpgKey();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [keyData, setKeyData] = useState("");

  if (isLoading) return <TableSkeleton />;
  if (error) return <p className="text-destructive text-sm">{(error as Error).message}</p>;

  const keys = Object.values(data?.items ?? {});

  function handleCreate() {
    createKey.mutate(keyData, { onSuccess: () => { setCreateOpen(false); setKeyData(""); } });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{keys.length} GPG keys</p>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add GPG Key
        </Button>
      </div>

      {keys.length === 0 ? (
        <EmptyState icon={KeyRound} title="No GPG Keys" description="No GPG public keys configured for commit verification." />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Key ID</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Trust</TableHead>
                <TableHead>Sub Type</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.keyID} className="group">
                  <TableCell className="font-mono text-sm font-medium">{key.keyID}</TableCell>
                  <TableCell className="text-sm">{key.owner ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={key.trust === "ultimate" || key.trust === "full" ? "default" : "secondary"}
                      className="text-xs capitalize"
                    >
                      {key.trust ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {key.subType ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(key.keyID)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add GPG Public Key</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>GPG Public Key (ASCII armored)</Label>
            <Textarea
              value={keyData}
              onChange={(e) => setKeyData(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!keyData || createKey.isPending}>
              {createKey.isPending ? "Importing…" : "Import Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Remove GPG Key"
        description={`Remove GPG key "${deleteTarget}"?`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (deleteTarget) deleteKey.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
        }}
        loading={deleteKey.isPending}
      />
    </div>
  );
}
