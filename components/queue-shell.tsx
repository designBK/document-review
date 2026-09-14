"use client";

import { usePathname, useRouter } from "next/navigation";
import { NewReviewDialog } from "@/components/new-review-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "document-queue", label: "Document Queue", href: "/document-queue" },
  {
    value: "document-review",
    label: "Document Review",
    href: "/document-review",
  },
  {
    value: "document-readiness",
    label: "Document Readiness",
    href: "/document-readiness",
  },
  { value: "sign-off", label: "Sign Off", href: "/sign-off" },
] as const;

function tabFromPathname(pathname: string) {
  const match = TABS.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`));
  return match?.value ?? "document-queue";
}

export function QueueShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = tabFromPathname(pathname);

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
          const tab = TABS.find((item) => item.value === value);
          if (tab && tab.href !== pathname) {
            router.push(tab.href);
          }
        }}
        className="w-full gap-4"
      >
        <TabsList className="w-full">
          {TABS.map((tab) => (
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
