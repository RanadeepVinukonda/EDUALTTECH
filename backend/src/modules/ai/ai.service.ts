import { config } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";

const TIMEOUT_MS = 30_000;

/**
 * Call the configured OpenAI-compatible chat completions endpoint.
 * Throws a mapped ApiError on failure — never returns a fake reply.
 */
export async function generateReply(prompt: string): Promise<string> {
  if (!config.ai.apiKey || !config.ai.baseUrl || !config.ai.model) {
    throw ApiError.badGateway(
      "The AI assistant is not configured yet — set AI_PROVIDER_API_KEY, AI_PROVIDER_BASE_URL and AI_MODEL in backend/.env"
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${config.ai.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages: [
          {
            role: "system",
            content:
              "You are Edu-Alt-Tech's study assistant for school students. Answer clearly, concisely, and age-appropriately. Encourage understanding over memorisation.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw ApiError.badGateway("AI provider rejected the API key — check AI_PROVIDER_API_KEY");
      }
      if (res.status === 429) {
        throw ApiError.tooMany("AI provider rate limit reached — try again in a moment");
      }
      throw ApiError.badGateway(`AI provider returned ${res.status}`);
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw ApiError.badGateway("AI provider returned an empty response");
    return reply;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw ApiError.badGateway("AI provider timed out — try again");
    }
    logger.error("AI provider request failed", { err });
    throw ApiError.badGateway("AI provider is unreachable");
  } finally {
    clearTimeout(timer);
  }
}

/** Cheap per-user in-memory throttle so a student cannot drain the provider. */
const RATE = { windowMs: 30_000, max: 12 };
const seen = new Map<string, number[]>();

export function assertWithinRate(userId: string): void {
  const now = Date.now();
  const windowStart = now - RATE.windowMs;
  const hits = (seen.get(userId) ?? []).filter((t) => t > windowStart);
  if (hits.length >= RATE.max) {
    throw ApiError.tooMany(`You are sending messages too quickly — wait a few seconds`);
  }
  hits.push(now);
  seen.set(userId, hits);
  if (seen.size > 10_000) {
    for (const [key, times] of seen) {
      if (times.every((t) => t <= windowStart)) seen.delete(key);
    }
  }
}