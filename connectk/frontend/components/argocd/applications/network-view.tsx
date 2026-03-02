"use client";

import { type ResourceStatus } from "@/lib/argocd-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthBadge } from "./status-badges";
import { Globe, Server, Network } from "lucide-react";

interface NetworkViewProps {
  resources: ResourceStatus[];
}

export function NetworkView({ resources }: NetworkViewProps) {
  const ingresses = resources.filter((r) => r.kind === "Ingress");
  const services = resources.filter((r) => r.kind === "Service");
  const endpoints = resources.filter((r) => r.kind === "Endpoints" || r.kind === "EndpointSlice");

  if (ingresses.length === 0 && services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
        <p>No networking resources found for this application.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ingresses */}
      {ingresses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Ingresses ({ingresses.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ingresses.map((ing) => (
              <Card key={`${ing.namespace}/${ing.name}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="font-mono">{ing.name}</span>
                    <HealthBadge status={ing.health?.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  {ing.namespace && <span>Namespace: {ing.namespace}</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {services.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Server className="h-4 w-4" />
            Services ({services.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((svc) => (
              <Card key={`${svc.namespace}/${svc.name}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="font-mono">{svc.name}</span>
                    <HealthBadge status={svc.health?.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  {svc.namespace && <span>Namespace: {svc.namespace}</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Endpoints */}
      {endpoints.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Network className="h-4 w-4" />
            Endpoints ({endpoints.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {endpoints.map((ep) => (
              <Card key={`${ep.namespace}/${ep.name}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="font-mono">{ep.name}</span>
                    <HealthBadge status={ep.health?.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  {ep.namespace && <span>Namespace: {ep.namespace}</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
