export type ConfidenceLevel = "low" | "medium" | "high";

export interface LikelyCause {
  cause: string;
  reasoning: string;
  confidence: ConfidenceLevel;
}

export interface HistoricalEvidenceItem {
  memoryId: string;
  relevance: string;
}

export interface RecommendedAction {
  priority: number;
  action: string;
  reason: string;
}

export interface IncidentAnalysis {
  summary: string;
  likelyCauses: LikelyCause[];
  historicalEvidence: HistoricalEvidenceItem[];
  recommendedActions: RecommendedAction[];
  preventionSuggestions: string[];
  evidenceGaps: string[];
}

export interface HistoricalMemoryContext {
  id: string;
  text: string;
  type?: string | null;
  documentId?: string | null;
  scores?: unknown;
  [key: string]: unknown;
}

export interface TeamMessageContext {
  user?: string | null;
  user_name?: string | null;
  message?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface AnalyzeIncidentInput {
  incident: {
    id: string;
    title?: string | null;
    service?: string | null;
    severity?: string | null;
    status?: string | null;
    description?: string | null;
    created_at?: string | null;
    resolved_at?: string | null;
    [key: string]: unknown;
  };
  messages?: TeamMessageContext[] | null;
  historicalMemories?: HistoricalMemoryContext[] | null;
}

export interface AnalyzeIncidentResult {
  model: string;
  analysis: IncidentAnalysis;
}
