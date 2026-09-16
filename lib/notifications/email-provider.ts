import type { DispositionDecision, DispositionFindingSnapshot } from "@/lib/dispositions";
import { getDispositionDecisionLabel } from "@/lib/dispositions";

export type ClientNotifyInput = {
  reviewId: string;
  businessName: string;
  decision: DispositionDecision;
  note: string | null;
  findings: DispositionFindingSnapshot[];
};

export type ClientNotifyResult = {
  provider: string;
  messageId: string;
  status: "queued" | "sent" | "failed";
  summary: string;
};

export interface ClientEmailProvider {
  notifyClient(input: ClientNotifyInput): Promise<ClientNotifyResult>;
}

/** POC stub — logs intent and returns a fake message id. Swap for Resend/etc. later. */
export class StubClientEmailProvider implements ClientEmailProvider {
  async notifyClient(input: ClientNotifyInput): Promise<ClientNotifyResult> {
    const messageId = `stub_${crypto.randomUUID()}`;
    const decisionLabel = getDispositionDecisionLabel(input.decision);
    const summary =
      input.decision === "awaiting_client"
        ? `Stub email queued: request more information from client for “${input.businessName}” (${input.findings.length} finding(s)).`
        : `Stub email queued: notify client of “${decisionLabel}” for “${input.businessName}”.`;

    console.info("[email:stub]", {
      messageId,
      reviewId: input.reviewId,
      businessName: input.businessName,
      decision: input.decision,
      note: input.note,
      findingCount: input.findings.length,
      summary,
    });

    return {
      provider: "stub",
      messageId,
      status: "queued",
      summary,
    };
  }
}

export function getClientEmailProvider(): ClientEmailProvider {
  return new StubClientEmailProvider();
}
