// components/product/filters.tsx
"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceChips } from "@/components/ui/price-slider";

export const MAX_PRICE = 50000;

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

export type ArrayKey = "sizes" | "colors" | "features" | "brands";
export type ToggleKey = "featured" | "inStock" | "onSale";

export interface FilterState {
  q: string;
  minPrice: number;
  maxPrice: number;
  category: string;
  sort: string;
  page: number;
  limit: number;
  sizes: string[];
  colors: string[];
  features: string[];
  brands: string[];
  rating: number;
  featured: boolean;
  inStock: boolean;
  onSale: boolean;
}

export interface FilterOptions {
  sizes: string[];
  colors: string[];
  features: string[];
  brands: Array<{ slug: string; name: string }>;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface FiltersProps {
  filters: FilterState;
  options: FilterOptions;
  categories: Category[];
  onChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onToggleArray: (key: ArrayKey, value: string) => void;
  onPrice: (value: [number, number]) => void;
  onToggle: (key: ToggleKey) => void;
}

// ─── Building blocks ──────────────────────────────────────────────────────────
function Section({
  title,
  count = 0,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="py-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn("flex min-h-11 w-full items-center justify-between rounded-full text-left", focusRing)}
      >
        <span className="flex items-center gap-2 text-base font-bold text-black">
          {title}
          {count > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1 text-[11px] font-bold text-white">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("h-5 w-5 text-neutral-500 transition-transform motion-reduce:transition-none", open && "rotate-180")}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
      {open && <div className="pb-2 pt-2">{children}</div>}
    </section>
  );
}

function Pill({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-black hover:border-black",
        focusRing,
        className
      )}
    >
      {children}
    </button>
  );
}

function Row({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-full px-4 py-2.5 text-left text-sm font-medium transition-colors",
        active ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100",
        focusRing
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      {active && <Check className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />}
    </button>
  );
}

const LIGHT = ["white", "ivory", "cream", "beige", "yellow", "lime"];

function Swatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  const light = LIGHT.some((l) => color.toLowerCase().includes(l));
  return (
    <button
      type="button"
      aria-label={color}
      aria-pressed={active}
      title={color}
      onClick={onClick}
      style={{ backgroundColor: color.toLowerCase() }}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 transition-transform active:scale-95 motion-reduce:transition-none",
        active && "ring-2 ring-black ring-offset-2",
        focusRing
      )}
    >
      {active && <Check className={cn("h-4 w-4", light ? "text-black" : "text-white")} strokeWidth={2} aria-hidden="true" />}
    </button>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export function Filters({ filters, options, categories, onChange, onToggleArray, onPrice, onToggle }: FiltersProps) {
  const priceActive = filters.minPrice > 0 || filters.maxPrice < MAX_PRICE ? 1 : 0;

  return (
    <div className="divide-y divide-neutral-200">
      <Section title="Quick filters" defaultOpen>
        <div className="flex flex-wrap gap-2">
          <Pill active={filters.featured} onClick={() => onToggle("featured")}>Featured</Pill>
          <Pill active={filters.onSale} onClick={() => onToggle("onSale")}>On sale</Pill>
          <Pill active={filters.inStock} onClick={() => onToggle("inStock")}>In stock only</Pill>
        </div>
      </Section>

      <Section title="Price" count={priceActive} defaultOpen>
        <PriceChips value={[filters.minPrice, filters.maxPrice]} onValueChange={onPrice} max={MAX_PRICE} currency="₹" />
      </Section>

      {categories.length > 0 && (
        <Section title="Category" count={filters.category ? 1 : 0} defaultOpen>
          <div className="flex flex-col gap-0.5">
            <Row active={!filters.category} onClick={() => onChange("category", "")}>All categories</Row>
            {categories.map((c) => (
              <Row key={c._id} active={filters.category === c.slug} onClick={() => onChange("category", c.slug)}>
                {c.name}
              </Row>
            ))}
          </div>
        </Section>
      )}

      {options.brands.length > 0 && (
        <Section title="Brand" count={filters.brands.length}>
          <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto overscroll-contain">
            {options.brands.map((b) => (
              <Row key={b.slug} active={filters.brands.includes(b.slug)} onClick={() => onToggleArray("brands", b.slug)}>
                {b.name}
              </Row>
            ))}
          </div>
        </Section>
      )}

      {options.sizes.length > 0 && (
        <Section title="Size" count={filters.sizes.length}>
          <div className="grid grid-cols-4 gap-2">
            {options.sizes.map((s) => (
              <Pill key={s} active={filters.sizes.includes(s)} onClick={() => onToggleArray("sizes", s)} className="px-0 text-center">
                {s}
              </Pill>
            ))}
          </div>
        </Section>
      )}

      {options.colors.length > 0 && (
        <Section title="Color" count={filters.colors.length}>
          <div className="flex flex-wrap gap-3 p-1">
            {options.colors.map((c) => (
              <Swatch key={c} color={c} active={filters.colors.includes(c)} onClick={() => onToggleArray("colors", c)} />
            ))}
          </div>
        </Section>
      )}

      {options.features.length > 0 && (
        <Section title="Features" count={filters.features.length}>
          <div className="flex flex-col gap-0.5">
            {options.features.map((f) => (
              <Row key={f} active={filters.features.includes(f)} onClick={() => onToggleArray("features", f)}>
                {f}
              </Row>
            ))}
          </div>
        </Section>
      )}

      <Section title="Rating" count={filters.rating > 0 ? 1 : 0}>
        <div className="flex flex-col gap-0.5">
          {[4, 3, 2, 1].map((r) => (
            <Row key={r} active={filters.rating === r} onClick={() => onChange("rating", filters.rating === r ? 0 : r)}>
              <span className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < r ? "fill-current" : "opacity-30")} strokeWidth={1.75} />
                ))}
              </span>
              <span>{r} & up</span>
            </Row>
          ))}
        </div>
      </Section>
    </div>
  );
}