// components/ui/price-chips.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PriceChipsProps {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  /** Upper bound of the price scale */
  max?: number;
  currency?: string;
  className?: string;
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

const fmt = (n: number) => n.toLocaleString("en-IN");

export const PriceChips = ({ value, onValueChange, max = 50000, currency = "₹", className }: PriceChipsProps) => {
  const c = currency;
  const ranges = [
    { label: `Under ${c}${fmt(1000)}`, min: 0, max: 1000 },
    { label: `${c}${fmt(1000)} – ${fmt(3000)}`, min: 1000, max: 3000 },
    { label: `${c}${fmt(3000)} – ${fmt(5000)}`, min: 3000, max: 5000 },
    { label: `${c}${fmt(5000)}+`, min: 5000, max },
    { label: "All prices", min: 0, max },
  ];

  // Inputs edit a local draft and commit on blur/Enter, so typing doesn't trigger a fetch per keystroke
  const [draft, setDraft] = useState({ min: String(value[0]), max: String(value[1]) });
  useEffect(() => setDraft({ min: String(value[0]), max: String(value[1]) }), [value]);

  const commit = () => {
    const clamp = (s: string, fallback: number) => Math.min(max, Math.max(0, s === "" ? fallback : Number(s)));
    const a = clamp(draft.min, 0);
    const b = clamp(draft.max, max);
    const next: [number, number] = a <= b ? [a, b] : [b, a];
    if (next[0] !== value[0] || next[1] !== value[1]) onValueChange(next);
    else setDraft({ min: String(next[0]), max: String(next[1]) });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Price ranges">
        {ranges.map((r) => {
          const active = value[0] === r.min && value[1] === r.max;
          return (
            <button
              key={r.label}
              type="button"
              aria-pressed={active}
              onClick={() => onValueChange([r.min, r.max])}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-black hover:border-black",
                focusRing
              )}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-500">Custom range</p>
        <div className="flex items-center gap-2">
          {(["min", "max"] as const).map((k, i) => (
            <div key={k} className="flex flex-1 items-center gap-2">
              {i === 1 && <span className="text-neutral-400" aria-hidden="true">–</span>}
              <input
                type="text"
                inputMode="numeric"
                aria-label={k === "min" ? "Minimum price" : "Maximum price"}
                placeholder={k === "min" ? "Min" : "Max"}
                value={draft[k]}
                onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value.replace(/\D/g, "") }))}
                onBlur={commit}
                onKeyDown={(e) => e.key === "Enter" && commit()}
                className="h-11 w-full min-w-0 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-black placeholder:text-neutral-500 focus-visible:border-black focus-visible:outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};