import { groq, GROQ_MODEL, sanitizeGroqErrorMessage } from "@/lib/groq/client";
import type {
  AnalyzeIncidentInput,
  AnalyzeIncidentResult,
  IncidentAnalysis,
  LikelyCause,
  HistoricalEvidenceItem,
  RecommendedAction,
} from "../types";

const INCIDENT_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "Concise technical summary of the current incident and impact",
    },
    likelyCauses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          cause: {
            type: "string",
            description: "Potential cause or failure mode",
          },
          reasoning: {
            type: "string",
            description: "Why the current evidence and historical context support this possibility",
          },
          confidence: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Confidence level based on available facts",
          },
        },
        required: ["cause", "reasoning", "confidence"],
        additionalProperties: false,
      },
      description: "List of likely root causes ordered by relevance",
    },
    historicalEvidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          memoryId: {
            type: "string",
            description: "Exact Hindsight memory ID from the provided context",
          },
          relevance: {
            type: "string",
            description: "How this historical incident relates to the current incident, noting similarities and differences",
          },
        },
        required: ["memoryId", "relevance"],
        additionalProperties: false,
      },
      description: "Evidence from Hindsight memories relevant to the incident",
    },
    recommendedActions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          priority: {
            type: "integer",
            description: "Priority sequence (1 = immediate diagnostic/safe action)",
          },
          action: {
            type: "string",
            description: "Actionable remediation or diagnostic step",
          },
          reason: {
            type: "string",
            description: "Technical justification for this action",
          },
        },
        required: ["priority", "action", "reason"],
        additionalProperties: false,
      },
      description: "Prioritized list of safe, reversible diagnostic or remediation steps",
    },
    preventionSuggestions: {
      type: "array",
      items: {
        type: "string",
      },
      description: "Long-term architectural, monitoring, or process improvements to prevent recurrence",
    },
    evidenceGaps: {
      type: "array",
      items: {
        type: "string",
      },
      description: "Missing telemetry, logs, or information needed to confirm root cause",
    },
  },
  required: [
    "summary",
    "likelyCauses",
    "historicalEvidence",
    "recommendedActions",
    "preventionSuggestions",
    "evidenceGaps",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are an experienced incident-response and Site Reliability Engineer (SRE) analyzing a live production incident for IncidentMind.

Analyze the current incident using:
1. Current incident facts (title, service, severity, status, description, telemetry)
2. Current team discussion (investigation chat, hypotheses, operator findings)
3. Historical incidents retrieved from Hindsight (the organization's persistent memory)

Hindsight is the organization's long-term incident memory.
Use historical incidents as evidence and prior experience, NOT as definitive proof of the current root cause.

CRITICAL RULES:
- Never invent historical incidents, facts, metrics, logs, deployments, or root causes.
- If evidence is insufficient, explicitly state the missing information in evidenceGaps.
- Clearly distinguish:
  * observed facts from the current incident
  * historical evidence recalled from Hindsight
  * reasonable engineering inference
  * uncertainty
- Prioritize safe, reversible, high-value diagnostic actions before destructive actions.
- When recommending an action, explain why it is relevant to the available evidence.
- If a historical incident is similar, explain what makes it similar and what differs.
- Do not recommend rollback automatically unless the evidence indicates a deployment-related regression.
- Every memoryId in historicalEvidence MUST be an exact ID from the provided HINDSIGHT HISTORICAL EVIDENCE section. If no historical evidence was provided, historicalEvidence must be an empty list [].
- Do not include chain-of-thought or hidden reasoning in the response. Return concise, professional engineering summaries.`;

function buildPrompt(input: AnalyzeIncidentInput): string {
  const { incident, messages, historicalMemories } = input;

  // 1. Current Incident Section
  const incidentSection = [
    "## CURRENT INCIDENT",
    `ID: ${incident.id || "N/A"}`,
    `Title: ${incident.title || "Untitled Incident"}`,
    `Service: ${incident.service || "Unknown Service"}`,
    `Severity: ${incident.severity || "Unknown Severity"}`,
    `Status: ${incident.status || "Unknown Status"}`,
    `Description: ${incident.description || "No description provided"}`,
    `Created At: ${incident.created_at || "N/A"}`,
    incident.resolved_at ? `Resolved At: ${incident.resolved_at}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // 2. Current Team Discussion Section
  let discussionText = "(No team messages recorded yet.)";
  if (messages && messages.length > 0) {
    discussionText = messages
      .map((msg) => {
        const author = msg.user_name || msg.user || "Team Member";
        const time = msg.created_at || msg.createdAt || "";
        const body = msg.message || "";
        return `[${time}] ${author}: ${body}`;
      })
      .join("\n");
  }
  const discussionSection = [
    "## CURRENT TEAM DISCUSSION",
    discussionText,
  ].join("\n");

  // 3. Historical Hindsight Evidence Section
  let historicalText = "(No historical memories retrieved from Hindsight for this query.)";
  if (historicalMemories && historicalMemories.length > 0) {
    historicalText = historicalMemories
      .map((mem, idx) => {
        const parts = [
          `--- Memory #${idx + 1} ---`,
          `Memory ID: ${mem.id}`,
          mem.documentId ? `Document ID: ${mem.documentId}` : null,
          mem.type ? `Type: ${mem.type}` : null,
          `Content: ${mem.text}`,
        ].filter(Boolean);
        return parts.join("\n");
      })
      .join("\n\n");
  }
  const hindsightSection = [
    "## HINDSIGHT HISTORICAL EVIDENCE",
    historicalText,
  ].join("\n");

  return [
    incidentSection,
    "",
    discussionSection,
    "",
    hindsightSection,
    "",
    "Analyze this incident according to the instructions and return the structured JSON analysis.",
  ].join("\n");
}

function parseAndValidateAnalysis(
  rawText: string,
  validMemoryIds: Set<string>
): IncidentAnalysis {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Partial<IncidentAnalysis>;

  const summary = typeof parsed.summary === "string" && parsed.summary.trim()
    ? parsed.summary.trim()
    : "Incident analysis completed.";

  const likelyCauses: LikelyCause[] = Array.isArray(parsed.likelyCauses)
    ? parsed.likelyCauses
        .filter((item): item is LikelyCause => Boolean(item && typeof item.cause === "string"))
        .map((item) => ({
          cause: String(item.cause).trim(),
          reasoning: String(item.reasoning || "").trim(),
          confidence:
            item.confidence === "high" || item.confidence === "medium" || item.confidence === "low"
              ? item.confidence
              : "medium",
        }))
    : [];

  const rawHistorical = Array.isArray(parsed.historicalEvidence)
    ? parsed.historicalEvidence
    : [];

  // Enforce memory ID integrity: only keep references to genuine Hindsight memory IDs provided in context
  const historicalEvidence: HistoricalEvidenceItem[] = rawHistorical
    .filter((item): item is HistoricalEvidenceItem =>
      Boolean(item && typeof item.memoryId === "string" && validMemoryIds.has(item.memoryId.trim()))
    )
    .map((item) => ({
      memoryId: item.memoryId.trim(),
      relevance: String(item.relevance || "").trim(),
    }));

  const recommendedActions: RecommendedAction[] = Array.isArray(parsed.recommendedActions)
    ? parsed.recommendedActions
        .filter((item): item is RecommendedAction => Boolean(item && typeof item.action === "string"))
        .map((item, index) => ({
          priority: typeof item.priority === "number" ? item.priority : index + 1,
          action: String(item.action).trim(),
          reason: String(item.reason || "").trim(),
        }))
    : [];

  const preventionSuggestions: string[] = Array.isArray(parsed.preventionSuggestions)
    ? parsed.preventionSuggestions
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((s) => s.trim())
    : [];

  let evidenceGaps: string[] = Array.isArray(parsed.evidenceGaps)
    ? parsed.evidenceGaps
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((s) => s.trim())
    : [];

  if (validMemoryIds.size === 0 && evidenceGaps.length === 0) {
    evidenceGaps = ["No historical incident memories were found in Hindsight for this pattern."];
  }

  return {
    summary,
    likelyCauses,
    historicalEvidence,
    recommendedActions,
    preventionSuggestions,
    evidenceGaps,
  };
}

/**
 * Execute Groq chat completion with limited exponential backoff for transient errors (429, 503).
 * Never retries auth (401), invalid request (400), or missing key errors.
 */
async function callGroqWithRetry(
  prompt: string,
  model: string,
  maxRetries = 2
): Promise<string> {
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: prompt },
  ];

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // First attempt using strict json_schema structured outputs
      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "incident_analysis",
            strict: true,
            schema: INCIDENT_ANALYSIS_SCHEMA,
          },
        },
      });

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("Groq returned an empty response");
      }
      return content;
    } catch (err: unknown) {
      lastError = err;

      const statusCode =
        err && typeof err === "object" && "status" in err
          ? (err as { status?: number }).status
          : undefined;

      const errorMessage =
        err instanceof Error ? err.message : String(err);

      // If json_schema is not supported by the specific model, fallback to json_object mode
      if (
        statusCode === 400 &&
        (errorMessage.includes("response_format") ||
          errorMessage.includes("json_schema") ||
          errorMessage.includes("schema"))
      ) {
        console.warn(
          `[Groq] Model ${model} does not support json_schema, falling back to json_object format.`
        );
        const fallbackResponse = await groq.chat.completions.create({
          model,
          messages,
          temperature: 0.1,
          response_format: { type: "json_object" },
        });

        const fallbackContent = fallbackResponse.choices?.[0]?.message?.content?.trim();
        if (!fallbackContent) {
          throw new Error("Groq returned an empty response in fallback mode");
        }
        return fallbackContent;
      }

      // Do NOT retry 401 (auth) or other 4xx client errors
      if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        throw err;
      }

      // Only retry transient errors (429 rate limit or 5xx server errors)
      const isTransient = statusCode === 429 || (statusCode && statusCode >= 500);
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }

      const delayMs = 1000 * Math.pow(2, attempt);
      console.warn(
        `[Groq] Transient error (${statusCode ?? "network"}). Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Analyzes an incident using Groq and Hindsight historical evidence.
 */
export async function analyzeWithGroq(
  input: AnalyzeIncidentInput
): Promise<AnalyzeIncidentResult> {
  const model = GROQ_MODEL;
  const prompt = buildPrompt(input);

  const validMemoryIds = new Set<string>(
    (input.historicalMemories || [])
      .map((m) => m.id?.trim())
      .filter((id): id is string => Boolean(id))
  );

  let rawResponse: string;
  try {
    rawResponse = await callGroqWithRetry(prompt, model);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unknown error";
    const sanitized = sanitizeGroqErrorMessage(rawMessage);
    const err = new Error(sanitized);
    if (error && typeof error === "object" && "status" in error) {
      (err as unknown as { status: number }).status = (error as { status: number }).status;
    }
    throw err;
  }

  try {
    const analysis = parseAndValidateAnalysis(rawResponse, validMemoryIds);
    return {
      model,
      analysis,
    };
  } catch (parseError) {
    console.error("[Groq] Failed to parse structured output:", parseError);
    const error = new Error("Groq returned an invalid analysis format");
    (error as unknown as { status: number }).status = 502;
    throw error;
  }
}
