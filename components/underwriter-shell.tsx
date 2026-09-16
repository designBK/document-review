"use client";

import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  WorkspaceFrame,
  WorkspaceHeading,
} from "@/components/workspace-frame";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UNDERWRITER_TABS,
  getUnderwriterTabByValue,
  getUnderwriterTabFromPathname,
} from "@/lib/workspace-tabs";

export function UnderwriterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getUnderwriterTabFromPathname(pathname);
  const routerReadyRef = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    routerReadyRef.current = true;
  }, []);

  return (
    <WorkspaceFrame>
      <WorkspaceHeading
        title="Underwriting workspace"
        description="Review AI findings, then hand packets to readiness or manager sign-off."
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (!routerReadyRef.current) return;
          const tab = getUnderwriterTabByValue(value);
          if (!tab || tab.href === pathname) return;
          startTransition(() => {
            router.push(tab.href);
          });
        }}
        className="w-full gap-4"
      >
        <TabsList className="w-full">
          {UNDERWRITER_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex-1">{children}</div>
    </WorkspaceFrame>
  );
}
