export const DASHBOARD_HREF = "/document-queue";
export const DOCUMENT_REVIEW_HREF = "/document-review";
export const DOCUMENT_READINESS_HREF = "/document-readiness";
export const SIGN_OFF_HREF = "/sign-off";

export const UNDERWRITER_TABS = [
  {
    value: "document-review",
    label: "Document Review",
    href: DOCUMENT_REVIEW_HREF,
  },
  {
    value: "document-readiness",
    label: "Document Readiness",
    href: DOCUMENT_READINESS_HREF,
  },
] as const;

export type UnderwriterTabValue = (typeof UNDERWRITER_TABS)[number]["value"];

export type ReadinessNotice = "sent-to-sign-off" | "awaiting-client";

export function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getUnderwriterTabFromPathname(
  pathname: string
): UnderwriterTabValue {
  const match = UNDERWRITER_TABS.find((tab) => isPathActive(pathname, tab.href));
  return match?.value ?? "document-review";
}

export function getUnderwriterTabByValue(value: string) {
  return UNDERWRITER_TABS.find((tab) => tab.value === value);
}

export function getDocumentReviewHref(reviewId: string) {
  return `${DOCUMENT_REVIEW_HREF}?review=${encodeURIComponent(reviewId)}`;
}

export function getDocumentReadinessHref(options?: {
  notice?: ReadinessNotice;
}) {
  if (!options?.notice) return DOCUMENT_READINESS_HREF;
  const params = new URLSearchParams({ notice: options.notice });
  return `${DOCUMENT_READINESS_HREF}?${params.toString()}`;
}

export function getSignOffHref() {
  return SIGN_OFF_HREF;
}

export function getDashboardHref() {
  return DASHBOARD_HREF;
}
