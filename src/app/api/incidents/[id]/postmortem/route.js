import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/incidents/[id]/postmortem
 *
 * Returns the postmortem for a specific incident.
 * Each incident can have at most one postmortem (unique constraint).
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("postmortems")
    .select("*")
    .eq("incident_id", id)
    .single();

  if (error) {
    // No postmortem exists yet — that's okay, return 404
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "No postmortem found for this incident" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch postmortem", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * POST /api/incidents/[id]/postmortem
 *
 * Creates a postmortem for an incident.
 * Only one postmortem per incident is allowed (unique constraint).
 *
 * Optional fields in JSON body:
 *   - root_cause      (string)
 *   - what_worked     (string)
 *   - what_failed     (string)
 *   - lessons_learned (string)
 *   - created_by      (string)
 *
 * The incident_id is taken from the URL.
 */
export async function POST(request, { params }) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  // Verify the incident exists
  const { data: incident, error: incErr } = await supabase
    .from("incidents")
    .select("id")
    .eq("id", id)
    .single();

  if (incErr || !incident) {
    return NextResponse.json(
      { error: "Incident not found" },
      { status: 404 }
    );
  }

  // --- Insert the postmortem ---
  const { data, error } = await supabase
    .from("postmortems")
    .insert({
      incident_id: id,
      root_cause: body.root_cause || null,
      what_worked: body.what_worked || null,
      what_failed: body.what_failed || null,
      lessons_learned: body.lessons_learned || null,
      created_by: body.created_by || null,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation — postmortem already exists
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A postmortem already exists for this incident. Use PATCH to update it." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create postmortem", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/incidents/[id]/postmortem
 *
 * Updates an existing postmortem. Send only the fields you want to change.
 *
 * Allowed fields:
 *   - root_cause      (string)
 *   - what_worked     (string)
 *   - what_failed     (string)
 *   - lessons_learned (string)
 *   - created_by      (string)
 */
export async function PATCH(request, { params }) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // --- Build updates from the fields the caller sent ---
  const allowedFields = [
    "root_cause",
    "what_worked",
    "what_failed",
    "lessons_learned",
    "created_by",
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields provided for update" },
      { status: 400 }
    );
  }

  // --- Update in Supabase ---
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("postmortems")
    .update(updates)
    .eq("incident_id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "No postmortem found for this incident. Use POST to create one first." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update postmortem", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
