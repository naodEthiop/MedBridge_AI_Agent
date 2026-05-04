/**
 * Converts technical error messages into friendly, user-facing text.
 * Always defaults to simple, non-technical messages.
 */

export function cleanErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");

  // Network/connection errors
  if (
    message.includes("Failed to fetch") ||
    message.includes("network") ||
    message.includes("ECONNREFUSED") ||
    message.includes("timeout")
  ) {
    return "Connection issue. Check your internet and try again.";
  }

  // API/server errors
  if (
    message.includes("503") ||
    message.includes("502") ||
    message.includes("500") ||
    message.includes("server") ||
    message.includes("unable to connect")
  ) {
    return "We're having trouble reaching our servers. Please try again shortly.";
  }

  // Auth errors
  if (message.includes("401") || message.includes("unauthorized") || message.includes("not authenticated")) {
    return "Your session has expired. Please sign in again.";
  }

  if (message.includes("403") || message.includes("permission") || message.includes("forbidden")) {
    return "You don't have access to this.";
  }

  // Validation/bad request
  if (message.includes("400") || message.includes("Invalid")) {
    return "Something wasn't quite right. Please check your input and try again.";
  }

  // Not found
  if (message.includes("404") || message.includes("not found")) {
    return "This item doesn't exist. It may have been deleted.";
  }

  // File/upload errors
  if (message.includes("image") || message.includes("file")) {
    return "There was an issue with your image. Try a different one.";
  }

  // AI/Analysis errors
  if (message.includes("Gemini") || message.includes("analysis") || message.includes("API_KEY")) {
    return "Analysis service is currently unavailable. Please try again.";
  }

  // Default fallback
  if (message.length > 0 && message !== "Error") {
    // If the message is already friendly, use it
    if (!message.match(/^[A-Z][a-z]/)) {
      return message;
    }
  }

  return "Something went wrong. Please try again or contact support if the issue persists.";
}

/**
 * Wraps an async operation and converts errors to user-friendly messages
 */
export async function withFriendlyError<T>(operation: () => Promise<T>): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const data = await operation();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: cleanErrorMessage(error) };
  }
}
