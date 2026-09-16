import type { Metadata } from "next";
import { SignOffBoard } from "./sign-off-board";

export const metadata: Metadata = {
  title: "Sign Off",
};

export default function SignOffPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Sign Off</h2>
        <p className="text-sm text-muted-foreground">
          Manager queue for ready and deny decisions. Approving sends the
          deferred client notification (stub email).
        </p>
      </div>
      <SignOffBoard />
    </div>
  );
}
