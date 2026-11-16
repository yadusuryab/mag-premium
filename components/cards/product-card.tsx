"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

type Props = {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  salesPrice?: number | null;
  isNew?: boolean;
  isBestSeller?: boolean;
  rating?: number; // accepted so existing callers keep compiling; not displayed
};

// One shared formatter: same output on server and client (no hydration mismatch)
const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

// Sanity CDN: serve small WebP/AVIF sizes instead of the original file
const isSanity = (url: string) => url.includes("cdn.sanity.io");
const opt = (url: string, w: number) => `${url}${url.includes("?") ? "&" : "?"}w=${w}&auto=format&q=75`;

export default function ProductCard({ id, name, imageUrl, price, salesPrice, isNew, isBestSeller }: Props) {
  const [wished, setWished] = useState(false);

  const src = imageUrl || "/placeholder.jpg";
  // A missing sales price must NOT count as a 100% discount
  const hasDiscount = !!salesPrice && !!price && salesPrice < price;
  const current = hasDiscount ? salesPrice! : price ?? 0;
  const pct = hasDiscount ? Math.round(((price - salesPrice!) / price) * 100) : 0;
  const tag = isNew ? "Just in" : isBestSeller ? "Best seller" : null;

  return (
    <article className="group relative">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100">
        <img
          src={isSanity(src) ? opt(src, 480) : src}
          srcSet={isSanity(src) ? [320, 480, 720].map((w) => `${opt(src, w)} ${w}w`).join(", ") : undefined}
          sizes="(max-width: 768px) 50vw, 25vw"
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-700 ease-out motion-reduce:transition-none md:group-hover:scale-105"
        />

        {/* Always visible on touch screens, hover-revealed on desktop */}
        {/* <button
          type="button"
          onClick={() => setWished((w) => !w)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black
            transition active:scale-90 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          <Heart size={18} strokeWidth={1.75} className={wished ? "fill-black" : ""} />
        </button> */}
      </div>

      <div className="pt-3">
        {tag && <p className="text-sm font-medium text-black">{tag}</p>}

        {/* The name link stretches over the whole card, so the wishlist button is not nested in a link */}
        <h3 className="line-clamp-1 text-xs uppercase font-semibold text-black">
          <Link
            href={`/product/${id.toLowerCase()}`}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-black"
          >
            {name || "Unnamed product"}
          </Link>
        </h3>

        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-base font-bold text-black">
          {INR.format(current)}
          {hasDiscount && <span className="text-sm font-bold text-neutral-500 line-through">{INR.format(price)}</span>}
        </p>
        {pct > 0 && <p className="text-sm font-bold text-green-700">{pct}% off</p>}
      </div>
    </article>
  );
}