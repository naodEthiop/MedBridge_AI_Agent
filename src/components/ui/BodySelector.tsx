"use client";

export type BodyRegion = "head" | "chest" | "stomach" | "back" | "arms" | "legs";

const regions: Array<{ id: BodyRegion; label: string; d: string }> = [
  {
    id: "head",
    label: "Head",
    d: "M50 8c6.5 0 11.8 5.3 11.8 11.8S56.5 31.6 50 31.6 38.2 26.3 38.2 19.8 43.5 8 50 8z",
  },
  { id: "chest", label: "Chest", d: "M33 33h34v20H33z" },
  { id: "stomach", label: "Stomach", d: "M35 54h30v20H35z" },
  { id: "arms", label: "Arms", d: "M20 34h12v36H20zM68 34h12v36H68z" },
  { id: "legs", label: "Legs", d: "M38 74h10v34H38zM52 74h10v34H52z" },
  { id: "back", label: "Back", d: "M33 33h34v41H33z" },
];

export function BodySelector(props: {
  value: BodyRegion | null;
  onChange: (region: BodyRegion) => void;
}) {
  return (
    <div className="rounded-2xl border border-sahara-border/60 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Body region</p>
        <p className="text-xs text-sahara-muted">{props.value ? props.value : "Not selected"}</p>
      </div>
      <svg viewBox="0 0 100 120" className="mx-auto w-full max-w-[260px]">
        <ellipse
          cx="50"
          cy="58"
          rx="28"
          ry="48"
          fill="rgb(250 248 244)"
          stroke="rgb(228 220 210)"
          strokeWidth="1.5"
          className="pointer-events-none"
        />
        {regions
          .filter((r) => r.id !== "back")
          .map((r) => {
            const active = props.value === r.id;
            return (
              <path
                key={r.id}
                d={r.d}
                onClick={() => props.onChange(r.id)}
                className="cursor-pointer transition-colors"
                fill={active ? "rgb(194 101 42 / 0.25)" : "rgb(236 230 220)"}
                stroke={active ? "rgb(194 101 42)" : "rgb(216 208 200)"}
                strokeWidth="2"
              >
                <title>{r.label}</title>
              </path>
            );
          })}
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["head", "chest", "stomach", "back", "arms", "legs"] as BodyRegion[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => props.onChange(r)}
            className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${
              props.value === r
                ? "border-sahara-primary bg-sahara-primary/10 text-sahara-primary"
                : "border-sahara-border/70 bg-white text-sahara-muted hover:text-sahara-fg"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

