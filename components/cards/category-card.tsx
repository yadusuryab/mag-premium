// components/cards/category-card.tsx
'use client'

import Link from 'next/link'

export type CategoryCardProps = {
  name: string
  image?: string | null
  slug: string
  productCount?: number
}

// Sanity CDN: small WebP/AVIF (2x of the 240px card) instead of the original file
const opt = (url: string, w: number) =>
  url.includes('cdn.sanity.io') ? `${url}${url.includes('?') ? '&' : '?'}w=${w}&auto=format&q=75` : url

export default function CategoryCard({ name, image, slug, productCount }: CategoryCardProps) {
  return (
    <Link
      href={`/products?category=${slug}`}
      className="group relative block h-[280px] w-[200px] shrink-0 overflow-hidden rounded-3xl bg-neutral-100 sm:h-[320px] sm:w-[240px]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
      {/* No image (null/empty) or a broken one leaves the neutral background */}
      {image && (
        <img
          src={opt(image, 480)}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={(e) => (e.currentTarget.style.display = 'none')}
          className="h-full w-full object-cover transition-transform duration-700 ease-out motion-reduce:transition-none md:group-hover:scale-105"
        />
      )}

      {productCount !== undefined && (
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-black">
          {productCount} items
        </span>
      )}

      {/* Name pill: the card's accessible name */}
      <span className="absolute bottom-2 left-2 rounded-full bg-white px-4 py-1 text-base font-bold tracking-tighter lowercase capitalize text-black transition-colors group-hover:bg-neutral-200">
        {name}
      </span>
    </Link>
  )
}