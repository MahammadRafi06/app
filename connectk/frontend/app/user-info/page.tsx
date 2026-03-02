"use client";

import { useUserInfo, useVersion } from "@/hooks/argocd/use-misc";
import { Header } from "@/components/argocd/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Tag,
  Shield,
  Server,
} from "lucide-react";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2">
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}

export default function UserInfoPage() {
  const { data: userInfo, isLoading: userLoading } = useUserInfo();
  const { data: version, isLoading: versionLoading } = useVersion();

  return (
    <>
      <Header title="ArgoCD User Info" description="Current session and system information" />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4 max-w-2xl">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> Current User
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 divide-y">
              {userLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ) : (
                <>
                  <InfoRow label="Username">
                    <span className="font-medium">{userInfo?.username ?? "—"}</span>
                  </InfoRow>
                  <InfoRow label="Status">
                    <Badge variant={userInfo?.loggedIn ? "default" : "secondary"}>
                      {userInfo?.loggedIn ? "Logged In" : "Not Logged In"}
                    </Badge>
                  </InfoRow>
                  {userInfo?.iss && (
                    <InfoRow label="Issuer">
                      <span className="font-mono text-xs text-muted-foreground">{userInfo.iss}</span>
                    </InfoRow>
                  )}
                  {userInfo?.groups && userInfo.groups.length > 0 && (
                    <InfoRow label="Groups">
                      <div className="flex flex-wrap gap-1">
                        {userInfo.groups.map((g) => (
                          <Badge key={g} variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </InfoRow>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="h-4 w-4" /> ArgoCD Version
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 divide-y">
              {versionLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : version ? (
                <>
                  {version.Version && (
                    <InfoRow label="Version">
                      <Badge variant="outline" className="font-mono text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {version.Version}
                      </Badge>
                    </InfoRow>
                  )}
                  {version.GitCommit && (
                    <InfoRow label="Git Commit">
                      <code className="text-xs font-mono text-muted-foreground">
                        {version.GitCommit.slice(0, 12)}
                      </code>
                    </InfoRow>
                  )}
                  {version.BuildDate && (
                    <InfoRow label="Build Date">
                      <span className="text-xs text-muted-foreground">
                        {version.BuildDate}
                      </span>
                    </InfoRow>
                  )}
                  {version.GoVersion && (
                    <InfoRow label="Go Version">
                      <code className="text-xs font-mono text-muted-foreground">
                        {version.GoVersion}
                      </code>
                    </InfoRow>
                  )}
                  {version.Platform && (
                    <InfoRow label="Platform">
                      <code className="text-xs font-mono text-muted-foreground">
                        {version.Platform}
                      </code>
                    </InfoRow>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  Could not reach the ArgoCD backend.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
}
