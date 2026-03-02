"use client";

import { useVersion, useUserInfo } from "@/hooks/argocd/use-misc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Tag } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  const { data: version } = useVersion();
  const { data: userInfo } = useUserInfo();

  const initials = userInfo?.username
    ? userInfo.username.slice(0, 2).toUpperCase()
    : "FB";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold truncate">{title}</h1>
          {description && (
            <span className="hidden sm:block text-sm text-muted-foreground truncate">
              — {description}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {version?.Version && (
          <Badge variant="outline" className="hidden md:flex gap-1 text-xs">
            <Tag className="h-3 w-3" />
            {version.Version}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-0.5">
                <span className="font-medium">{userInfo?.username ?? "User"}</span>
                {userInfo?.groups && userInfo.groups.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {userInfo.groups[0]}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/user-info" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                User Info
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-muted-foreground">
              Authentication is managed through your Argo CD session.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
