export const FINDING_TYPES = [
  "missing_field",
  "unclear_field",
  "conflict",
  "stale_document",
  "pack_incomplete",
] as const;

export type FindingType = (typeof FINDING_TYPES)[number];

export const FINDING_TYPE_LABELS: Record<FindingType, string> = {
  missing_field: "Missing field",
  unclear_field: "Unclear field",
  conflict: "Conflict",
  stale_document: "Stale document",
  pack_incomplete: "Pack incomplete",
};

export const FINDING_SEVERITIES = ["blocker", "warning", "info"] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export const FINDING_STATUSES = [
  "open",
  "agreed",
  "disagreed",
  "edited",
] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  open: "Open",
  agreed: "Agreed",
  disagreed: "Disagreed",
  edited: "Edited",
};

export const FINDING_EVIDENCE_KINDS = [
  "observed",
  "expected_locus",
  "absence",
] as const;

export type FindingEvidenceKind = (typeof FINDING_EVIDENCE_KINDS)[number];

export type FindingEvidence = {
  id: string;
  findingId: string;
  documentId: string | null;
  pageNumber: number | null;
  section: string | null;
  kind: FindingEvidenceKind;
  snippet: string;
  createdAt: string;
};

/** Build a compact citation: `Doc · p.3 · Section — snippet`. */
export function formatEvidenceCitation(
  evidence: Pick<
    FindingEvidence,
    "pageNumber" | "section" | "kind" | "snippet"
  >,
  documentLabel: string | null
): string {
  const parts: string[] = [];
  if (documentLabel) parts.push(documentLabel);
  if (evidence.pageNumber != null) parts.push(`p.${evidence.pageNumber}`);
  if (evidence.section) parts.push(evidence.section);

  const locus = parts.join(" · ");
  if (!locus) return evidence.snippet;
  if (evidence.kind === "absence" && !evidence.snippet.toLowerCase().includes("not found")) {
    return `${locus} — not found. ${evidence.snippet}`;
  }
  return `${locus} — ${evidence.snippet}`;
}

export function resolveEvidenceDocumentLabel(
  evidence: Pick<FindingEvidence, "documentId" | "kind">,
  documentNameById: Map<string, string>
): string | null {
  if (evidence.documentId) {
    return documentNameById.get(evidence.documentId) ?? null;
  }
  if (evidence.kind === "absence") return "Packet";
  return null;
}

export type Finding = {
  id: string;
  reviewId: string;
  analysisRunId: string;
  type: FindingType;
  severity: FindingSeverity;
  status: FindingStatus;
  fieldKey: string | null;
  title: string;
  summary: string;
  suggestedAction: string | null;
  expectedValue: string | null;
  observedValues: string[];
  confidence: number | null;
  disagreementReason: string | null;
  evidence: FindingEvidence[];
  createdAt: string;
  updatedAt: string;
};

export type AnalysisRun = {
  id: string;
  reviewId: string;
  provider: "stub" | "llm";
  status: "pending" | "completed" | "failed";
  summary: string | null;
  startedAt: string;
  completedAt: string | null;
};

export function getFindingTypeLabel(type: FindingType) {
  return FINDING_TYPE_LABELS[type] ?? type;
}

export function getFindingStatusLabel(status: FindingStatus) {
  return FINDING_STATUS_LABELS[status] ?? status;
}

export function getFindingSeverityBadgeVariant(
  severity: FindingSeverity
): "destructive" | "outline" | "secondary" {
  if (severity === "blocker") return "destructive";
  if (severity === "warning") return "outline";
  return "secondary";
}
