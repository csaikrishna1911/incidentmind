import { NextResponse } from "next/server";
import {
  getHindsightClient,
  getHindsightBankId,
  sanitizeErrorMessage,
} from "@/lib/hindsight";

export async function GET() {
  try {
    const bankId = getHindsightBankId();
    const baseUrl = process.env.HINDSIGHT_BASE_URL;
    const apiKey = process.env.HINDSIGHT_API_KEY;

    if (!baseUrl) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: "HINDSIGHT_BASE_URL environment variable is missing",
        },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey === "PASTE_THE_REAL_KEY_HERE") {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: "HINDSIGHT_API_KEY is not configured",
        },
        { status: 500 }
      );
    }

    // Verify client initialization
    getHindsightClient();

    return NextResponse.json({
      success: true,
      configured: true,
      bankId,
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: sanitizeErrorMessage(rawMessage),
      },
      { status: 500 }
    );
  }
}
