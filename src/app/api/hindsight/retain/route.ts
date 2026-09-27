import { NextResponse } from "next/server";
import { retainIncident, sanitizeErrorMessage } from "@/lib/hindsight";
import type { IncidentMemoryInput } from "@/lib/hindsight";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Request body must be an object" },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;

    // Support both backward-compatible { content: "..." } and structured IncidentMemoryInput
    if ("content" in payload) {
      if (typeof payload.content !== "string" || payload.content.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "The 'content' field must be a non-empty string" },
          { status: 400 }
        );
      }
      const result = await retainIncident(payload.content.trim());
      return NextResponse.json({
        success: true,
        itemsCount: result.itemsCount,
      });
    } else if ("incidentId" in payload) {
      if (typeof payload.incidentId !== "string" || payload.incidentId.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "The 'incidentId' field must be a non-empty string" },
          { status: 400 }
        );
      }
      const result = await retainIncident(payload as unknown as IncidentMemoryInput);
      return NextResponse.json({
        success: true,
        itemsCount: result.itemsCount,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Missing required 'content' or 'incidentId' in request body" },
        { status: 400 }
      );
    }
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { success: false, error: sanitizeErrorMessage(rawMessage) },
      { status: 500 }
    );
  }
}
