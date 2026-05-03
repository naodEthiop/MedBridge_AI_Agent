/**
 * Same-origin API helper: cookies, optional Bearer, `{ ok, error }` handling.
 */

export function withBearer(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export type ApiSuccess<T> = { success: true; data: T; status: number };
export type ApiFailure = { success: false; error: string; status: number };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

function errorMessageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string") {
    return (body as { error: string }).error;
  }
  return fallback;
}

export async function apiFetchJson<T>(path: string, init: RequestInit & { bearerToken?: string | null } = {}): Promise<ApiResult<T>> {
  const { bearerToken, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const res = await fetch(path, {
    ...rest,
    credentials: "include",
    headers,
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { raw: text };
    }
  }

  if (res.status === 401) {
    return {
      success: false,
      error: errorMessageFromBody(body, "Unauthorized"),
      status: 401,
    };
  }

  if (!res.ok) {
    return {
      success: false,
      error: errorMessageFromBody(body, `Request failed (${res.status})`),
      status: res.status,
    };
  }

  if (body && typeof body === "object" && "ok" in body && (body as { ok: unknown }).ok === false) {
    return {
      success: false,
      error: errorMessageFromBody(body, "Request failed"),
      status: res.status,
    };
  }

  return { success: true, data: body as T, status: res.status };
}

export type CaseItemNormalized = {
  id: string;
  symptoms: string;
  urgency: "medium" | "urgent";
  doctorSummary: string;
  createdAt: string;
  redFlags: string[];
};

export function normalizeCaseRow(row: Record<string, unknown>): CaseItemNormalized {
  const urgencyRaw = String(row.urgency ?? "medium").toLowerCase();
  const urgency: "medium" | "urgent" = urgencyRaw === "urgent" ? "urgent" : "medium";
  const redFlags =
    Array.isArray(row.redFlags) ? row.redFlags.filter((x): x is string => typeof x === "string")
    : Array.isArray(row.red_flags) ? row.red_flags.filter((x): x is string => typeof x === "string")
    : [];
  return {
    id: String(row.id ?? ""),
    symptoms: String(row.symptoms ?? ""),
    urgency,
    doctorSummary: String(row.doctorSummary ?? row.doctor_summary ?? ""),
    createdAt: String(row.createdAt ?? row.created_at ?? ""),
    redFlags,
  };
}

export function extractTriagePayload(parsed: Record<string, unknown>): Record<string, unknown> {
  const triage = parsed.triage;
  if (triage && typeof triage === "object") {
    return triage as Record<string, unknown>;
  }
  const result = parsed.result;
  if (result && typeof result === "object") {
    return result as Record<string, unknown>;
  }
  return parsed;
}

/** Normalize `/api/symptoms/triage` body for display or downstream Medix context. */
export function triageToContextLines(parsed: Record<string, unknown>): string[] {
  const t = extractTriagePayload(parsed);
  const lines: string[] = [];
  if (typeof t.message === "string" && t.message.trim()) {
    lines.push(`Triage narrative: ${t.message.trim()}`);
  }
  if (typeof t.urgency === "string") {
    lines.push(`Triage urgency: ${t.urgency}`);
  }
  if (Array.isArray(t.possibleConditions) && t.possibleConditions.length) {
    lines.push(`Triage considerations: ${(t.possibleConditions as string[]).join(", ")}`);
  }
  if (Array.isArray(t.redFlags) && t.redFlags.length) {
    lines.push(`Triage red flags: ${(t.redFlags as string[]).join("; ")}`);
  }
  if (Array.isArray(t.nextSteps) && t.nextSteps.length) {
    lines.push(`Triage next steps: ${(t.nextSteps as string[]).join("; ")}`);
  }
  return lines;
}

export type ImageAnalysisOk = {
  ok: true;
  findings: string[];
  possibleConditions: string[];
  confidence: number;
  urgency: string;
  recommendation?: string;
};

/** Build Medix `imageFindings` strings from `/api/ai/image-analysis` JSON. */
export function imageAnalysisToFindings(payload: Record<string, unknown>): string[] {
  const findings = Array.isArray(payload.findings) ? payload.findings.filter((x): x is string => typeof x === "string") : [];
  const conds = Array.isArray(payload.possibleConditions)
    ? payload.possibleConditions.filter((x): x is string => typeof x === "string")
    : [];
  const out = [...findings, ...conds.map((c) => `Visual context (non-diagnostic): ${c}`)];
  if (typeof payload.recommendation === "string" && payload.recommendation.trim()) {
    out.push(`Image summary: ${payload.recommendation.trim()}`);
  }
  return out;
}
