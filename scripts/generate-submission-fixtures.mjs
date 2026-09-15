import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const root = path.join(process.cwd(), "fixtures", "submissions");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePdf(filePath, title, lines) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: "LETTER" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(16).text(title, { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    for (const line of lines) {
      doc.text(line);
    }
    doc.moveDown();
    doc
      .fontSize(8)
      .fillColor("#666666")
      .text(
        "SYNTHETIC FIXTURE — fictional data for Document Review POC only. Not an official ACORD or carrier form."
      );

    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });
}

async function writePack(packName, docs) {
  const dir = path.join(root, packName);
  ensureDir(dir);
  for (const doc of docs) {
    await writePdf(path.join(dir, doc.fileName), doc.title, doc.lines);
  }
}

const sharedMailing = [
  "Mailing address: 4800 Industrial Parkway, Suite 200, Dallas, TX 75201",
  "FEIN: 84-2019384",
  "Proposed effective: 04/01/2026",
  "Proposed expiration: 04/01/2027",
];

async function main() {
  ensureDir(root);

  await writePack("complete", [
    {
      fileName: "application-commercial-package.pdf",
      title: "Commercial Package Application (Synthetic)",
      lines: [
        "Named insured: Apex Manufacturing LLC",
        ...sharedMailing,
        "Operations: Precision metal fabrication and light assembly",
        "Occurrence limit requested: $1,000,000",
        "General aggregate requested: $2,000,000",
        "Deductible: $5,000",
        "Locations: 4800 Industrial Parkway, Dallas, TX; 120 Harbor Rd, Fort Worth, TX",
        "Contact: Jordan Lee, Risk Manager",
      ],
    },
    {
      fileName: "acord-125-applicant.pdf",
      title: "ACORD 125 — Applicant Section (Synthetic)",
      lines: [
        "Form style: Commercial Insurance Application — Applicant Information",
        "Named insured: Apex Manufacturing LLC",
        ...sharedMailing,
        "Business phone: (214) 555-0142",
        "NAICS: 332710",
        "Years in business: 14",
        "Prior carrier: Contoso Mutual",
      ],
    },
    {
      fileName: "loss-run-2021-2025.pdf",
      title: "Loss Run Report (Synthetic)",
      lines: [
        "Insured: Apex Manufacturing LLC",
        "Valuation date: 02/15/2026",
        "Period: 01/01/2021 – 12/31/2025",
        "Policy line: General Liability / Property package",
        "",
        "2023-GL-1182 | 06/12/2023 | Closed | Slip/fall visitor | Paid $8,400 | Incurred $8,400",
        "2024-PR-0441 | 11/03/2024 | Open | Water damage — pipe | Paid $12,000 | Reserve $18,000 | Incurred $30,000",
        "Total incurred (5 yrs): $38,400",
        "Large loss narrative: 2024 water loss related to failed supply line; mitigation completed Q1 2025.",
      ],
    },
    {
      fileName: "financials-fy2025.pdf",
      title: "Financial Summary FY2025 (Synthetic)",
      lines: [
        "Entity: Apex Manufacturing LLC",
        "Fiscal year ending: 12/31/2025",
        "Revenue: $18,400,000",
        "Gross profit: $4,200,000",
        "Net income: $1,050,000",
        "Total assets: $9,800,000",
        "Note: Unaudited management summary for underwriting POC fixtures.",
      ],
    },
  ]);

  await writePack("incomplete", [
    {
      fileName: "application-commercial-package.pdf",
      title: "Commercial Package Application (Synthetic — Incomplete Pack)",
      lines: [
        "Named insured: Harbor View Logistics Inc",
        "Mailing address: 900 Pier Street, Houston, TX 77002",
        "FEIN: 71-5592011",
        "Proposed effective: 05/01/2026",
        "Proposed expiration: 05/01/2027",
        "Occurrence limit requested: $1,000,000",
        "General aggregate requested: $2,000,000",
        "NOTE: Loss run and financials intentionally omitted for incomplete-pack testing.",
      ],
    },
    {
      fileName: "acord-125-applicant.pdf",
      title: "ACORD 125 — Applicant Section (Synthetic — Incomplete Pack)",
      lines: [
        "Named insured: Harbor View Logistics Inc",
        "Mailing address: 900 Pier Street, Houston, TX 77002",
        "FEIN: 71-5592011",
        "Proposed effective: 05/01/2026",
        "Proposed expiration: 05/01/2027",
      ],
    },
  ]);

  await writePack("conflict", [
    {
      fileName: "application-commercial-package.pdf",
      title: "Commercial Package Application (Synthetic — Name Conflict)",
      lines: [
        "Named insured: Apex Manufacturing LLC",
        ...sharedMailing,
        "Occurrence limit requested: $1,000,000",
        "General aggregate requested: $2,000,000",
        "Intentional conflict fixture: application uses legal LLC name.",
      ],
    },
    {
      fileName: "acord-126-gl.pdf",
      title: "ACORD 126 — General Liability (Synthetic — Name Conflict)",
      lines: [
        "Applicant / first named insured: Apex Mfg Inc",
        "Mailing address: 4800 Industrial Parkway, Dallas, TX 75201",
        "Effective date: 04/01/2026",
        "Each occurrence: $1,000,000",
        "General aggregate: $2,000,000",
        "Intentional conflict fixture: ACORD uses abbreviated corporate name.",
      ],
    },
    {
      fileName: "loss-run-2022-2025.pdf",
      title: "Loss Run Report (Synthetic — Name Conflict Pack)",
      lines: [
        "Insured: Apex Manufacturing LLC",
        "Valuation date: 01/30/2026",
        "Period: 01/01/2022 – 12/31/2025",
        "No claims reported for valuation period.",
      ],
    },
  ]);

  console.log(`Wrote synthetic submission fixtures to ${root}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
