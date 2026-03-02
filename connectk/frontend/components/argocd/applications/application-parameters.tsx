"use client";

import { type Application } from "@/lib/argocd-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitBranch, Container, Settings2 } from "lucide-react";

interface ApplicationParametersProps {
  app: Application;
}

export function ApplicationParameters({ app }: ApplicationParametersProps) {
  const source = app.spec.source ?? app.spec.sources?.[0];
  const sources = app.spec.sources ?? (app.spec.source ? [app.spec.source] : []);

  if (!source && sources.length === 0) {
    return <p className="text-muted-foreground text-sm">No source configured.</p>;
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-4">
        {sources.map((src, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                {sources.length > 1 ? `Source ${idx + 1}` : "Source"}
                {src.chart && (
                  <Badge variant="outline" className="text-xs ml-1">Helm</Badge>
                )}
                {src.path && !src.chart && (
                  <Badge variant="outline" className="text-xs ml-1">
                    {src.directory?.recurse ? "Directory" : "Git"}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Row label="Repository">{src.repoURL}</Row>
              {src.targetRevision && <Row label="Revision">{src.targetRevision}</Row>}
              {src.path && <Row label="Path">{src.path}</Row>}
              {src.chart && <Row label="Chart">{src.chart}</Row>}
              {src.ref && <Row label="Ref">{src.ref}</Row>}

              {/* Helm */}
              {src.helm && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Helm</p>
                  {src.helm.releaseName && <Row label="Release Name">{src.helm.releaseName}</Row>}
                  {src.helm.version && <Row label="Chart Version">{src.helm.version}</Row>}
                  {src.helm.valueFiles && src.helm.valueFiles.length > 0 && (
                    <Row label="Value Files">
                      <div className="flex flex-wrap gap-1">
                        {src.helm.valueFiles.map((f) => (
                          <Badge key={f} variant="secondary" className="font-mono text-[10px]">{f}</Badge>
                        ))}
                      </div>
                    </Row>
                  )}
                  {src.helm.parameters && src.helm.parameters.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Parameters</p>
                      <div className="divide-y rounded border">
                        {src.helm.parameters.map((p) => (
                          <div key={p.name} className="flex gap-3 px-3 py-1.5 text-xs">
                            <code className="w-48 shrink-0 text-muted-foreground">{p.name}</code>
                            <code className="truncate">{p.value}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {src.helm.values && (
                    <Row label="Inline Values">
                      <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-32">
                        {src.helm.values}
                      </pre>
                    </Row>
                  )}
                </div>
              )}

              {/* Kustomize */}
              {src.kustomize && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kustomize</p>
                  {src.kustomize.version && <Row label="Version">{src.kustomize.version}</Row>}
                  {src.kustomize.namePrefix && <Row label="Name Prefix">{src.kustomize.namePrefix}</Row>}
                  {src.kustomize.nameSuffix && <Row label="Name Suffix">{src.kustomize.nameSuffix}</Row>}
                  {src.kustomize.images && src.kustomize.images.length > 0 && (
                    <Row label="Images">
                      <div className="flex flex-col gap-0.5">
                        {src.kustomize.images.map((img) => (
                          <div key={img} className="flex items-center gap-1 text-xs">
                            <Container className="h-3 w-3 text-muted-foreground" />
                            <code>{img}</code>
                          </div>
                        ))}
                      </div>
                    </Row>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* App info */}
        {app.spec.info && app.spec.info.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y rounded border">
                {app.spec.info.map((item) => (
                  <div key={item.name} className="flex gap-3 px-3 py-2 text-sm">
                    <span className="w-40 shrink-0 text-muted-foreground">{item.name}</span>
                    <span className="font-mono text-xs break-all">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 min-w-0 font-mono text-xs">{children}</div>
    </div>
  );
}
