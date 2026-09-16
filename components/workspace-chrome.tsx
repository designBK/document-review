"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { ManagerShell } from "@/components/manager-shell";
import { UnderwriterShell } from "@/components/underwriter-shell";
import {
  DASHBOARD_HREF,
  SIGN_OFF_HREF,
  isPathActive,
} from "@/lib/workspace-tabs";

export function WorkspaceChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isPathActive(pathname, DASHBOARD_HREF)) {
    return <DashboardShell>{children}</DashboardShell>;
  }

  if (isPathActive(pathname, SIGN_OFF_HREF)) {
    return <ManagerShell>{children}</ManagerShell>;
  }

  return <UnderwriterShell>{children}</UnderwriterShell>;
}
