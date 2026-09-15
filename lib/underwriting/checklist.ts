export const LINE_OF_BUSINESS = "commercial_package" as const;

export type FieldKey =
  | "named_insured"
  | "mailing_address"
  | "effective_date"
  | "expiration_date"
  | "occurrence_limit"
  | "aggregate_limit"
  | "deductible"
  | "fein"
  | "locations"
  | "loss_history";

export type ExpectedDocumentKind =
  | "application"
  | "acord"
  | "loss_run"
  | "financials";

export type ChecklistField = {
  key: FieldKey;
  label: string;
  required: boolean;
  description: string;
};

export type ExpectedDocument = {
  kind: ExpectedDocumentKind;
  label: string;
  filenameHints: string[];
};

/** v1 underwriting packet checklist for a commercial package submission. */
export const CHECKLIST_FIELDS: ChecklistField[] = [
  {
    key: "named_insured",
    label: "Named insured",
    required: true,
    description: "Legal named insured must be present and consistent.",
  },
  {
    key: "mailing_address",
    label: "Mailing address",
    required: true,
    description: "Primary mailing / notice address.",
  },
  {
    key: "effective_date",
    label: "Effective date",
    required: true,
    description: "Requested or bound policy effective date.",
  },
  {
    key: "expiration_date",
    label: "Expiration date",
    required: true,
    description: "Policy expiration / term end date.",
  },
  {
    key: "occurrence_limit",
    label: "Occurrence limit",
    required: true,
    description: "Per-occurrence limit on the application/quote docs.",
  },
  {
    key: "aggregate_limit",
    label: "Aggregate limit",
    required: true,
    description: "General aggregate limit.",
  },
  {
    key: "deductible",
    label: "Deductible",
    required: false,
    description: "Applicable deductible if stated.",
  },
  {
    key: "fein",
    label: "FEIN / Tax ID",
    required: true,
    description: "Federal employer identification number.",
  },
  {
    key: "locations",
    label: "Insured locations",
    required: true,
    description: "Schedule of locations / premises.",
  },
  {
    key: "loss_history",
    label: "Loss history",
    required: true,
    description: "Recent loss runs covering required lookback.",
  },
];

export const EXPECTED_DOCUMENTS: ExpectedDocument[] = [
  {
    kind: "application",
    label: "Application",
    filenameHints: ["application", "app", "submission"],
  },
  {
    kind: "acord",
    label: "ACORD",
    filenameHints: ["acord", "acrd"],
  },
  {
    kind: "loss_run",
    label: "Loss run",
    filenameHints: ["loss", "lossrun", "loss-run", "claims"],
  },
  {
    kind: "financials",
    label: "Financials",
    filenameHints: ["financial", "finance", "statements", "pnl", "balance"],
  },
];

export function detectDocumentKind(
  fileName: string
): ExpectedDocumentKind | null {
  const normalized = fileName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  for (const doc of EXPECTED_DOCUMENTS) {
    if (
      doc.filenameHints.some((hint) =>
        normalized.includes(hint.replace(/[^a-z0-9]+/g, ""))
      )
    ) {
      return doc.kind;
    }
  }
  return null;
}
