import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/incidents/[id]
 *
 * Returns a single incident by its UUID.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // Supabase returns code "PGRST116" when no rows match
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch incident", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * PATCH /api/incidents/[id]
 *
 * Updates an existing incident. Send only the fields you want to change.
 *
 * Allowed fields:
 *   - title       (string)
 *   - service     (string)
 *   - severity    (string: "P1" | "P2" | "P3" | "P4")
 *   - status      (string: "open" | "investigating" | "resolved")
 *   - description (string)
 *   - resolved_at (ISO timestamp string or null)
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

  // --- Build an object with only the fields the caller sent ---
  const updates = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "Field 'title' must be a non-empty string" },
        { status: 400 }
      );
    }
    updates.title = body.title.trim();
  }

  if (body.service !== undefined) {
    if (typeof body.service !== "string" || !body.service.trim()) {
      return NextResponse.json(
        { error: "Field 'service' must be a non-empty string" },
        { status: 400 }
      );
    }
    updates.service = body.service.trim();
  }

  const validSeverities = ["P1", "P2", "P3", "P4"];
  if (body.severity !== undefined) {
    if (!validSeverities.includes(body.severity)) {
      return NextResponse.json(
        { error: `Field 'severity' must be one of: ${validSeverities.join(", ")}` },
        { status: 400 }
      );
    }
    updates.severity = body.severity;
  }

  const validStatuses = ["open", "investigating", "resolved"];
  if (body.status !== undefined) {
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Field 'status' must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }
    updates.status = body.status;

    // Auto-set resolved_at when status changes to "resolved"
    if (body.status === "resolved" && body.resolved_at === undefined) {
      updates.resolved_at = new Date().toISOString();
    }
  }

  if (body.description !== undefined) {
    updates.description = body.description;
  }

  if (body.resolved_at !== undefined) {
    updates.resolved_at = body.resolved_at;
  }

  // Nothing to update?
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields provided for update" },
      { status: 400 }
    );
  }

  // --- Update in Supabase ---
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("incidents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update incident", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/incidents/[id]
 *
 * Deletes a single incident and all its related messages/postmortems
 * (via the ON DELETE CASCADE foreign keys in the database).
 */
export async function DELETE(request, { params }) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  // First check the incident exists
  const { data: existing, error: fetchErr } = await supabase
    .from("incidents")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json(
      { error: "Incident not found" },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("incidents")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete incident", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Incident deleted" });
}
