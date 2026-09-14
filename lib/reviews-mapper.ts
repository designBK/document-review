import type { Review, ReviewDocument, ReviewStatus } from "@/lib/reviews";

type DocumentRow = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
};

type ReviewRow = {
  id: string;
  business_name: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  documents?: DocumentRow[] | null;
};

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
  };
}
