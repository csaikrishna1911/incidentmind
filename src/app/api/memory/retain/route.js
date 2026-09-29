import { NextResponse } from "next/server";
import { hindsight, BANK_ID } from "@/lib/hindsight";

/**
 * POST /api/memory/retain
 *
 * Stores incident-learning information in Hindsight as a persistent memory.
 *
 * This is called after a postmortem is written so that future similar
 * incidents can benefit from what was learned.
 *
 * Request body (JSON):
 * {
 *   "incident_title":   "Payment API 503",           // required
 *   "service":          "payment-api",                // required
 *   "severity":         "P1",                         // required
 *   "root_cause":       "Connection pool exhaustion", // required
 *   "what_worked":      "Restarting the service",     // optional
 *   "what_failed":      "Checking API layer first",   // optional
 *   "lessons_learned":  "Check DB connections early",  // optional
 *   "resolution_time":  "45 minutes"                  // optional
 * }
 *
 * Response:
 *   201: { message: "Memory stored successfully" }
 *   400: validation error
 *   500: Hindsight API error
 *   503: Hindsight not configured
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
  const { incident_title, service, severity, root_cause } = body;

  if (!incident_title || typeof incident_title !== "string" || !incident_title.trim()) {
    return NextResponse.json(
      { error: "Field 'incident_title' is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (!service || typeof service !== "string" || !service.trim()) {
    return NextResponse.json(
      { error: "Field 'service' is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (!severity || typeof severity !== "string" || !severity.trim()) {
    return NextResponse.json(
      { error: "Field 'severity' is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (!root_cause || typeof root_cause !== "string" || !root_cause.trim()) {
    return NextResponse.json(
      { error: "Field 'root_cause' is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  // --- Build a structured memory string ---
  // Hindsight stores text — we format the incident data into a clear,
  // searchable narrative that the AI can understand later.
  const memoryParts = [
    `Incident: ${incident_title.trim()}`,
    `Service: ${service.trim()}`,
    `Severity: ${severity.trim()}`,
    `Root Cause: ${root_cause.trim()}`,
  ];

  if (body.what_worked) {
    memoryParts.push(`What Worked: ${body.what_worked.trim()}`);
  }
  if (body.what_failed) {
    memoryParts.push(`What Failed: ${body.what_failed.trim()}`);
  }
  if (body.lessons_learned) {
    memoryParts.push(`Lessons Learned: ${body.lessons_learned.trim()}`);
  }
  if (body.resolution_time) {
    memoryParts.push(`Resolution Time: ${body.resolution_time.trim()}`);
  }

  const memoryText = memoryParts.join("\n");

  // --- Store in Hindsight ---
  try {
    await hindsight.retain(BANK_ID, memoryText);

    return NextResponse.json(
      { message: "Memory stored successfully", bank: BANK_ID },
      { status: 201 }
    );
  } catch (err) {
    console.error("Hindsight retain error:", err);
    return NextResponse.json(
      {
        error: "Failed to store memory in Hindsight",
        details: err.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
