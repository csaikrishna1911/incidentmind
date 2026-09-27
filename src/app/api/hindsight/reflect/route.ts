import { NextResponse } from "next/server";
import { reflectOnIncident, sanitizeErrorMessage } from "@/lib/hindsight";

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

    if (!body || typeof body !== "object" || !("query" in body)) {
      return NextResponse.json(
        { success: false, error: "Missing required 'query' field in request body" },
        { status: 400 }
      );
    }

    const { query, context, tags } = body as {
      query: unknown;
      context?: unknown;
      tags?: unknown;
    };

    if (typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "The 'query' field must be a non-empty string" },
        { status: 400 }
      );
    }

    const result = await reflectOnIncident({
      query: query.trim(),
      context: typeof context === "string" ? context : undefined,
      tags: Array.isArray(tags) ? (tags as string[]) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { success: false, error: sanitizeErrorMessage(rawMessage) },
      { status: 500 }
    );
  }
}
