"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProject, useProjectEvents } from "@/hooks/argocd/use-projects";
import { Header } from "@/components/argocd/layout/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { GitBranch, Server, Shield, Users, Pencil, ChevronLeft } from "lucide-react";
import { formatDate } from "@/lib/argocd-utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ProjectEditPanel } from "@/components/argocd/settings/project-edit-panel";
import Link from "next/link";

export default function ProjectDetailPage() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name);
  const { data: project, isLoading } = useProject(decodedName);
  const { data: events } = useProjectEvents(decodedName);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <><Header title="Loading..." /><DetailSkeleton /></>;
  if (!project) return <><Header title="Project" /><p className="p-6 text-destructive">Not found.</p></>;

  const spec = project.spec;

  const headerActions = (
    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
      <Pencil className="h-3.5 w-3.5" />
      Edit
    </Button>
  );

  return (
    <>
      <Header title={decodedName} description="Project details" actions={headerActions} />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/argocd-settings/projects" className="hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" /> Projects
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{decodedName}</span>
          </nav>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="roles">Roles ({spec.roles?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="windows">Sync Windows ({spec.syncWindows?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {spec.description && (
                <p className="text-sm text-muted-foreground">{spec.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <GitBranch className="h-4 w-4" /> Allowed Source Repos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {spec.sourceRepos && spec.sourceRepos.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {spec.sourceRepos.map((r) => (
                          <Badge key={r} variant={r === "*" ? "default" : "outline"} className="font-mono text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">None</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="h-4 w-4" /> Allowed Destinations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {spec.destinations && spec.destinations.length > 0 ? (
                      <div className="space-y-1">
                        {spec.destinations.map((d, i) => (
                          <div key={i} className="text-xs font-mono text-muted-foreground">
                            {d.namespace ?? "*"} @ {d.server ?? d.name ?? "*"}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">None</p>}
                  </CardContent>
                </Card>

                {spec.clusterResourceWhitelist && spec.clusterResourceWhitelist.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Cluster Resource Whitelist
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {spec.clusterResourceWhitelist.map((r) => (
                          <Badge key={`${r.group}/${r.kind}`} variant="secondary" className="text-xs">
                            {r.group}/{r.kind}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="roles" className="mt-4">
              {spec.roles && spec.roles.length > 0 ? (
                <div className="space-y-3">
                  {spec.roles.map((role) => (
                    <Card key={role.name}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4" /> {role.name}
                          {role.description && (
                            <span className="font-normal text-muted-foreground">— {role.description}</span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {role.groups && role.groups.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Groups</p>
                            <div className="flex flex-wrap gap-1">
                              {role.groups.map((g) => <Badge key={g} variant="outline" className="text-xs">{g}</Badge>)}
                            </div>
                          </div>
                        )}
                        {role.policies && role.policies.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Policies</p>
                            <div className="space-y-0.5">
                              {role.policies.map((p, i) => (
                                <code key={i} className="block text-xs font-mono text-muted-foreground">{p}</code>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground mt-4">No roles defined.</p>}
            </TabsContent>

            <TabsContent value="windows" className="mt-4">
              {spec.syncWindows && spec.syncWindows.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>Kind</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Manual Sync</TableHead>
                        <TableHead>Applies To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spec.syncWindows.map((w, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Badge
                              variant={w.kind === "allow" ? "default" : "destructive"}
                              className="text-xs capitalize"
                            >
                              {w.kind ?? "allow"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{w.schedule ?? "—"}</TableCell>
                          <TableCell className="text-sm">{w.duration ?? "—"}</TableCell>
                          <TableCell className="text-sm">{w.manualSync ? "Allowed" : "Denied"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {[
                              ...(w.applications ?? []).map((a) => `App: ${a}`),
                              ...(w.namespaces ?? []).map((n) => `NS: ${n}`),
                              ...(w.clusters ?? []).map((c) => `Cluster: ${c}`),
                            ].join(", ") || "All"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : <p className="text-sm text-muted-foreground mt-4">No sync windows configured.</p>}
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              {events && events.items.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Last Seen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.items.map((evt) => (
                        <TableRow key={evt.metadata.name}>
                          <TableCell>
                            <Badge variant={evt.type === "Warning" ? "destructive" : "secondary"} className="text-xs">
                              {evt.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{evt.reason}</TableCell>
                          <TableCell className="text-sm max-w-[300px] truncate">{evt.message}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {evt.lastTimestamp ? formatDate(evt.lastTimestamp) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : <p className="text-sm text-muted-foreground mt-4">No events recorded.</p>}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <ProjectEditPanel project={project} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
