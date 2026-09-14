import { QueueShell } from "@/components/queue-shell";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <QueueShell>{children}</QueueShell>;
}
