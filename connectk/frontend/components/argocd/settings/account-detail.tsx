"use client";

import { useState } from "react";
import { useAccount, useCreateToken, useDeleteToken, useUpdatePassword } from "@/hooks/argocd/use-misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/argocd/shared/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/argocd-utils";
import { Plus, Trash2, Key, Lock, Copy } from "lucide-react";
import { toast } from "sonner";

interface AccountDetailProps {
  name: string;
}

export function AccountDetail({ name }: AccountDetailProps) {
  const { data: account, isLoading } = useAccount(name);
  const createToken = useCreateToken();
  const deleteToken = useDeleteToken();
  const updatePassword = useUpdatePassword();

  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (isLoading) return <Skeleton className="h-64" />;
  if (!account) return <p className="text-destructive">Account not found.</p>;

  function handleCreateToken() {
    const expSeconds = expiresIn ? parseInt(expiresIn, 10) * 3600 : undefined;
    createToken.mutate(
      { name, expiresIn: expSeconds },
      {
        onSuccess: (data: { token?: string }) => {
          if (data?.token) {
            setGeneratedToken(data.token);
          }
          setTokenDialogOpen(false);
          setExpiresIn("");
        },
      }
    );
  }

  function handleUpdatePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    updatePassword.mutate(
      { currentPassword, newPassword, name },
      {
        onSuccess: () => {
          setPasswordDialogOpen(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      }
    );
  }

  const tokens = account.tokens ?? [];

  return (
    <div className="space-y-4">
      {/* Account Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 divide-y text-sm">
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{account.name}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Enabled</span>
            <Badge variant={account.enabled ? "default" : "secondary"} className="text-[10px]">
              {account.enabled ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Capabilities</span>
            <div className="flex gap-1">
              {(account.capabilities ?? []).map((cap) => (
                <Badge key={cap} variant="outline" className="text-[10px]">{cap}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tokens */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4" /> API Tokens ({tokens.length})
          </CardTitle>
          <Button size="sm" onClick={() => setTokenDialogOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Generate
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No tokens generated.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Issued At</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="text-xs">{t.iat ? formatDate(new Date(Number(t.iat) * 1000)) : "—"}</TableCell>
                    <TableCell className="text-xs">{t.exp ? formatDate(new Date(Number(t.exp) * 1000)) : "Never"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteTokenId(t.id ?? null)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4" /> Password
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Generated Token Display */}
      {generatedToken && (
        <Card className="border-emerald-500/50">
          <CardContent className="py-4">
            <p className="text-sm font-medium mb-2">Generated Token (copy now, shown only once):</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-muted p-2 rounded break-all">{generatedToken}</code>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => { navigator.clipboard.writeText(generatedToken); toast.success("Copied!"); }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Token Dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate API Token</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Expires In (hours, blank = never)</Label>
              <Input type="number" value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTokenDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateToken} disabled={createToken.isPending}>
              {createToken.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePassword} disabled={updatePassword.isPending || !newPassword}>
              {updatePassword.isPending ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Token Confirm */}
      <ConfirmDialog
        open={!!deleteTokenId}
        onOpenChange={(o) => { if (!o) setDeleteTokenId(null); }}
        title="Delete Token"
        description="This token will be permanently revoked."
        confirmLabel="Delete Token"
        onConfirm={() => {
          if (deleteTokenId) deleteToken.mutate({ name, id: deleteTokenId }, { onSuccess: () => setDeleteTokenId(null) });
        }}
        loading={deleteToken.isPending}
      />
    </div>
  );
}
