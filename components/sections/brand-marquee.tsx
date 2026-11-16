'use client';

import { useEffect, useRef, useState } from 'react';
import type { Brand as BrandItem } from '../types/brand';

interface BrandsMarqueeProps {
  /** px/s scroll speed */
  speed?: number;
  direction?: 'left' | 'right';
  label?: string;
  pauseOnHover?: boolean;
}

const MIN_LOGOS = 12; // per group, so the track always covers wide screens
const TILE = 'mr-4 flex h-16 w-36 shrink-0 items-center justify-center rounded-xl border';

// Sanity CDN: serve a small WebP/AVIF (2x of the 144px tile) instead of the original file
const opt = (url: string, w: number) =>
  url.includes('cdn.sanity.io') ? `${url}${url.includes('?') ? '&' : '?'}w=${w}&auto=format&q=75` : url;

const Group = ({ brands, hidden }: { brands: BrandItem[]; hidden?: boolean }) => (
  <ul aria-hidden={hidden} className="flex shrink-0">
    {brands.map((b, i) => (
      <li key={`${b._id}-${i}`} title={b.name} className={`${TILE} group bg-black`}>
        {b.logo ? (
          <img
            src={opt(b.logo, 288)}
            alt={hidden ? '' : b.logoAlt || b.name}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="max-h-full max-w-full object-contain p-3 brightness-75 grayscale-[20%] transition-all duration-300 group-hover:brightness-100 group-hover:grayscale-0"
          />
        ) : (
          <span className="font-serif text-lg font-bold text-amber-500">{b.name[0]}</span>
        )}
      </li>
    ))}
  </ul>
);

export default function BrandsMarquee({
  speed = 40,
  direction = 'left',
  label = '',
  pauseOnHover = true,
}: BrandsMarqueeProps) {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/brands', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBrands(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => !ac.signal.aborted && setLoading(false));
    return () => ac.abort();
  }, []);

  // Tiles have fixed widths, so we can measure right away: duration = distance / speed
  useEffect(() => {
    const track = trackRef.current;
    if (track) setDuration(track.scrollWidth / 2 / speed);
  }, [brands, speed]);

  if (!loading && !brands.length) return null;

  const group = brands.length
    ? Array.from({ length: Math.ceil(MIN_LOGOS / brands.length) }).flatMap(() => brands)
    : [];

  return (
    <section aria-label={label || 'Brands'} className="w-full overflow-hidden py-10">
      <style>{`
        @keyframes brands-scroll { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .brands-track { animation: none !important; } }
      `}</style>

      {label && (
        <div className="mx-auto mb-6 flex max-w-[1440px] items-center gap-5 px-4 sm:px-8">
          <h2 className="whitespace-nowrap text-2xl font-medium text-neutral-600">{label}</h2>
          <span className="h-px flex-1 bg-primary" />
        </div>
      )}

      {loading ? (
        <div className="flex overflow-hidden" aria-busy="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`${TILE} animate-pulse bg-primary`} />
          ))}
        </div>
      ) : (
        // w-max is required: -50% must be half of the content width, not the screen width
        <div
          ref={trackRef}
          className={`brands-track flex w-max will-change-transform ${
            pauseOnHover ? 'hover:[animation-play-state:paused]' : ''
          }`}
          style={
            duration
              ? { animation: `brands-scroll ${duration}s linear infinite ${direction === 'right' ? 'reverse' : ''}` }
              : undefined
          }
        >
          <Group brands={group} />
          <Group brands={group} hidden />
        </div>
      )}
    </section>
  );
}