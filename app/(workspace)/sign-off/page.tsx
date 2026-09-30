import { Suspense } from "react";
import type { Metadata } from "next";
import { SignOffBoard } from "./sign-off-board";

export const metadata: Metadata = {
  title: "Sign Off",
};

export default function SignOffPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading sign-off…</p>
      }
    >
      <SignOffBoard />
    </Suspense>
  );
}
