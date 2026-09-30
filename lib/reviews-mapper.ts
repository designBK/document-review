import type { Review, ReviewDocument, ReviewStatus } from "@/lib/reviews";

type DocumentRow = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
};

type DispositionReturnRow = {
  return_reason: string | null;
  created_at: string;
};

type ReviewRow = {
  id: string;
  business_name: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  documents?: DocumentRow[] | null;
  review_dispositions?: DispositionReturnRow[] | DispositionReturnRow | null;
};

function latestReturnReason(row: ReviewRow) {
  if (row.status !== "returned_for_review") return null;
  const dispositions = Array.isArray(row.review_dispositions)
    ? row.review_dispositions
    : row.review_dispositions
      ? [row.review_dispositions]
      : [];
  const latest = [...dispositions].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at))
  )[0];
  const reason = latest?.return_reason?.trim();
  return reason ? reason : null;
}

export function mapDocument(row: DocumentRow): ReviewDocument {
  return {
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  };
}

export function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    businessName: row.business_name,
    status: row.status,
    documents: (row.documents ?? []).map(mapDocument),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    returnReason: latestReturnReason(row),
  };
}
