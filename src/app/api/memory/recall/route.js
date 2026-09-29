import { NextResponse } from "next/server";
import { hindsight, BANK_ID } from "@/lib/hindsight";

/**
 * POST /api/memory/recall
 *
 * Searches Hindsight for historical memories relevant to a current incident.
 *
 * This is called when a new incident is created or when the team wants
 * to check if something similar has happened before.
 *
 * Request body (JSON):
 * {
 *   "query": "Payment API is returning HTTP 503 errors"  // required
 * }
 *
 * Response (200):
 * {
 *   "query": "Payment API is returning HTTP 503 errors",
 *   "bank": "incidentmind",
 *   "memories": [
 *     {
 *       "text": "Incident: Payment API 503\nService: payment-api\n...",
 *       "score": 0.92
 *     }
 *   ]
 * }
 *
 * Response (400): validation error
 * Response (500): Hindsight API error
 * Response (503): Hindsight not configured
 */
export async function POST(request) {
  // --- Check Hindsight is configured ---
  if (!hindsight) {
    return NextResponse.json(
      {
        error: "Hindsight is not configured",
        details: "Set HINDSIGHT_API_KEY in .env.local to enable memory features.",
      },
      { status: 503 }
    );
  }

  // --- Parse request body ---
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // --- Validate required fields ---
  const { query } = body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json(
      { error: "Field 'query' is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  // --- Search Hindsight ---
  try {
    const results = await hindsight.recall(BANK_ID, query.trim());

    // Normalize the response — the SDK may return different shapes
    // depending on the version, so we handle both array and object forms.
    let memories = [];

    if (Array.isArray(results)) {
      // Results is already an array of memory objects
      memories = results.map((item) => ({
        text: item.text || item.content || item.memory || String(item),
        score: item.score ?? item.relevance ?? null,
      }));
    } else if (results && typeof results === "object") {
      // Results might be wrapped in an object with a memories/results key
      const items = results.memories || results.results || results.data || [];
      memories = items.map((item) => ({
        text: item.text || item.content || item.memory || String(item),
        score: item.score ?? item.relevance ?? null,
      }));
    }

    return NextResponse.json({
      query: query.trim(),
      bank: BANK_ID,
      memories,
    });
  } catch (err) {
    console.error("Hindsight recall error:", err);
    return NextResponse.json(
      {
        error: "Failed to recall memories from Hindsight",
        details: err.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
