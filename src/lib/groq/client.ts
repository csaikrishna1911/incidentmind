import Groq from "groq-sdk";

if (typeof window !== "undefined") {
  throw new Error("Groq client must only run on the server");
}

export const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-120b";

let clientInstance: Groq | null = null;

/**
 * Returns a reusable singleton instance of the Groq client.
 * Strictly server-side; validates GROQ_API_KEY from environment variables.
 */
export function getGroqClient(): Groq {
  if (typeof window !== "undefined") {
    throw new Error("Groq client must only run on the server");
  }

  if (clientInstance) {
    return clientInstance;
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || !apiKey.trim() || apiKey === "PASTE_THE_REAL_KEY_HERE") {
    throw new Error(
      "Configuration error: Missing or unconfigured required environment variable GROQ_API_KEY."
    );
  }

  clientInstance = new Groq({
    apiKey: apiKey.trim(),
  });

  return clientInstance;
}

/**
 * Reusable Groq client proxy. Resolves the client instance lazily on first call
 * so that importing this module during build / static analysis does not throw
 * if the environment variable has not yet been populated.
 */
export const groq = new Proxy({} as Groq, {
  get(_target, prop) {
    const client = getGroqClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Strips secret API keys from error messages before exposure.
 */
export function sanitizeGroqErrorMessage(rawMessage: string): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && apiKey.trim().length > 5) {
    return rawMessage.replaceAll(apiKey.trim(), "[REDACTED]");
  }
  return rawMessage;
}
