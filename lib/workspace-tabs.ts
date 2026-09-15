export const WORKSPACE_TABS = [
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

export type WorkspaceTabValue = (typeof WORKSPACE_TABS)[number]["value"];

export function getWorkspaceTabFromPathname(pathname: string): WorkspaceTabValue {
  const match = WORKSPACE_TABS.find(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)
  );
  return match?.value ?? "document-queue";
}

export function getWorkspaceTabByValue(value: string) {
  return WORKSPACE_TABS.find((tab) => tab.value === value);
}
