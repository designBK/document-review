import { WorkspaceChrome } from "@/components/workspace-chrome";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <WorkspaceChrome>{children}</WorkspaceChrome>;
}
