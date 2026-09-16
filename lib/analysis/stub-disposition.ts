import type { DispositionDecision } from "@/lib/dispositions";
import type { Finding } from "@/lib/findings";
import { getDispositionDecisionLabel } from "@/lib/dispositions";
import { getFindingTypeLabel } from "@/lib/findings";

export type DispositionRecommendation = {
  decision: DispositionDecision;
  summary: string;
  rationale: string[];
  confidence: number;
  requestedItems: string[];
  denialReasons: string[];
  counts: {
    open: number;
    agreed: number;
    disagreed: number;
    activeBlockers: number;
    activeIssues: number;
  };
};

function isActiveFinding(finding: Finding) {
  return finding.status === "open" || finding.status === "agreed";
}

export function buildClientRequestItems(findings: Finding[]): string[] {
  return findings
    .filter(isActiveFinding)
    .filter(
      (finding) =>
        finding.severity === "blocker" ||
        finding.severity === "warning" ||
        finding.type === "pack_incomplete" ||
        finding.type === "missing_field"
    )
    .map((finding) => {
      if (finding.suggestedAction) {
        return `${finding.title}: ${finding.suggestedAction}`;
      }
      return finding.title;
    });
}

export function buildDenialReasons(findings: Finding[]): string[] {
  const active = findings.filter(isActiveFinding);
  const blockers = active.filter((finding) => finding.severity === "blocker");
  const source = blockers.length > 0 ? blockers : active;

  return source.map((finding) => {
    const type = getFindingTypeLabel(finding.type);
    return `${finding.title} (${type}${finding.status === "agreed" ? ", agreed" : ", open"})`;
  });
}

/**
 * Stub “final recommendation” for Complete review.
 * Disagreed findings are treated as underwriter overrides (AI suggestion dismissed).
 * Agreed + open findings still count as active issues the packet must address.
 */
export function recommendDisposition(
  findings: Finding[]
): DispositionRecommendation {
  const open = findings.filter((finding) => finding.status === "open");
  const agreed = findings.filter((finding) => finding.status === "agreed");
  const disagreed = findings.filter((finding) => finding.status === "disagreed");

  const active = [...open, ...agreed];
  const activeBlockers = active.filter(
    (finding) => finding.severity === "blocker"
  );
  const activePackGaps = active.filter(
    (finding) => finding.type === "pack_incomplete"
  );
  const activeIssues = active.filter(
    (finding) => finding.severity === "blocker" || finding.severity === "warning"
  );

  const rationale: string[] = [];
  let decision: DispositionDecision;
  let confidence: number;

  if (findings.length === 0) {
    decision = "awaiting_client";
    confidence = 0.55;
    rationale.push(
      "No analysis findings yet. Run stub analysis before completing, or request a fuller packet from the client."
    );
  } else if (
    activeBlockers.length >= 3 &&
    activePackGaps.length >= 2 &&
    disagreed.length === 0
  ) {
    decision = "denied";
    confidence = 0.62;
    rationale.push(
      `${activeBlockers.length} active blocker findings remain with no underwriter overrides.`
    );
    rationale.push(
      `${activePackGaps.length} pack-incomplete gaps suggest the submission is not viable as submitted.`
    );
  } else if (activeBlockers.length > 0 || open.length > 0) {
    decision = "awaiting_client";
    confidence = activeBlockers.length > 0 ? 0.88 : 0.74;
    if (activeBlockers.length > 0) {
      rationale.push(
        `${activeBlockers.length} active blocker${activeBlockers.length === 1 ? "" : "s"} (open or agreed) still need resolution.`
      );
      for (const finding of activeBlockers.slice(0, 3)) {
        rationale.push(
          `${finding.status === "agreed" ? "Agreed" : "Open"} blocker: ${finding.title} (${getFindingTypeLabel(finding.type)}).`
        );
      }
    }
    if (open.length > 0) {
      rationale.push(
        `${open.length} finding${open.length === 1 ? "" : "s"} still unmarked — treat as unresolved until reviewed.`
      );
    }
    if (disagreed.length > 0) {
      rationale.push(
        `${disagreed.length} underwriter override${disagreed.length === 1 ? "" : "s"} discounted from the recommendation.`
      );
    }
  } else if (activeIssues.length > 0) {
    decision = "awaiting_client";
    confidence = 0.7;
    rationale.push(
      `${activeIssues.length} agreed warning-level issue${activeIssues.length === 1 ? "" : "s"} remain after underwriter review.`
    );
    rationale.push(
      "Recommend requesting client clarification before advancing to sign-off."
    );
  } else {
    decision = "ready_for_sign_off";
    confidence = disagreed.length > 0 ? 0.8 : 0.9;
    rationale.push(
      "No active blockers or unresolved findings after applying underwriter agree/disagree feedback."
    );
    if (agreed.length > 0) {
      rationale.push(
        `${agreed.length} info-level agreement${agreed.length === 1 ? "" : "s"} recorded without outstanding remediation.`
      );
    }
    if (disagreed.length > 0) {
      rationale.push(
        `${disagreed.length} AI suggestion${disagreed.length === 1 ? "" : "s"} overridden by the underwriter.`
      );
    }
  }

  const summary = `AI recommends “${getDispositionDecisionLabel(decision)}” based on ${findings.length} finding${findings.length === 1 ? "" : "s"} and underwriter overrides.`;

  return {
    decision,
    summary,
    rationale,
    confidence,
    requestedItems: buildClientRequestItems(findings),
    denialReasons: buildDenialReasons(findings),
    counts: {
      open: open.length,
      agreed: agreed.length,
      disagreed: disagreed.length,
      activeBlockers: activeBlockers.length,
      activeIssues: activeIssues.length,
    },
  };
}
