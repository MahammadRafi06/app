import Link from "next/link";
import { Header } from "@/components/argocd/layout/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GitBranch,
  KeyRound,
  Server,
  FolderOpen,
  Lock,
  Users,
} from "lucide-react";

const sections = [
  {
    href: "/argocd-settings/repositories",
    title: "Repositories",
    description: "Manage Git and Helm sources connected to ArgoCD.",
    icon: GitBranch,
  },
  {
    href: "/argocd-settings/repocreds",
    title: "Repository Credentials",
    description: "Credential templates that match repositories by URL prefix.",
    icon: Lock,
  },
  {
    href: "/argocd-settings/clusters",
    title: "Clusters",
    description: "Inspect registered Kubernetes clusters and connection health.",
    icon: Server,
  },
  {
    href: "/argocd-settings/projects",
    title: "Projects",
    description: "Review project policies, destinations, roles, and sync windows.",
    icon: FolderOpen,
  },
  {
    href: "/argocd-settings/accounts",
    title: "Accounts",
    description: "Manage user accounts, API tokens, and passwords.",
    icon: Users,
  },
  {
    href: "/argocd-settings/gpgkeys",
    title: "GPG Keys",
    description: "Manage GPG verification keys available to the backend.",
    icon: KeyRound,
  },
];

export default function SettingsPage() {
  return (
    <>
      <Header
        title="ArgoCD Settings"
        description="Operational configuration and connected-system inventory"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.href} href={section.href}>
                  <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className="h-4 w-4" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-muted-foreground">
                      {section.description}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
