import { analyzeWithGroq } from "./providers/groq";
import type { AnalyzeIncidentInput, AnalyzeIncidentResult } from "./types";

/**
 * High-level AI incident analysis entry point.
 * Delegates to the configured AI provider (Groq).
 */
export async function analyzeIncidentWithAI(
  input: AnalyzeIncidentInput
): Promise<AnalyzeIncidentResult> {
  return analyzeWithGroq(input);
}
