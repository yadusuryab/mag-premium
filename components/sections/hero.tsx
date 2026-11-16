'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

type BannerItem = {
  _id: string;
  title?: string;
  subtitle?: string;
  mediaType?: 'image' | 'video';
  image?: string;
  video?: string;
  poster?: string;
  label?: string;
  href?: string;
};

const IMAGE_DURATION = 6000;

// Sanity CDN resizes and serves WebP/AVIF automatically: a fraction of the original file size
const opt = (url: string, w: number) => `${url}${url.includes('?') ? '&' : '?'}w=${w}&auto=format&q=75`;
const srcSet = (url: string) => [640, 1080, 1600, 2400].map((w) => `${opt(url, w)} ${w}w`).join(', ');
// Shorter than the screen on purpose, so the next section peeks in and visitors know there is more below
const SIZE = 'h-[58svh] md:h-[68svh] min-h-[420px] max-h-[720px]';
const CTA =
  'inline-flex h-11 items-center rounded-full bg-white px-6 text-base font-medium text-black ' +
  'transition-colors hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-white';
const CTRL =
  'flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black transition ' +
  'hover:bg-white active:scale-95 focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-white';

const Hero = ({ className }: { className?: string }) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // user choice / reduced motion
  const [inView, setInView] = useState(true);
  const [muted, setMuted] = useState(true);
  const [saveData, setSaveData] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const elapsed = useRef(0);
  const startX = useRef<number | null>(null);
  const seen = useRef(new Set<number>()); // slides already shown: keep mounted, never refetch

  // ── Data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/banner', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBanners(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => !ac.signal.aborted && setLoading(false));
    return () => ac.abort();
  }, []);

  const slides = useMemo(
    () =>
      banners.map((b) => {
        const isVideo = b.mediaType === 'video';
        return {
          id: b._id,
          title: b.title,
          subtitle: b.subtitle,
          href: b.href,
          label: b.label,
          // On Data Saver, video slides fall back to their poster image
          videoUrl: isVideo && !saveData ? b.video : undefined,
          poster: b.poster || b.image,
          image: isVideo ? b.poster || b.image : b.image,
        };
      }),
    [banners, saveData],
  );

  const n = slides.length;
  const current = slides[index];
  const isVideo = !!current?.videoUrl;
  const running = !paused && inView;

  const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);
  const next = useCallback(() => setIndex((p) => (p + 1) % n), [n]);

  // ── Respect reduced motion; pause when scrolled out of view ────────────
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true);
    setSaveData(!!(navigator as any).connection?.saveData);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, n]);

  // ── Video autoplay (muted autoplay is allowed by all browsers) ─────────
  useEffect(() => {
    videos.current.forEach((v) => v && (v.muted = muted));
  }, [muted, n, index]);

  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === index && running) {
        v.play().catch((e) => e?.name === 'NotAllowedError' && setPaused(true));
      } else {
        v.pause();
        if (i !== index && v.currentTime) v.currentTime = 0;
      }
    });
  }, [index, running, n]);

  // ── One progress loop: timer for images, currentTime for videos ────────
  useEffect(() => {
    elapsed.current = 0;
  }, [index]);

  useEffect(() => {
    if (!running || (n <= 1 && !isVideo)) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      let p = 0;
      if (isVideo) {
        const v = videos.current[index];
        p = v && v.duration ? v.currentTime / v.duration : 0;
      } else {
        elapsed.current += now - last;
        p = elapsed.current / IMAGE_DURATION;
        if (p >= 1) return next();
      }
      last = now;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, running, isVideo, n, next]);

  // ── States ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className={cn('w-full', SIZE, className)} aria-busy="true">
        <div className="h-full w-full animate-pulse bg-neutral-100" />
      </section>
    );
  }

  if (!n) {
    return (
      <section className={cn('flex w-full items-end bg-neutral-900', SIZE, className)}>
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 sm:px-8">
          <h1 className="mb-6 text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
            Welcome to our store
          </h1>
          <Link href="/products" className={CTA}>Shop</Link>
        </div>
      </section>
    );
  }

  seen.current.add(index);

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Featured"
      className={cn('relative w-full touch-pan-y select-none overflow-hidden bg-neutral-950', SIZE, className)}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerCancel={() => (startX.current = null)}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <style>{`@keyframes heroIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

      {/* Slides (cross-fade). Videos mount only for the current and adjacent slides. */}
      {slides.map((s, i) => {
        const active = i === index;
        const near = (i - index + n) % n <= 1 || (index - i + n) % n <= 1;
        const mount = active || i === (index + 1) % n || seen.current.has(i);
        return (
          <div
            key={s.id || i}
            aria-hidden={!active}
            className={cn('absolute inset-0 transition-opacity duration-700', active ? 'z-[1] opacity-100' : 'opacity-0')}
          >
            {s.videoUrl && near ? (
              <video
                ref={(el) => { videos.current[i] = el; }}
                src={s.videoUrl}
                poster={s.poster ? opt(s.poster, 1280) : undefined}
                className="h-full w-full object-cover"
                muted
                playsInline
                loop={n === 1}
                preload={active ? 'auto' : 'none'}
                onEnded={next}
                onError={() => active && n > 1 && next()}
              />
            ) : (
              s.image &&
              mount && (
                <img
                  src={opt(s.image, 1080)}
                  srcSet={srcSet(s.image)}
                  sizes="100vw"
                  alt={s.title || ''}
                  className="h-full w-full object-cover"
                  loading={active ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                />
              )
            )}
          </div>
        );
      })}

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Content + controls */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-5 sm:px-8 sm:pb-8">
        <div className="mx-auto max-w-[1440px]">
          <div
            key={index}
            className="mb-8 max-w-3xl animate-[heroIn_0.7s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none"
          >
            {current.title && (
              <h1 className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                {current.title}
              </h1>
            )}
            {current.subtitle && (
              <p className="mt-4 max-w-md text-base font-medium text-white/90">{current.subtitle}</p>
            )}
            {current.label && current.href && (
              <Link href={current.href} className={cn(CTA, 'mt-6')}>
                {current.label}
              </Link>
            )}
          </div>

          <div className="flex items-end justify-between gap-4">
            {/* Segmented progress */}
            {n > 1 ? (
              <div className="flex w-40 gap-1 sm:w-64">
                {slides.map((s, i) => (
                  <button
                    key={s.id || i}
                    onClick={() => go(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index}
                    className="flex h-6 flex-1 items-end"
                  >
                    <span className="relative block h-[3px] w-full overflow-hidden bg-white/30">
                      <span
                        ref={i === index ? fillRef : undefined}
                        className="absolute inset-0 origin-left bg-white"
                        style={{ transform: `scaleX(${i < index ? 1 : 0})` }}
                      />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              {isVideo && (
                <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'} className={CTRL}>
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
              {(n > 1 || isVideo) && (
                <button onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play' : 'Pause'} className={CTRL}>
                  {paused ? <Play size={18} className="ml-0.5" /> : <Pause size={18} />}
                </button>
              )}
              {n > 1 && (
                <>
                  <button onClick={() => go(index - 1)} aria-label="Previous slide" className={cn(CTRL, 'hidden sm:flex')}>
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => go(index + 1)} aria-label="Next slide" className={cn(CTRL, 'hidden sm:flex')}>
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;