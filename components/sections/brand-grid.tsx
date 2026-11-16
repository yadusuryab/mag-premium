"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brand } from "@/components/types/brand";

interface BrandsGridProps {
  title?: string;
  subtitle?: string;
  showFeaturedOnly?: boolean;
  limit?: number;
}

// Sanity CDN: small WebP/AVIF instead of the original file
const opt = (url: string, w: number) =>
  url.includes("cdn.sanity.io")
    ? `${url}${url.includes("?") ? "&" : "?"}w=${w}&auto=format&q=75`
    : url;

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

export default function BrandsGrid({
  title = "Brands",
  subtitle = "Find your favourite",
  showFeaturedOnly = false,
  limit,
}: BrandsGridProps) {
  const [all, setAll] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [can, setCan] = useState({ left: false, right: true });
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/brands", { signal: ac.signal });
        if (!res.ok) throw new Error();
        const data: unknown = await res.json();
        setAll(Array.isArray(data) ? (data as Brand[]) : []);
      } catch {
        if (!ac.signal.aborted) setFailed(true);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // Client-side filtering: changing props never refetches.
  // Featured brands are listed first (sort is stable, so CMS order is kept inside each group).
  const brands = useMemo(() => {
    const list = showFeaturedOnly ? all.filter((b) => b.featured) : [...all];
    list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    return limit ? list.slice(0, limit) : list;
  }, [all, showFeaturedOnly, limit]);

  // Arrow state, throttled with requestAnimationFrame
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const left = el.scrollLeft > 0;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setCan((p) => (p.left === left && p.right === right ? p : { left, right }));
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    queue();
    el.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, [brands]);

  const scroll = (dir: 1 | -1) => {
    const el = listRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: dir * el.clientWidth * 0.8,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  if (failed || (!loading && !brands.length)) {
    return (
      <p
        role={failed ? "alert" : undefined}
        className="px-4 py-16 text-center text-base font-medium text-neutral-500"
      >
        {failed ? "Brands couldn't be loaded. Try again later." : "No brands found."}
      </p>
    );
  }

  return (
    <section aria-label={title} className="w-full bg-white py-10 md:py-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex items-end justify-between gap-4 px-4 sm:px-8">
          <div>
            <h2 className="text-3xl font-extrabold uppercase leading-none tracking-tighter text-black md:text-5xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-base font-medium text-neutral-500">
                {subtitle}
              </p>
            )}
          </div>

          {/* Desktop arrows; mobile uses native swipe */}
          <div className="hidden gap-2 md:flex">
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => scroll(dir)}
                disabled={dir === -1 ? !can.left : !can.right}
                aria-label={dir === -1 ? "Scroll left" : "Scroll right"}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-black transition-colors hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40",
                  ring,
                )}
              >
                {dir === -1 ? (
                  <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
                ) : (
                  <ChevronRight className="h-6 w-6" strokeWidth={1.75} />
                )}
              </button>
            ))}
          </div>
        </div>

        <ul
          ref={listRef}
          aria-busy={loading}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] sm:scroll-px-8 sm:px-8 [&::-webkit-scrollbar]:hidden"
        >
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <li
                  key={i}
                  className="h-[260px] w-[240px] shrink-0 rounded-3xl bg-neutral-100 sm:w-[280px]"
                />
              ))
            : brands.map((brand) => {
                const slug = brand.slug?.current;
                const featured = Boolean(brand.featured);
                const meta = [
                  brand.country,
                  brand.establishedYear && `Est. ${brand.establishedYear}`,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <li
                    key={brand._id}
                    className="group relative w-[240px] shrink-0 snap-start sm:w-[280px]"
                  >
                    <div
                      className={cn(
                        "flex h-full flex-col rounded-3xl p-2",
                        featured
                          ? "bg-black text-white"
                          : "border border-neutral-200 bg-neutral-100 text-black",
                      )}
                    >
                      <div
                        className={cn(
                          "relative flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-black",
                          featured && "ring-1 ring-neutral-700",
                        )}
                      >
                        {brand.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={opt(brand.logo, 480)}
                            srcSet={`${opt(brand.logo, 240)} 240w, ${opt(brand.logo, 480)} 480w`}
                            sizes="280px"
                            alt={brand.logoAlt || brand.name}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="max-h-full max-w-full object-contain p-4"
                          />
                        ) : (
                          <span className="text-3xl font-extrabold uppercase text-white">
                            {brand.name[0]}
                          </span>
                        )}
                        {featured && (
                          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-tight text-black">
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="px-2 pb-2 pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="line-clamp-2 min-w-0 break-words text-xl font-extrabold uppercase leading-tight tracking-tight">
                            {/* The link stretches over the whole card, so there are no nested interactive elements */}
                            <Link
                              href={slug ? `/products?brands=${slug}` : "/products"}
                              className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-black focus-visible:after:ring-offset-2"
                            >
                              {brand.name}
                            </Link>
                          </h3>
                          <span
                            aria-hidden
                            className={cn(
                              "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full pl-4 pr-3 text-sm font-bold uppercase tracking-tight transition-colors",
                              featured
                                ? "bg-white text-black group-hover:bg-neutral-200"
                                : "bg-black text-white group-hover:bg-neutral-700",
                            )}
                          >
                            View
                            <ArrowRight className="h-5 w-5" strokeWidth={1.75} />
                          </span>
                        </div>

                        {meta && (
                          <p
                            className={cn(
                              "mt-2 text-base font-medium",
                              featured ? "text-neutral-400" : "text-neutral-500",
                            )}
                          >
                            {meta}
                          </p>
                        )}
                        {brand.description && (
                          <p
                            className={cn(
                              "mt-2 line-clamp-2 text-base font-medium",
                              featured ? "text-neutral-300" : "text-neutral-600",
                            )}
                          >
                            {brand.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
        </ul>
      </div>
    </section>
  );
}