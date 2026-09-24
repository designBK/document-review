import type {
  AnalysisRun,
  Finding,
  FindingEvidence,
  FindingEvidenceKind,
  FindingSeverity,
  FindingStatus,
  FindingType,
} from "@/lib/findings";

type EvidenceRow = {
  id: string;
  finding_id: string;
  document_id: string | null;
  page_number: number | null;
  section?: string | null;
  kind?: FindingEvidenceKind | null;
  snippet: string;
  created_at: string;
};

type FindingRow = {
  id: string;
  review_id: string;
  analysis_run_id: string;
  type: FindingType;
  severity: FindingSeverity;
  status: FindingStatus;
  field_key: string | null;
  title: string;
  summary: string;
  suggested_action: string | null;
  expected_value: string | null;
  observed_values: string[] | null;
  confidence: number | null;
  disagreement_reason: string | null;
  created_at: string;
  updated_at: string;
  finding_evidence?: EvidenceRow[] | null;
};

type AnalysisRunRow = {
  id: string;
  review_id: string;
  provider: "stub" | "llm";
  status: "pending" | "completed" | "failed";
  summary: string | null;
  started_at: string;
  completed_at: string | null;
};

export function mapEvidence(row: EvidenceRow): FindingEvidence {
  return {
    id: row.id,
    findingId: row.finding_id,
    documentId: row.document_id,
    pageNumber: row.page_number,
    section: row.section ?? null,
    kind: row.kind ?? "observed",
    snippet: row.snippet,
    createdAt: row.created_at,
  };
}

export function mapFinding(row: FindingRow): Finding {
  return {
    id: row.id,
    reviewId: row.review_id,
    analysisRunId: row.analysis_run_id,
    type: row.type,
    severity: row.severity,
    status: row.status,
    fieldKey: row.field_key,
    title: row.title,
    summary: row.summary,
    suggestedAction: row.suggested_action,
    expectedValue: row.expected_value,
    observedValues: row.observed_values ?? [],
    confidence: row.confidence,
    disagreementReason: row.disagreement_reason ?? null,
    evidence: (row.finding_evidence ?? []).map(mapEvidence),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAnalysisRun(row: AnalysisRunRow): AnalysisRun {
  return {
    id: row.id,
    reviewId: row.review_id,
    provider: row.provider,
    status: row.status,
    summary: row.summary,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}
