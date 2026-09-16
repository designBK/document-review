import type { Metadata } from "next";
import { SignOffBoard } from "./sign-off-board";

export const metadata: Metadata = {
  title: "Sign Off",
};

export default function SignOffPage() {
  return <SignOffBoard />;
}
