/**
 * Types for the IncidentMind Hindsight memory layer.
 */

export interface IncidentMemoryInput {
  incidentId: string;
  title?: string;
  symptoms?: string | string[];
  severity?: "SEV1" | "SEV2" | "SEV3" | "SEV4" | string;
  rootCause?: string;
  servicesAffected?: string[];
  deploymentVersion?: string;
  resolution?: string;
  observations?: string;
  rawContent?: string;
}

export interface RecallSimilarIncidentsInput {
  query: string;
  limit?: number;
  tags?: string[];
}

export interface PostmortemMemoryInput {
  incidentId: string;
  rootCause: string;
  successfulResolution: string;
  failedApproaches?: string[];
  lessonsLearned?: string[];
  preventionActions?: string[];
}

export interface MemoryEvidence {
  id: string;
  text: string;
  type?: string | null;
  entities?: string[] | null;
  scores?: {
    final?: number | null;
    reranker?: number | null;
    semantic?: number | null;
    keyword?: number | null;
  } | null;
  occurredStart?: string | null;
  occurredEnd?: string | null;
  mentionedAt?: string | null;
  documentId?: string | null;
}

export interface ReflectIncidentInput {
  query: string;
  context?: string;
  tags?: string[];
}

export interface ReflectIncidentResult {
  success: boolean;
  response: string;
  memories?: MemoryEvidence[];
}
