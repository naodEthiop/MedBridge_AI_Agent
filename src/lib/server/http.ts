export async function fetchWithTimeout(
  input: string,
  init: RequestInit & { timeoutMs?: number } = {},
) {
  const { timeoutMs = 7000, ...rest } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export function jsonError(message: string) {
  return { success: false as const, error: { message } };
}

