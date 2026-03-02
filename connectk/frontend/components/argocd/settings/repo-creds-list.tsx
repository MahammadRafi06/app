"use client";

import { useState } from "react";
import { useRepoCreds, useCreateRepoCreds, useDeleteRepoCreds } from "@/hooks/argocd/use-repocreds";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/argocd/shared/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/argocd/shared/empty-state";
import { Plus, Trash2, KeyRound } from "lucide-react";

export function RepoCredsList() {
  const { data, isLoading } = useRepoCreds();
  const createCreds = useCreateRepoCreds();
  const deleteCreds = useDeleteRepoCreds();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sshPrivateKey, setSshPrivateKey] = useState("");

  const items = data?.items ?? [];

  function handleCreate() {
    createCreds.mutate(
      {
        url,
        username: username || undefined,
        password: password || undefined,
        sshPrivateKey: sshPrivateKey || undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          resetForm();
        },
      }
    );
  }

  function resetForm() {
    setUrl("");
    setUsername("");
    setPassword("");
    setSshPrivateKey("");
  }

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Repository Credentials</h2>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Credentials
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No Repository Credentials"
          description="Credential templates match repositories by URL prefix."
          action={
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Credentials
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL Pattern</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((cred) => (
                <TableRow key={cred.url}>
                  <TableCell className="font-mono text-xs">{cred.url}</TableCell>
                  <TableCell className="text-sm">{cred.username || "—"}</TableCell>
                  <TableCell className="text-sm">{cred.type || "git"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(cred.url)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Repository Credentials</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="https">
            <TabsList className="mb-4">
              <TabsTrigger value="https">HTTPS</TabsTrigger>
              <TabsTrigger value="ssh">SSH</TabsTrigger>
            </TabsList>
            <TabsContent value="https" className="space-y-4">
              <div className="space-y-1.5">
                <Label>URL Pattern</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/org" />
              </div>
              <div className="space-y-1.5">
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Password / Token</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </TabsContent>
            <TabsContent value="ssh" className="space-y-4">
              <div className="space-y-1.5">
                <Label>URL Pattern</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="git@github.com:org" />
              </div>
              <div className="space-y-1.5">
                <Label>SSH Private Key</Label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  value={sshPrivateKey}
                  onChange={(e) => setSshPrivateKey(e.target.value)}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!url || createCreds.isPending}>
              {createCreds.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Credentials"
        description={`Remove credentials for "${deleteTarget}"?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteCreds.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
        }}
        loading={deleteCreds.isPending}
      />
    </>
  );
}
