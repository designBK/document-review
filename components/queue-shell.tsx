"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function QueueShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Document Review Queue
        </h1>
        <Button>New review</Button>
      </div>

      <Tabs defaultValue="document-queue" className="w-full gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="document-queue">Document Queue</TabsTrigger>
          <TabsTrigger value="document-review">Document Review</TabsTrigger>
          <TabsTrigger value="document-readiness">Document Readiness</TabsTrigger>
          <TabsTrigger value="sign-off">Sign Off</TabsTrigger>
        </TabsList>
        <TabsContent value="document-queue">{children}</TabsContent>
        <TabsContent value="document-review">
          <p className="text-muted-foreground">Document Review content</p>
        </TabsContent>
        <TabsContent value="document-readiness">
          <p className="text-muted-foreground">Document Readiness content</p>
        </TabsContent>
        <TabsContent value="sign-off">
          <p className="text-muted-foreground">Sign Off content</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
