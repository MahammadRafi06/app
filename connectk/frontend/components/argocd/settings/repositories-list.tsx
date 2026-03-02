"use client";

import { useState } from "react";
import { useRepositories, useDeleteRepository, useCreateRepository } from "@/hooks/argocd/use-repositories";
import { type Repository } from "@/lib/argocd-schemas";
import { ConnectionBadge } from "@/components/argocd/applications/status-badges";
import { EmptyState } from "@/components/argocd/shared/empty-state";
import { TableSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { ConfirmDialog } from "@/components/argocd/shared/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { GitBranch, Plus, Trash2, RefreshCw } from "lucide-react";
import { repoUrlToDisplayName } from "@/lib/argocd-utils";

export function RepositoriesList() {
  const { data, isLoading, error, refetch } = useRepositories();
  const deleteRepo = useDeleteRepository();
  const createRepo = useCreateRepository();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Repository | null>(null);

  // Form
  const [authType, setAuthType] = useState<"https" | "ssh">("https");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sshKey, setSshKey] = useState("");

  const repos = data?.items ?? [];

  if (isLoading) return <TableSkeleton />;
  if (error) return <p className="text-destructive text-sm">{(error as Error).message}</p>;

  function handleCreate() {
    const repo: Partial<Repository> = {
      repo: url,
      username: username || undefined,
    };
    if (authType === "ssh") {
      (repo as any).sshPrivateKey = sshKey;
    } else {
      (repo as any).password = password;
    }
    createRepo.mutate(repo, {
      onSuccess: () => {
        setCreateOpen(false);
        setUrl(""); setUsername(""); setPassword(""); setSshKey("");
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{repos.length} repositories</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Repository
          </Button>
        </div>
      </div>

      {repos.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No Repositories"
          description="Connect a Git repository to start deploying applications."
          action={
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Repository
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Repository</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Connection</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {repos.map((repo) => (
                <TableRow key={repo.repo} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{repoUrlToDisplayName(repo.repo)}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                        {repo.repo}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {repo.type ?? "git"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ConnectionBadge status={repo.connectionState?.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {repo.project ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(repo)}
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Repository</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Repository URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/org/repo.git" />
            </div>

            <div className="space-y-1.5">
              <Label>Auth Method</Label>
              <Select value={authType} onValueChange={(v) => setAuthType(v as typeof authType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="https">HTTPS (username/password)</SelectItem>
                  <SelectItem value="ssh">SSH Key</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {authType === "https" && (
              <>
                <div className="space-y-1.5">
                  <Label>Username</Label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Password / Token</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </>
            )}

            {authType === "ssh" && (
              <div className="space-y-1.5">
                <Label>SSH Private Key</Label>
                <Textarea
                  value={sshKey}
                  onChange={(e) => setSshKey(e.target.value)}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!url || createRepo.isPending}>
              {createRepo.isPending ? "Connecting…" : "Add Repository"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Remove Repository"
        description={`Remove "${deleteTarget?.repo}" from FluxBoard? Applications using this repository will not be affected.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (deleteTarget) deleteRepo.mutate(deleteTarget.repo, { onSuccess: () => setDeleteTarget(null) });
        }}
        loading={deleteRepo.isPending}
      />
    </div>
  );
}
