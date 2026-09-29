import { HindsightClient } from "@vectorize-io/hindsight-client";

let clientInstance: HindsightClient | null = null;

/**
 * Returns a reusable singleton instance of the HindsightClient.
 * Validates that required environment variables exist.
 * Keeps credentials strictly server-side.
 */
export function getHindsightClient(): HindsightClient {
  if (typeof window !== "undefined") {
    throw new Error("Hindsight client can only be used on the server.");
  }

  if (clientInstance) {
    return clientInstance;
  }

  const baseUrl = process.env.HINDSIGHT_BASE_URL;
  const apiKey = process.env.HINDSIGHT_API_KEY;

  if (!baseUrl) {
    throw new Error(
      "Configuration error: Missing required environment variable HINDSIGHT_BASE_URL."
    );
  }

  if (!apiKey || apiKey === "PASTE_THE_REAL_KEY_HERE") {
    throw new Error(
      "Configuration error: Missing or unconfigured required environment variable HINDSIGHT_API_KEY."
    );
  }

  clientInstance = new HindsightClient({
    baseUrl,
    apiKey,
  });

  return clientInstance;
}

/**
 * Reads and validates the configured Hindsight bank ID.
 */
export function getHindsightBankId(): string {
  const bankId = process.env.HINDSIGHT_BANK_ID;
  if (!bankId) {
    throw new Error(
      "Configuration error: Missing required environment variable HINDSIGHT_BANK_ID."
    );
  }
  return bankId;
}

/**
 * Sanitizes any potential API key leakage from error messages.
 */
export function sanitizeErrorMessage(rawMessage: string): string {
  const apiKey = process.env.HINDSIGHT_API_KEY;
  if (apiKey && apiKey !== "PASTE_THE_REAL_KEY_HERE") {
    return rawMessage.replaceAll(apiKey, "[REDACTED]");
  }
  return rawMessage;
}

/**
 * Compatibility exports for legacy or JavaScript consumers expecting
 * `import { hindsight, BANK_ID } from "@/lib/hindsight"`.
 */
export const BANK_ID = process.env.HINDSIGHT_BANK_ID || "incidentmind";

export const hindsight = new Proxy({} as HindsightClient, {
  get(_target, prop) {
    const client = getHindsightClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

