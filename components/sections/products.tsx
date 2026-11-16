"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ProductCard from "../cards/product-card";
import type { Product } from "@/lib/queries/product";

type Props = {
  products: Product[];
  title?: string;
  desc?: string;
  showViewAll?: boolean;
  deskCols?: 2 | 3 | 4 | 5;
  /** Pass true only while you are really fetching the products */
  loading?: boolean;
};

// Full class names so Tailwind can detect them
const COLS = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
} as const;

const pill =
  "inline-flex  items-center gap-2 rounded-full bg-muted  px-3 py-2 text-base font-semibold tracking-tighter " +
  "text-foreground transition-colors hover:border-foreground focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-foreground";

const ProductSkeleton = () => (
  <div className="animate-pulse" aria-hidden="true">
    <div className="aspect-[3/4] w-full rounded bg-muted" />
    <div className="mt-3 h-3 w-3/4 rounded bg-muted" />
    <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
  </div>
);

export default function ProductsSection({
  products,
  title = "Explore",
  desc = "",
  showViewAll = false,
  deskCols = 4,
  loading = false,
}: Props) {
  return (
    <section aria-label={title} className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold  leading-none tracking-tighter text-foreground md:text-3xl">
            {title}.
          </h2>
          {desc && <p className=" font-semibold tracking-tighter  text-base text-muted-foreground">{desc}</p>}
        </div>

        {showViewAll && (
          <Link
            href="/products"
            className="whitespace-nowrap border-b border-transparent text-base font-medium text-foreground transition-colors hover:border-foreground"
          >
            View all
          </Link>
        )}
      </div>

      {/* Grid */}
      <div className={cn("grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-4", COLS[deskCols])} aria-busy={loading}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
        ) : products.length ? (
          products.map((p) => (
            <ProductCard
              key={p._id}
              id={p._id}
              name={p.name}
              rating={p.rating}
              imageUrl={p.image}
              price={p.price}
              salesPrice={p.salesPrice}
            />
          ))
        ) : (
          <p className="col-span-full py-16 text-center text-base text-muted-foreground">No products found.</p>
        )}
      </div>

      {/* Bottom button: a styled link, not a button inside a link */}
      {showViewAll && !loading && products.length > 0 && (
        <div className="mt-10 flex justify-center">
          <Link href="/products" className={pill}>
            View more products <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}