"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useApplicationSet, useDeleteApplicationSet } from "@/hooks/argocd/use-applicationsets";
import { Header } from "@/components/argocd/layout/header";
import { DetailSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { ConfirmDialog } from "@/components/argocd/shared/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YamlEditor } from "@/components/argocd/shared/yaml-editor";
import { ChevronLeft, Trash2, Layers, Settings, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ApplicationSetDetailPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const decodedName = decodeURIComponent(name);
  const { data: appSet, isLoading, error } = useApplicationSet(decodedName);
  const deleteAppSet = useDeleteApplicationSet();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <><Header title="Loading..." /><DetailSkeleton /></>;

  if (error || !appSet) {
    return (
      <>
        <Header title="ApplicationSet" />
        <div className="p-6">
          <p className="text-destructive">{(error as Error)?.message ?? "Not found."}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/applicationsets")}>
            Back to ApplicationSets
          </Button>
        </div>
      </>
    );
  }

  const generators = appSet.spec?.generators ?? [];
  const conditions = appSet.status?.conditions ?? [];

  const headerActions = (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-destructive hover:text-destructive"
      onClick={() => setDeleteOpen(true)}
    >
      <Trash2 className="h-3.5 w-3.5" /> Delete
    </Button>
  );

  return (
    <>
      <Header title={decodedName} actions={headerActions} />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <Link href="/applicationsets" className="hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />
              ApplicationSets
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{decodedName}</span>
          </nav>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="conditions">Conditions ({conditions.length})</TabsTrigger>
              <TabsTrigger value="spec">Spec</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Generators
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {generators.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No generators configured.</p>
                  ) : (
                    <div className="space-y-2">
                      {generators.map((g, i) => {
                        const type = Object.keys(g).filter((k) => k !== "selector")[0] ?? "unknown";
                        return (
                          <div key={i} className="rounded-lg border p-3">
                            <Badge variant="outline" className="mb-2">{type}</Badge>
                            <pre className="text-xs font-mono text-muted-foreground overflow-auto max-h-40">
                              {JSON.stringify(g[type as keyof typeof g], null, 2)}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {appSet.spec?.template && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm">
                    <div className="space-y-1">
                      {appSet.spec.template.spec?.project && (
                        <p><span className="text-muted-foreground">Project:</span> {appSet.spec.template.spec.project}</p>
                      )}
                      {appSet.spec.template.spec?.source?.repoURL && (
                        <p><span className="text-muted-foreground">Repo:</span> <code className="text-xs">{appSet.spec.template.spec.source.repoURL}</code></p>
                      )}
                      {appSet.spec.template.spec?.destination?.server && (
                        <p><span className="text-muted-foreground">Dest:</span> <code className="text-xs">{appSet.spec.template.spec.destination.server}</code></p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="conditions" className="mt-4">
              {conditions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No conditions reported.</p>
              ) : (
                <div className="space-y-2">
                  {conditions.map((c, i) => (
                    <div key={i} className="rounded-lg border p-3 flex items-start gap-3">
                      <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${c.status === "True" ? "text-red-500" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">{c.type}</p>
                        {c.message && <p className="text-xs text-muted-foreground mt-0.5">{c.message}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">Status: {c.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="spec" className="mt-4">
              <div className="h-[500px]">
                <YamlEditor
                  value={JSON.stringify(appSet.spec, null, 2)}
                  readOnly
                  height="100%"
                  language="json"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete ApplicationSet"
        description={`Delete "${decodedName}"? This will also delete all generated applications.`}
        confirmLabel="Delete"
        onConfirm={() => deleteAppSet.mutate({ name: decodedName }, { onSuccess: () => router.push("/applicationsets") })}
        loading={deleteAppSet.isPending}
      />
    </>
  );
}
