export type ReviewStatus = "new";

export type CachedDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  file: File;
};

export type Review = {
  id: string;
  businessName: string;
  status: ReviewStatus;
  documents: CachedDocument[];
  createdAt: string;
};

export const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.odt,.ods,.odp";

export const DOCUMENT_ACCEPT_LABEL =
  "PDF, Word, Excel, PowerPoint, text, CSV, or OpenDocument";
