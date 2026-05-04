import { useEffect, useRef, useState } from "react";

/**
 * Smart chat scroll hook that mimics ChatGPT behavior:
 * - Only auto-scrolls when user is at the bottom
 * - Does not interrupt user scrolling up to read history
 * - Tracks whether user is at bottom for UI feedback
 */
export function useChatScroll(messages: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  // Track scroll position
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    // Consider user "at bottom" if within 80px of the bottom
    const threshold = 80;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    setIsUserAtBottom(atBottom);
  };

  // Attach scroll listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll only when user is at bottom and new messages arrive
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isUserAtBottom) return;

    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, isUserAtBottom]);

  return { containerRef, isUserAtBottom };
}
