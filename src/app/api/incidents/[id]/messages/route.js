import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/incidents/[id]/messages
 *
 * Returns all messages for a specific incident, oldest first
 * (like a chat — new messages appear at the bottom).
 */
export async function GET(request, { params }) {
  const { id } = await params;
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

  // Fetch messages sorted by time (oldest first for chat order)
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("incident_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch messages", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * POST /api/incidents/[id]/messages
 *
 * Posts a new message in an incident room.
 *
 * Required fields in JSON body:
 *   - user_name (string)
 *   - message   (string)
 *
 * Optional fields:
 *   - user_id (string)
 *
 * The incident_id is always taken from the URL — not from the body.
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

  // --- Validate required fields ---
  const { user_name, message } = body;

  if (!user_name || typeof user_name !== "string" || !user_name.trim()) {
    return NextResponse.json(
      { error: "Field 'user_name' is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "Field 'message' is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  // Verify the incident exists before inserting a message
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

  // --- Insert the message ---
  const { data, error } = await supabase
    .from("messages")
    .insert({
      incident_id: id,
      user_id: body.user_id || null,
      user_name: user_name.trim(),
      message: message.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create message", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
