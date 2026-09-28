import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

  return NextResponse.json(data, { status: 201 });
}
