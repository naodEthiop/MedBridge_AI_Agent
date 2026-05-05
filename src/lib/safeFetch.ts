export async function safeFetch<T = any>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Accept": "application/json",
        ...(options?.headers || {}),
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${res.status}`);
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error(`[FETCH ERROR] ${url}`, err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Network request failed" 
    };
  }
}
