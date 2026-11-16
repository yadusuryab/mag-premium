// app/products/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/queries/product";
import ProductsSection from "@/components/sections/products";
import {
  Filters,
  MAX_PRICE,
  focusRing,
  type ArrayKey,
  type FilterOptions,
  type FilterState,
  type ToggleKey,
} from "@/components/product/filters";

// ─── Constants & helpers ──────────────────────────────────────────────────────
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

const DEFAULTS: FilterState = {
  q: "", minPrice: 0, maxPrice: MAX_PRICE, category: "", sort: "newest", page: 1, limit: 12,
  sizes: [], colors: [], features: [], brands: [],
  rating: 0, featured: false, inStock: true, onSale: false,
};

const EMPTY_OPTIONS: FilterOptions = { sizes: [], colors: [], features: [], brands: [] };

interface Category { _id: string; name: string; slug: string }
interface Facets {
  sizes?: string[] | null;
  colors?: string[] | null;
  features?: string[] | null;
  brand?: string | { name?: string; slug?: string } | null;
}
interface ApiResponse {
  success: boolean;
  message?: string;
  data: Product[];
  pagination: { total: number; hasNextPage: boolean };
}

const btn = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors";
const primary = cn(btn, "bg-black text-white hover:bg-neutral-700", focusRing);
const soft = cn(btn, "bg-neutral-100 text-black hover:bg-neutral-200", focusRing);
const wrap = "mx-auto w-full max-w-[1440px] px-4 sm:px-8";

const uniq = (a: string[], b?: string[] | null) =>
  Array.from(new Set([...a, ...(Array.isArray(b) ? b : [])])).sort();

function readFilters(sp: URLSearchParams): FilterState {
  const list = (k: string) => sp.get(k)?.split(",").filter(Boolean) ?? [];
  const num = (k: string, d: number) => {
    const n = parseInt(sp.get(k) ?? "", 10);
    return Number.isNaN(n) ? d : n;
  };
  return {
    ...DEFAULTS,
    q: sp.get("q") ?? "",
    minPrice: num("minPrice", 0),
    maxPrice: num("maxPrice", MAX_PRICE),
    category: sp.get("category") ?? "",
    sort: sp.get("sort") ?? "newest",
    page: Math.max(1, num("page", 1)),
    sizes: list("sizes"),
    colors: list("colors"),
    features: list("features"),
    brands: list("brands"),
    rating: num("rating", 0),
    featured: sp.get("featured") === "true",
    inStock: sp.get("inStock") !== "false",
    onSale: sp.get("onSale") === "true",
  };
}

function toUrlParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  const set = (k: string, v: string) => v && p.set(k, v);
  set("q", f.q);
  set("minPrice", f.minPrice > 0 ? String(f.minPrice) : "");
  set("maxPrice", f.maxPrice < MAX_PRICE ? String(f.maxPrice) : "");
  set("category", f.category);
  set("sort", f.sort !== "newest" ? f.sort : "");
  set("page", f.page > 1 ? String(f.page) : "");
  set("sizes", f.sizes.join(","));
  set("colors", f.colors.join(","));
  set("features", f.features.join(","));
  set("brands", f.brands.join(","));
  set("rating", f.rating > 0 ? String(f.rating) : "");
  set("featured", f.featured ? "true" : "");
  set("inStock", f.inStock ? "" : "false");
  set("onSale", f.onSale ? "true" : "");
  return p;
}

function toApiParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams({
    minPrice: String(f.minPrice),
    maxPrice: String(f.maxPrice),
    sort: f.sort,
    page: String(f.page),
    limit: String(f.limit),
  });
  const set = (k: string, v: string) => v && p.set(k, v);
  set("q", f.q);
  set("category", f.category);
  set("sizes", f.sizes.join(","));
  set("colors", f.colors.join(","));
  set("features", f.features.join(","));
  set("brands", f.brands.join(","));
  set("minRating", f.rating > 0 ? String(f.rating) : "");
  set("featured", f.featured ? "true" : "");
  set("excludeSoldOut", f.inStock ? "true" : "");
  set("onSale", f.onSale ? "true" : "");
  return p;
}

const countActive = (f: FilterState) =>
  [
    f.minPrice > 0, f.maxPrice < MAX_PRICE, !!f.category, f.sizes.length > 0, f.colors.length > 0,
    f.features.length > 0, f.brands.length > 0, f.rating > 0, f.featured, !f.inStock, f.onSale,
  ].filter(Boolean).length;

// ─── Small UI pieces ──────────────────────────────────────────────────────────
function SearchInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" strokeWidth={1.75} aria-hidden="true" />
      <input
        type="text"
        inputMode="search"
        aria-label="Search products"
        placeholder="Search products"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full rounded-full border border-transparent bg-neutral-100 pl-12 pr-11 text-base font-medium text-black placeholder:text-neutral-500",
          "focus-visible:border-black focus-visible:outline-none"
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className={cn("absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-neutral-200", focusRing)}
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

/** Mobile overlay: bottom sheet or right drawer. Hidden content is not focusable. */
function Sheet({
  open, onClose, label, side, children,
}: {
  open: boolean; onClose: () => void; label: string; side: "bottom" | "right"; children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-50 transition-[visibility] duration-300 md:hidden", !open && "invisible")}>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn("absolute inset-0 bg-black/50 transition-opacity duration-300 motion-reduce:transition-none", open ? "opacity-100" : "opacity-0")}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "absolute flex flex-col bg-white transition-transform duration-300 motion-reduce:transition-none",
          side === "right"
            ? cn("inset-y-0 right-0 w-full max-w-sm", open ? "translate-x-0" : "translate-x-full")
            : cn("inset-x-0 bottom-0 max-h-[85svh] rounded-t-3xl", open ? "translate-y-0" : "translate-y-full")
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 pl-5 pr-3">
          <h2 className="text-lg font-extrabold uppercase tracking-tight">{label}</h2>
          <button type="button" aria-label={`Close ${label.toLowerCase()}`} onClick={onClose} className={cn("flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-100", focusRing)}>
            <X className="h-6 w-6" strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function ProductsPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(() => readFilters(searchParams));
  const [search, setSearch] = useState(filters.q);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ total: 0, hasNextPage: false });
  const [options, setOptions] = useState<FilterOptions>(EMPTY_OPTIONS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Categories
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/categories", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: unknown) => setCategories(Array.isArray(d) ? (d as Category[]) : []))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  // Debounce search → filters
  useEffect(() => {
    const t = setTimeout(() => setFilters((p) => (p.q === search ? p : { ...p, q: search, page: 1 })), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Sync URL
  useEffect(() => {
    const qs = toUrlParams(filters).toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  }, [filters, router]);

  // Fetch products (aborts stale requests)
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/product?${toApiParams(filters)}`, { signal: ctrl.signal });
        const json: ApiResponse = await res.json();
        if (!json.success || !Array.isArray(json.data)) throw new Error(json.message);

        setProducts(json.data);
        setPagination({ total: json.pagination.total, hasNextPage: json.pagination.hasNextPage });

        // Accumulate filter options so they don't vanish while filtering
        setOptions((prev) => {
          const brands = new Map(prev.brands.map((b) => [b.slug, b]));
          let { sizes, colors, features } = prev;
          for (const item of json.data) {
            const f = item as unknown as Facets;
            sizes = uniq(sizes, f.sizes);
            colors = uniq(colors, f.colors);
            features = uniq(features, f.features);
            const slug = typeof f.brand === "string" ? f.brand : f.brand?.slug ?? f.brand?.name;
            if (slug) brands.set(slug, { slug, name: typeof f.brand === "object" && f.brand?.name ? f.brand.name : slug });
          }
          return { sizes, colors, features, brands: Array.from(brands.values()).sort((a, b) => a.name.localeCompare(b.name)) };
        });
      } catch {
        if (!ctrl.signal.aborted) setError("We couldn’t load products. Check your connection and try again.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [filters, retry]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const onChange = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => setFilters((p) => ({ ...p, [key]: value, page: 1 })),
    []
  );
  const onToggleArray = useCallback(
    (key: ArrayKey, value: string) =>
      setFilters((p) => ({
        ...p,
        [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value],
        page: 1,
      })),
    []
  );
  const onToggle = useCallback((key: ToggleKey) => setFilters((p) => ({ ...p, [key]: !p[key], page: 1 })), []);
  const onPrice = useCallback(
    ([minPrice, maxPrice]: [number, number]) => setFilters((p) => ({ ...p, minPrice, maxPrice, page: 1 })),
    []
  );
  const clearAll = () => {
    setSearch("");
    setFilters(DEFAULTS);
  };
  const goToPage = (page: number) => {
    setFilters((p) => ({ ...p, page }));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const closeSort = useCallback(() => setSortOpen(false), []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const activeCount = countActive(filters);
  const categoryName = categories.find((c) => c.slug === filters.category)?.name;
  const sortLabel = SORTS.find((s) => s.value === filters.sort)?.label ?? "Sort";
  const totalPages = Math.max(1, Math.ceil(pagination.total / filters.limit));
  const firstPage = Math.max(1, Math.min(filters.page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => firstPage + i);

  const chips: Array<{ key: string; label: string; remove: () => void }> = [
    ...(filters.category ? [{ key: "cat", label: categoryName ?? filters.category, remove: () => onChange("category", "") }] : []),
    ...filters.brands.map((b) => ({ key: `b-${b}`, label: options.brands.find((o) => o.slug === b)?.name ?? b, remove: () => onToggleArray("brands", b) })),
    ...filters.sizes.map((s) => ({ key: `s-${s}`, label: s, remove: () => onToggleArray("sizes", s) })),
    ...filters.colors.map((c) => ({ key: `c-${c}`, label: c, remove: () => onToggleArray("colors", c) })),
    ...filters.features.map((f) => ({ key: `f-${f}`, label: f, remove: () => onToggleArray("features", f) })),
    ...(filters.rating > 0 ? [{ key: "r", label: `${filters.rating} stars & up`, remove: () => onChange("rating", 0) }] : []),
    ...(filters.onSale ? [{ key: "sale", label: "On sale", remove: () => onToggle("onSale") }] : []),
    ...(filters.featured ? [{ key: "feat", label: "Featured", remove: () => onToggle("featured") }] : []),
    ...(!filters.inStock ? [{ key: "stock", label: "Include sold out", remove: () => onToggle("inStock") }] : []),
  ];

  const filterPanel = (
    <Filters filters={filters} options={options} categories={categories} onChange={onChange} onToggleArray={onToggleArray} onPrice={onPrice} onToggle={onToggle} />
  );

  return (
    <div className="min-h-svh bg-white text-black">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className={cn(wrap, "flex flex-wrap items-center gap-2 py-3")}>
          <p className="mr-auto hidden text-sm font-medium text-neutral-500 md:block" aria-live="polite">
            {loading ? "Loading…" : `${pagination.total} items`}
          </p>

          <SearchInput value={search} onChange={setSearch} className="w-full md:w-64" />

          <button type="button" onClick={() => setFiltersOpen(true)} className={cn(soft, "flex-1 md:hidden")}>
            <SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1 text-[11px] font-bold text-white">{activeCount}</span>
            )}
          </button>
          <button type="button" onClick={() => setSortOpen(true)} className={cn(soft, "flex-1 md:hidden")}>
            <span className="truncate">{sortLabel}</span>
            <ChevronDown className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          </button>

          <div className="relative hidden md:block">
            <select
              aria-label="Sort products"
              value={filters.sort}
              onChange={(e) => onChange("sort", e.target.value)}
              className={cn("h-11 cursor-pointer appearance-none rounded-full bg-neutral-100 pl-5 pr-11 text-sm font-semibold text-black hover:bg-neutral-200", focusRing)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2" strokeWidth={1.75} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Active filters */}
      {chips.length > 0 && (
        <div className={cn(wrap, "flex items-center gap-2 overflow-x-auto py-3")}>
          <button type="button" onClick={clearAll} className={cn("shrink-0 rounded-full px-3 py-2 text-sm font-semibold underline underline-offset-4", focusRing)}>
            Clear all
          </button>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.remove}
              aria-label={`Remove filter ${c.label}`}
              className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-100 py-2 pl-4 pr-3 text-sm font-medium capitalize hover:bg-neutral-200", focusRing)}
            >
              {c.label}
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className={cn(wrap, "flex gap-8 pb-10")}>
        <aside className="hidden w-64 shrink-0 md:block" aria-label="Filters">
          <div className="sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto overscroll-contain pt-4">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-extrabold uppercase tracking-tight">Filters</h2>
              {activeCount > 0 && (
                <button type="button" onClick={clearAll} className={cn("rounded-full px-2 py-1 text-sm font-semibold underline underline-offset-4", focusRing)}>
                  Clear all
                </button>
              )}
            </div>
            {filterPanel}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {error ? (
            <div role="alert" className="flex flex-col items-center py-24 text-center">
              <p className="text-xl font-extrabold uppercase tracking-tight">Something went wrong</p>
              <p className="mt-2 max-w-sm text-base font-medium text-neutral-500">{error}</p>
              <button type="button" onClick={() => setRetry((n) => n + 1)} className={cn(primary, "mt-6")}>
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* Section brings its own horizontal padding; cancel it so the grid aligns with the page edge */}
              <div className="-mx-4 sm:-mx-8">
                <ProductsSection
                  products={products}
                  loading={loading}
                  deskCols={3}
                  title={categoryName ?? "All products"}
                  desc={filters.q ? `Results for “${filters.q}”` : "Discover our complete collection"}
                />
              </div>

              {totalPages > 1 && (
                <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-2">
                  <button type="button" aria-label="Previous page" disabled={filters.page === 1} onClick={() => goToPage(filters.page - 1)} className={cn(soft, "w-11 px-0 disabled:pointer-events-none disabled:opacity-30")}>
                    ‹
                  </button>
                  {pages.map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Page ${n}`}
                      aria-current={n === filters.page ? "page" : undefined}
                      onClick={() => goToPage(n)}
                      className={cn(btn, "w-11 px-0", n === filters.page ? "bg-black text-white" : "text-black hover:bg-neutral-100", focusRing)}
                    >
                      {n}
                    </button>
                  ))}
                  <button type="button" aria-label="Next page" disabled={!pagination.hasNextPage} onClick={() => goToPage(filters.page + 1)} className={cn(soft, "w-11 px-0 disabled:pointer-events-none disabled:opacity-30")}>
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile filters drawer */}
      <Sheet open={filtersOpen} onClose={closeFilters} label="Filters" side="right">
        <div className="flex-1 overflow-y-auto overscroll-contain px-5">
          {filtersOpen && filterPanel}
        </div>
        <div className="flex shrink-0 gap-2 border-t border-neutral-200 p-4">
          {activeCount > 0 && (
            <button type="button" onClick={clearAll} className={soft}>Clear</button>
          )}
          <button type="button" onClick={closeFilters} className={cn(primary, "flex-1")}>
            Show {pagination.total} results
          </button>
        </div>
      </Sheet>

      {/* Mobile sort sheet */}
      <Sheet open={sortOpen} onClose={closeSort} label="Sort by" side="bottom">
        <div className="overflow-y-auto p-3 pb-8">
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={filters.sort === s.value}
              onClick={() => {
                onChange("sort", s.value);
                closeSort();
              }}
              className={cn(
                "flex min-h-12 w-full items-center justify-between rounded-full px-5 text-left text-base font-semibold transition-colors",
                filters.sort === s.value ? "bg-black text-white" : "hover:bg-neutral-100",
                focusRing
              )}
            >
              {s.label}
              {filters.sort === s.value && <Check className="h-5 w-5" strokeWidth={2} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-white" aria-busy="true" />}>
      <ProductsPageComponent />
    </Suspense>
  );
}