import { cn } from "@/lib/cn";

export function Badge(props: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "primary" | "danger" }) {
  const { className, tone = "neutral", ...rest } = props;
  const toneClass =
    tone === "primary"
      ? "bg-sahara-primary text-white"
      : tone === "danger"
        ? "bg-sahara-tertiary text-white"
        : "bg-sahara-surface-low text-sahara-fg";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-sahara-border/60",
        toneClass,
        className,
      )}
      {...rest}
    />
  );
}

