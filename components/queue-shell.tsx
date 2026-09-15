"use client";

import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NewReviewDialog } from "@/components/new-review-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  WORKSPACE_TABS,
  getWorkspaceTabByValue,
  getWorkspaceTabFromPathname,
} from "@/lib/workspace-tabs";

export function QueueShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getWorkspaceTabFromPathname(pathname);
  const routerReadyRef = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    routerReadyRef.current = true;
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Document Review Queue
        </h1>
        <NewReviewDialog />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (!routerReadyRef.current) return;
          const tab = getWorkspaceTabByValue(value);
          if (!tab || tab.href === pathname) return;
          startTransition(() => {
            router.push(tab.href);
          });
        }}
        className="w-full gap-4"
      >
        <TabsList className="w-full">
          {WORKSPACE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex-1">{children}</div>
    </div>
  );
}
