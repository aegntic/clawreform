/// <reference types="@cloudflare/workers-types" />
// Cloudflare Pages Function — handles POST /api/waitlist

interface Env {
  DB?: D1Database;
}

type WaitlistPayload = {
  email?: unknown;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

const INSERT_SQL = `
  INSERT INTO waitlist (email)
  VALUES (?1)
  ON CONFLICT(email) DO NOTHING
`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return null;
  }

  return email;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const db = env.DB;
  if (!db) {
    return jsonResponse({ error: "Waitlist storage is not configured." }, 503);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const body = rawBody && typeof rawBody === "object" ? (rawBody as WaitlistPayload) : null;
  const email = normalizeEmail(body?.email);
  if (!email) {
    return jsonResponse({ error: "A valid email address is required." }, 400);
  }

  try {
    const result = await db
      .prepare(INSERT_SQL)
      .bind(email)
      .run();

    if (!result.success) {
      console.error("[waitlist] D1 write returned unsuccessful result");
      return jsonResponse({ error: "Unable to store waitlist signup." }, 500);
    }

    console.info("[waitlist] signup stored");
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("[waitlist] storage failure", error);
    return jsonResponse({ error: "Unable to store waitlist signup." }, 500);
  }
};
