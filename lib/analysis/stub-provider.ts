import type { Review, ReviewDocument } from "@/lib/reviews";
import type {
  FindingEvidenceKind,
  FindingSeverity,
  FindingType,
} from "@/lib/findings";
import {
  CHECKLIST_FIELDS,
  EXPECTED_DOCUMENTS,
  detectDocumentKind,
  type ExpectedDocumentKind,
  type FieldKey,
} from "@/lib/underwriting/checklist";

export type StubEvidenceDraft = {
  documentId: string | null;
  pageNumber: number | null;
  section: string | null;
  kind: FindingEvidenceKind;
  snippet: string;
};

export type StubFindingDraft = {
  type: FindingType;
  severity: FindingSeverity;
  fieldKey: FieldKey | null;
  title: string;
  summary: string;
  suggestedAction: string;
  expectedValue: string | null;
  observedValues: string[];
  confidence: number;
  evidence: StubEvidenceDraft[];
};

function docsByKind(documents: ReviewDocument[]) {
  const map = new Map<ExpectedDocumentKind, ReviewDocument[]>();
  for (const document of documents) {
    const kind = detectDocumentKind(document.fileName);
    if (!kind) continue;
    const current = map.get(kind) ?? [];
    current.push(document);
    map.set(kind, current);
  }
  return map;
}

/**
 * Deterministic POC analyzer. Produces believable findings from packet
 * composition and filenames so the HITL UX can be demoed without an LLM.
 * Evidence follows the insight contract: observed | expected_locus | absence.
 */
export function runStubAnalysis(review: Review): StubFindingDraft[] {
  const findings: StubFindingDraft[] = [];
  const byKind = docsByKind(review.documents);
  const allDocs = review.documents;

  for (const expected of EXPECTED_DOCUMENTS) {
    if (!byKind.has(expected.kind)) {
      findings.push({
        type: "pack_incomplete",
        severity: expected.kind === "financials" ? "warning" : "blocker",
        fieldKey: null,
        title: `Missing ${expected.label.toLowerCase()}`,
        summary: `No ${expected.label.toLowerCase()} was detected in the uploaded packet for ${review.businessName}.`,
        suggestedAction: `Request an updated ${expected.label.toLowerCase()} from the client and re-run analysis.`,
        expectedValue: expected.label,
        observedValues: [],
        confidence: 0.92,
        evidence: [
          {
            documentId: null,
            pageNumber: null,
            section: expected.label,
            kind: "absence",
            snippet: `No uploaded filename matched expected kind "${expected.kind}".`,
          },
        ],
      });
    }
  }

  const application = byKind.get("application")?.[0];
  const acord = byKind.get("acord")?.[0];
  const lossRun = byKind.get("loss_run")?.[0];

  if (!application && allDocs[0]) {
    findings.push({
      type: "missing_field",
      severity: "blocker",
      fieldKey: "named_insured",
      title: "Named insured not confirmed",
      summary:
        "Without an application document, the named insured cannot be verified against the submission.",
      suggestedAction: "Upload the signed application before continuing review.",
      expectedValue: review.businessName,
      observedValues: [],
      confidence: 0.8,
      evidence: [
        {
          documentId: allDocs[0].id,
          pageNumber: null,
          section: "Named insured",
          kind: "expected_locus",
          snippet: `Looked for an application; closest file was "${allDocs[0].fileName}" (not classified as application).`,
        },
      ],
    });
  }

  if (application && acord) {
    findings.push({
      type: "conflict",
      severity: "blocker",
      fieldKey: "named_insured",
      title: "Named insured may conflict across documents",
      summary: `Application (${application.fileName}) and ACORD (${acord.fileName}) should be checked for legal name consistency with "${review.businessName}".`,
      suggestedAction:
        "Confirm legal named insured matches on application and ACORD; request correction if DBAs differ.",
      expectedValue: review.businessName,
      observedValues: [application.fileName, acord.fileName],
      confidence: 0.74,
      evidence: [
        {
          documentId: application.id,
          pageNumber: 1,
          section: "Named insured",
          kind: "observed",
          snippet: `Applicant / named insured block on ${application.fileName}.`,
        },
        {
          documentId: acord.id,
          pageNumber: 1,
          section: "Named insured",
          kind: "observed",
          snippet: `First named insured field on ${acord.fileName}.`,
        },
      ],
    });
  }

  if (application) {
    findings.push({
      type: "unclear_field",
      severity: "warning",
      fieldKey: "occurrence_limit",
      title: "Occurrence limit needs confirmation",
      summary:
        "Stub analysis flagged occurrence limit as present but not confidently extracted for underwriting sign-off.",
      suggestedAction: "Verify occurrence limit on the application declarations section.",
      expectedValue: null,
      observedValues: ["unconfirmed"],
      confidence: 0.61,
      evidence: [
        {
          documentId: application.id,
          pageNumber: 2,
          section: "Limits / occurrence",
          kind: "expected_locus",
          snippet: `Declarations / limits section in ${application.fileName}; value not confidently extracted.`,
        },
      ],
    });
  }

  if (lossRun) {
    findings.push({
      type: "stale_document",
      severity: "warning",
      fieldKey: "loss_history",
      title: "Loss run freshness should be verified",
      summary: `Loss run file "${lossRun.fileName}" was found. Confirm valuation date is within underwriting guidelines.`,
      suggestedAction: "Confirm loss run is dated within the last 90 days; request refresh if older.",
      expectedValue: "Loss run ≤ 90 days old",
      observedValues: [lossRun.fileName],
      confidence: 0.7,
      evidence: [
        {
          documentId: lossRun.id,
          pageNumber: 1,
          section: "Valuation / as-of date",
          kind: "expected_locus",
          snippet: `Header / valuation date area on ${lossRun.fileName}; confirm age ≤ 90 days.`,
        },
      ],
    });
  }

  const coveredKeys = new Set(
    findings.map((finding) => finding.fieldKey).filter(Boolean)
  );
  for (const field of CHECKLIST_FIELDS.filter((item) => item.required)) {
    if (coveredKeys.has(field.key)) continue;
    if (field.key === "loss_history" && lossRun) continue;
    if (
      (field.key === "named_insured" ||
        field.key === "effective_date" ||
        field.key === "fein") &&
      application
    ) {
      // Assume stub "found" these on application unless already conflicted.
      continue;
    }

    if (!application && !acord) {
      findings.push({
        type: "missing_field",
        severity: "blocker",
        fieldKey: field.key,
        title: `${field.label} missing`,
        summary: `${field.description} No primary application/ACORD source was available to satisfy this check.`,
        suggestedAction: `Provide application/ACORD containing ${field.label.toLowerCase()}.`,
        expectedValue: field.label,
        observedValues: [],
        confidence: 0.88,
        evidence: [
          {
            documentId: allDocs[0]?.id ?? null,
            pageNumber: null,
            section: field.label,
            kind: "absence",
            snippet: `No application or ACORD available to satisfy checklist field "${field.key}".`,
          },
        ],
      });
    }
  }

  if (findings.length === 0 && allDocs.length > 0) {
    findings.push({
      type: "unclear_field",
      severity: "info",
      fieldKey: "named_insured",
      title: "Packet ready for manual spot-check",
      summary:
        "Stub analysis did not detect pack gaps from filenames. Underwriter should still spot-check core identity and limits.",
      suggestedAction: "Spot-check named insured, dates, and limits, then mark findings accordingly.",
      expectedValue: review.businessName,
      observedValues: allDocs.map((doc) => doc.fileName),
      confidence: 0.55,
      evidence: allDocs.slice(0, 2).map((doc) => ({
        documentId: doc.id,
        pageNumber: 1,
        section: "Packet overview",
        kind: "observed" as const,
        snippet: `Included in packet: ${doc.fileName}`,
      })),
    });
  }

  return findings;
}
