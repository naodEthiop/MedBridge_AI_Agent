import { NextResponse } from "next/server";

// Back-compat route: delegate to MCP symptom checker.

export async function POST(req: Request) {
  const body = (await req.json()) as { message?: string; bodyPart?: string | null };
  const message = body.message?.trim() || "";
  const res = await fetch(new URL("/api/mcp", req.url), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ tool: "symptom_checker", input: { message, bodyPart: body.bodyPart ?? null } }),
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}

