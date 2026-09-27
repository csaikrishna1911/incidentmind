import { NextResponse } from "next/server";
import { getHindsightClient, getHindsightBankId } from "@/lib/hindsight";

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

    const { query } = body as { query: unknown };

    if (typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "The 'query' field must be a non-empty string" },
        { status: 400 }
      );
    }

    const bankId = getHindsightBankId();
    const client = getHindsightClient();

    const response = await client.recall(bankId, query.trim());

    return NextResponse.json({
      success: true,
      memories: response.results || [],
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const apiKey = process.env.HINDSIGHT_API_KEY;
    const sanitizedMessage = apiKey && apiKey !== "PASTE_THE_REAL_KEY_HERE"
      ? rawMessage.replaceAll(apiKey, "[REDACTED]")
      : rawMessage;

    return NextResponse.json(
      { success: false, error: sanitizedMessage },
      { status: 500 }
    );
  }
}
