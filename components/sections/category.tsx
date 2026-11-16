'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CategoryCard from '../cards/category-card'

export type Category = {
  name: string
  image: string
  slug: string
  productCount?: number
}

// Shown only if the API request fails
const FALLBACK: Category[] = [
  { name: 'Men', image: '/category-men.avif', slug: 'men' },
  { name: 'Women', image: '/category-women.avif', slug: 'women' },
  { name: 'Accessories', image: '/category-accessories.avif', slug: 'accessories' },
  { name: 'Footwear', image: '/category-footwear.avif', slug: 'footwear' },
]

const arrowBtn =
  'flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-black transition ' +
  'hover:bg-neutral-200 disabled:pointer-events-none disabled:opacity-30 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [canScroll, setCanScroll] = useState({ left: false, right: true })
  const listRef = useRef<HTMLUListElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ac = new AbortController()
    fetch('/api/categories', { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((d) => {
        if (!Array.isArray(d)) throw new Error('Invalid data')
        setCategories(d)
      })
      .catch((e) => e.name !== 'AbortError' && setCategories(FALLBACK))
      .finally(() => !ac.signal.aborted && setLoading(false))
    return () => ac.abort()
  }, [])

  // Scroll indicator is written straight to the DOM: no re-render on every scroll event
  const update = useCallback(() => {
    const el = listRef.current
    if (!el) return
    const { scrollLeft, clientWidth, scrollWidth } = el
    if (trackRef.current) trackRef.current.hidden = scrollWidth <= clientWidth + 1
    if (thumbRef.current) {
      thumbRef.current.style.width = `${(clientWidth / scrollWidth) * 100}%`
      thumbRef.current.style.transform = `translateX(${(scrollLeft / clientWidth) * 100}%)`
    }
    const left = scrollLeft > 0
    const right = scrollLeft + clientWidth < scrollWidth - 1
    setCanScroll((p) => (p.left === left && p.right === right ? p : { left, right }))
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [categories, loading, update])

  const scroll = (dir: 1 | -1) =>
    listRef.current?.scrollBy({ left: dir * listRef.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <section className="w-full py-10" aria-label="Collections">
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4 px-4 sm:px-8">
          <h2 className="text-2xl font-bold  leading-none tracking-tighter text-black md:text-3xl">
            Collections.
          </h2>
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="whitespace-nowrap border-b border-transparent text-base font-medium text-muted-foreground tracking-tighter font-semibold transition-colors hover:border-black"
            >
              View all
            </Link>
            <div className=" gap-2 flex">
              <button onClick={() => scroll(-1)} disabled={!canScroll.left} aria-label="Scroll left" className={arrowBtn}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => scroll(1)} disabled={!canScroll.right} aria-label="Scroll right" className={arrowBtn}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Native scroll + snap: smooth touch swipe, trackpad and keyboard all work */}
        <ul
          ref={listRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] sm:scroll-px-8 sm:px-8 [&::-webkit-scrollbar]:hidden"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="h-[280px] w-[200px] shrink-0 animate-pulse rounded-xl bg-neutral-100 sm:h-[320px] sm:w-[240px]"
              />
            ))
          ) : categories.length ? (
            categories.map((cat) => (
              <li key={cat.slug} className="shrink-0 snap-start">
                <CategoryCard {...cat} />
              </li>
            ))
          ) : (
            <li className="w-full py-12 text-center text-sm text-neutral-500">No categories available</li>
          )}
        </ul>

        {/* Scroll indicator */}
        {/* <div ref={trackRef} className="mx-4 mt-5 h-[3px] overflow-hidden rounded-full bg-neutral-200 sm:mx-8" aria-hidden="true">
          <div ref={thumbRef} className="h-full w-1/4 rounded-full bg-black" />
        </div> */}
      </div>
    </section>
  )
}