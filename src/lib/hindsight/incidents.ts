import { getHindsightClient, getHindsightBankId } from "./client";
import type {
  IncidentMemoryInput,
  RecallSimilarIncidentsInput,
  PostmortemMemoryInput,
  MemoryEvidence,
  ReflectIncidentInput,
  ReflectIncidentResult,
} from "./types";

/**
 * Stores an incident and its context in Hindsight.
 * Accepts either a structured IncidentMemoryInput or raw incident string.
 */
export async function retainIncident(
  input: IncidentMemoryInput | string
): Promise<{ success: boolean; itemsCount?: number; bankId?: string }> {
  const client = getHindsightClient();
  const bankId = getHindsightBankId();

  let content: string;
  let documentId: string | undefined;
  let tags: string[] | undefined;

  if (typeof input === "string") {
    content = input.trim();
    if (!content) {
      throw new Error("Incident content must be a non-empty string");
    }
  } else {
    if (!input.incidentId?.trim()) {
      throw new Error("Incident ID is required for retaining an incident");
    }
    documentId = input.incidentId.trim();
    tags = ["incident", documentId];
    if (input.severity) tags.push(input.severity.toLowerCase());

    const lines: string[] = [];
    lines.push(`Incident ${documentId}: ${input.title || "Incident Report"}`);
    if (input.severity) lines.push(`Severity: ${input.severity}`);
    if (input.servicesAffected?.length) {
      lines.push(`Services Affected: ${input.servicesAffected.join(", ")}`);
    }
    if (input.deploymentVersion) {
      lines.push(`Deployment / Version: ${input.deploymentVersion}`);
    }
    if (input.symptoms) {
      const sym = Array.isArray(input.symptoms) ? input.symptoms.join("; ") : input.symptoms;
      lines.push(`Symptoms: ${sym}`);
    }
    if (input.rootCause) lines.push(`Root Cause: ${input.rootCause}`);
    if (input.resolution) lines.push(`Resolution: ${input.resolution}`);
    if (input.observations) lines.push(`Investigation Observations: ${input.observations}`);
    if (input.rawContent) lines.push(`Additional Details: ${input.rawContent}`);

    content = lines.join("\n");
  }

  const result = await client.retain(bankId, content, {
    documentId,
    tags,
  });

  return {
    success: true,
    itemsCount: result.items_count,
    bankId: result.bank_id,
  };
}

/**
 * Retrieves relevant historical incidents from Hindsight given a query or symptoms.
 */
export async function recallSimilarIncidents(
  input: RecallSimilarIncidentsInput | string
): Promise<{ success: boolean; memories: MemoryEvidence[] }> {
  const query = typeof input === "string" ? input.trim() : input.query?.trim();
  const tags = typeof input === "string" ? undefined : input.tags;

  if (!query) {
    throw new Error("Recall query must be a non-empty string");
  }

  const client = getHindsightClient();
  const bankId = getHindsightBankId();

  const response = await client.recall(bankId, query, {
    tags,
  });

  const memories: MemoryEvidence[] = (response.results || []).map((res) => ({
    id: res.id,
    text: res.text,
    type: res.type,
    entities: res.entities,
    scores: res.scores
      ? {
          final: res.scores.final,
          reranker: res.scores.reranker,
          semantic: res.scores.semantic,
          keyword: res.scores.keyword,
        }
      : null,
    occurredStart: res.occurred_start,
    occurredEnd: res.occurred_end,
    mentionedAt: res.mentioned_at,
    documentId: res.document_id,
  }));

  return {
    success: true,
    memories,
  };
}

/**
 * Stores post-incident learning, root cause analysis, and prevention actions in Hindsight.
 */
export async function retainPostmortem(
  input: PostmortemMemoryInput
): Promise<{ success: boolean; itemsCount?: number }> {
  if (!input.incidentId?.trim()) {
    throw new Error("Incident ID is required for retaining postmortem");
  }
  if (!input.rootCause?.trim() || !input.successfulResolution?.trim()) {
    throw new Error(
      "Root cause and successful resolution are required for postmortem"
    );
  }

  const client = getHindsightClient();
  const bankId = getHindsightBankId();

  const lines: string[] = [];
  lines.push(`Postmortem Summary for Incident ${input.incidentId.trim()}`);
  lines.push(`Root Cause: ${input.rootCause.trim()}`);
  lines.push(`Successful Resolution: ${input.successfulResolution.trim()}`);
  if (input.failedApproaches?.length) {
    lines.push(`Failed / Ineffective Approaches: ${input.failedApproaches.join("; ")}`);
  }
  if (input.lessonsLearned?.length) {
    lines.push(`Lessons Learned: ${input.lessonsLearned.join("; ")}`);
  }
  if (input.preventionActions?.length) {
    lines.push(`Prevention Actions: ${input.preventionActions.join("; ")}`);
  }

  const content = lines.join("\n");
  const result = await client.retain(bankId, content, {
    documentId: `postmortem-${input.incidentId.trim()}`,
    tags: ["postmortem", input.incidentId.trim()],
  });

  return {
    success: true,
    itemsCount: result.items_count,
  };
}

/**
 * Uses Hindsight reflection to synthesize historical knowledge relevant to an incident.
 */
export async function reflectOnIncident(
  input: ReflectIncidentInput | string
): Promise<ReflectIncidentResult> {
  const query = typeof input === "string" ? input.trim() : input.query?.trim();
  const context = typeof input === "string" ? undefined : input.context;
  const tags = typeof input === "string" ? undefined : input.tags;

  if (!query) {
    throw new Error("Reflection query must be a non-empty string");
  }

  const client = getHindsightClient();
  const bankId = getHindsightBankId();

  const response = await client.reflect(bankId, query, {
    context,
    tags,
    includeFacts: true,
  });

  const memories: MemoryEvidence[] = (response.based_on?.memories || []).map(
    (fact) => ({
      id: fact.id || "",
      text: fact.text,
      type: fact.type,
      occurredStart: fact.occurred_start,
      occurredEnd: fact.occurred_end,
    })
  );

  return {
    success: true,
    response: response.text,
    memories,
  };
}
