import { HindsightClient } from "@vectorize-io/hindsight-client";

/**
 * Hindsight Cloud client for persistent incident memory.
 *
 * Hindsight stores and retrieves "memories" — things the system has
 * learned from past incidents. This enables IncidentMind to say
 * "We've seen something like this before" and recommend solutions.
 *
 * Configuration:
 *   - HINDSIGHT_API_KEY: your Hindsight Cloud API key (server-only, no NEXT_PUBLIC_ prefix)
 *   - Bank ID: "incidentmind" (a memory bank is like a folder for memories)
 *
 * Usage:
 *   import { hindsight, BANK_ID } from "@/lib/hindsight";
 *   await hindsight.retain(BANK_ID, "The payment API crashed due to connection pool exhaustion.");
 *   const results = await hindsight.recall(BANK_ID, "payment API is returning 503 errors");
 */

const apiKey = process.env.HINDSIGHT_API_KEY;

if (!apiKey) {
  // Don't crash the app — but warn loudly so developers know
  console.warn(
    "⚠️  HINDSIGHT_API_KEY is not set. Hindsight memory features will not work. " +
    "Add it to .env.local to enable incident memory."
  );
}

/**
 * The Hindsight Cloud client instance.
 * Will be null if the API key is not configured.
 */
export const hindsight = apiKey
  ? new HindsightClient({
      baseUrl: "https://api.hindsight.vectorize.io",
      apiKey,
    })
  : null;

/**
 * The memory bank ID where all incident learnings are stored.
 * Think of it as a "folder" inside Hindsight that holds our memories.
 */
export const BANK_ID = "incidentmind";
