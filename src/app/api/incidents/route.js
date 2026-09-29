import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { hindsight, BANK_ID } from "@/lib/hindsight";

/**
 * GET /api/incidents
 *
 * Returns all incidents, newest first.
 */
export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch incidents", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * POST /api/incidents
 *
 * Creates a new incident.
 *
 * Required fields in JSON body:
 *   - title    (string)
 *   - service  (string)
 *   - severity (string: "P1" | "P2" | "P3" | "P4")
 *
 * Optional fields:
 *   - description (string)
 *   - created_by  (string)
 *   - status      (string: "open" | "investigating" | "resolved", defaults to "open")
 */
export async function POST(request) {
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
  const { title, service, severity } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "Field 'title' is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (!service || typeof service !== "string" || !service.trim()) {
    return NextResponse.json(
      { error: "Field 'service' is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  const validSeverities = ["P1", "P2", "P3", "P4"];
  if (!severity || !validSeverities.includes(severity)) {
    return NextResponse.json(
      { error: `Field 'severity' must be one of: ${validSeverities.join(", ")}` },
      { status: 400 }
    );
  }

  // --- Validate optional status if provided ---
  const validStatuses = ["open", "investigating", "resolved"];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `Field 'status' must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  // --- Insert into Supabase ---
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      title: title.trim(),
      service: service.trim(),
      severity,
      status: body.status || "open",
      description: body.description || null,
      created_by: body.created_by || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create incident", details: error.message },
      { status: 500 }
    );
  }

  // --- Search Hindsight for similar past incidents (non-blocking on failure) ---
  // The incident is already saved in Supabase. Now we search Hindsight
  // to see if similar incidents have happened before.
  let similar_incidents = [];
  let memory_status = "skipped";

  if (hindsight) {
    try {
      // Build a recall query from the incident details
      const queryParts = [data.title];
      if (data.service) {
        queryParts.push(`service: ${data.service}`);
      }
      if (data.description) {
        queryParts.push(data.description);
      }
      queryParts.push(`severity: ${data.severity}`);

      const recallQuery = queryParts.join(". ");

      const results = await hindsight.recall(BANK_ID, recallQuery);

      // Normalize the response into a consistent format
      if (Array.isArray(results)) {
        similar_incidents = results.map((item) => ({
          text: item.text || item.content || item.memory || String(item),
          score: item.score ?? item.relevance ?? null,
        }));
      } else if (results && typeof results === "object") {
        const items = results.memories || results.results || results.data || [];
        similar_incidents = items.map((item) => ({
          text: item.text || item.content || item.memory || String(item),
          score: item.score ?? item.relevance ?? null,
        }));
      }

      memory_status = "recalled";
    } catch (recallErr) {
      // Hindsight failed — the incident is still safely saved in Supabase.
      console.error("Hindsight recall failed (incident is safe in Supabase):", recallErr);
      memory_status = "failed";
    }
  }

  return NextResponse.json(
    {
      incident: data,
      similar_incidents,
      memory_status,
    },
    { status: 201 }
  );
}
