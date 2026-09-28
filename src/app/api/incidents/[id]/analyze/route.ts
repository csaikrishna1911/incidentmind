import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { recallSimilarIncidents } from "@/lib/hindsight/incidents";
import { analyzeIncidentWithAI } from "@/lib/ai";
import { sanitizeGroqErrorMessage } from "@/lib/groq/client";

/**
 * POST /api/incidents/[id]/analyze
 *
 * Analyzes the current incident using:
 * 1. Current incident data from Supabase
 * 2. Current team discussion/messages from Supabase
 * 3. Historical incidents recalled from Hindsight
 * 4. Groq reasoning with structured output
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: "Incident ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // ---------------------------------------------------------
    // 1. Fetch the current incident from Supabase
    // ---------------------------------------------------------
    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", id)
      .single();

    if (incidentError || !incident) {
      return NextResponse.json(
        { success: false, error: "Incident not found" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 2. Fetch current incident messages from Supabase
    // ---------------------------------------------------------
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("incident_id", id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch incident messages",
          details: messagesError.message,
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 3. Build a recall query for Hindsight
    // ---------------------------------------------------------
    const recallQuery = [
      `Incident: ${incident.title || ""}`,
      `Service: ${incident.service || ""}`,
      `Severity: ${incident.severity || ""}`,
      `Status: ${incident.status || ""}`,
      `Description: ${incident.description || ""}`,
    ].join("\n");

    // ---------------------------------------------------------
    // 4. Recall historical incidents from Hindsight
    // ---------------------------------------------------------
    const hindsight = await recallSimilarIncidents({
      query: recallQuery,
      tags: ["incident"],
    });

    // ---------------------------------------------------------
    // 5. Prepare historical evidence
    // ---------------------------------------------------------
    const historicalEvidence = (hindsight.memories || [])
      .slice(0, 10)
      .map((memory) => ({
        id: memory.id,
        text: memory.text,
        type: memory.type,
        documentId: memory.documentId,
        scores: memory.scores,
      }));

    // ---------------------------------------------------------
    // 6. Prepare current team discussion
    // ---------------------------------------------------------
    const discussion = (messages || []).map((message) => ({
      user: message.user_name,
      message: message.message,
      createdAt: message.created_at,
    }));

    // ---------------------------------------------------------
    // 7. Ask Groq to analyze the incident using Hindsight evidence
    // ---------------------------------------------------------
    const aiResult = await analyzeIncidentWithAI({
      incident,
      messages: discussion,
      historicalMemories: historicalEvidence,
    });

    // ---------------------------------------------------------
    // 8. Return the structured AI analysis to the frontend
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,
      incidentId: id,
      model: aiResult.model,
      analysis: aiResult.analysis,
      hindsight: {
        memoriesFound: historicalEvidence.length,
        memories: historicalEvidence,
      },
    });
  } catch (error) {
    console.error("Incident analysis failed:", error);

    const rawMessage = error instanceof Error ? error.message : "Unknown error";
    const sanitizedMessage = sanitizeGroqErrorMessage(rawMessage);

    const statusCode =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: number }).status) || 500
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: sanitizedMessage,
      },
      { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
    );
  }
}