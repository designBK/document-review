import type { Finding, FindingType } from "@/lib/findings";
import { getFindingTypeLabel } from "@/lib/findings";
import type { Review } from "@/lib/reviews";
import {
  CHECKLIST_FIELDS,
  detectDocumentKind,
  type ChecklistField,
} from "@/lib/underwriting/checklist";

export type CompletenessStatus =
  | FindingType
  | "accepted"
  | "clear"
  | "unknown";

export type CompletenessRow = {
  field: ChecklistField;
  status: CompletenessStatus;
};

const ISSUE_TYPES: FindingType[] = [
  "missing_field",
  "unclear_field",
  "conflict",
];

export function buildCompletenessRows(
  review: Review | null,
  findings: Finding[]
): CompletenessRow[] {
  if (!review) return [];

  const presentKinds = new Set(
    review.documents
      .map((doc) => detectDocumentKind(doc.fileName))
      .filter((kind): kind is NonNullable<typeof kind> => Boolean(kind))
  );

  return CHECKLIST_FIELDS.map((field) => {
    const related = findings.filter((finding) => finding.fieldKey === field.key);
    const openIssue = related.find(
      (finding) =>
        finding.status === "open" && ISSUE_TYPES.includes(finding.type)
    );

    const status: CompletenessStatus = openIssue
      ? openIssue.type
      : related.some((finding) => finding.status === "accepted")
        ? "accepted"
        : presentKinds.size > 0
          ? "clear"
          : "unknown";

    return { field, status };
  });
}

export function getCompletenessStatusLabel(status: CompletenessStatus) {
  switch (status) {
    case "clear":
      return "Clear";
    case "accepted":
      return "Accepted";
    case "unknown":
      return "Not analyzed";
    default:
      return getFindingTypeLabel(status);
  }
}
