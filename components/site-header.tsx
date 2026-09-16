"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAppRole } from "@/hooks/use-app-role";
import {
  APP_ROLES,
  DEFAULT_APP_ROLE,
  getAppRoleLabel,
  isAppRole,
  type AppRole,
} from "@/lib/roles";
import {
  SIGN_OFF_HREF,
  getDashboardHref,
  getSignOffHref,
  isPathActive,
} from "@/lib/workspace-tabs";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { roleLabel, setRole, hydrated, role } = useAppRole();
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const selectedRole = hydrated ? role : DEFAULT_APP_ROLE;

  function handleRoleChange(next: AppRole) {
    setRole(next);
    if (next === "manager") {
      router.push(getSignOffHref());
      return;
    }
    if (isPathActive(pathname, SIGN_OFF_HREF)) {
      router.push(getDashboardHref());
    }
  }

  return (
    <header className="w-full">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Badge>Document Review</Badge>

        <div className="flex items-center gap-3">
          <Select
            value={selectedRole}
            onValueChange={(value) => {
              if (isAppRole(value)) handleRoleChange(value);
            }}
          >
            <SelectTrigger
              id="app-role"
              size="sm"
              aria-label="Role"
              className="min-w-32"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {APP_ROLES.map((value) => (
                <SelectItem key={value} value={value}>
                  {getAppRoleLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-medium">Jane Doe</span>
              <span className="text-xs text-muted-foreground">{roleLabel}</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsLoggedIn((loggedIn) => !loggedIn)}
          >
            {isLoggedIn ? "Log out" : "Log in"}
          </Button>
        </div>
      </div>
      <Separator />
    </header>
  );
}
