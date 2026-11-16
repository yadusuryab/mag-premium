// components/product/MediaCarousel.tsx
"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import * as Dialog from "@radix-ui/react-dialog";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { ChevronLeft, ChevronRight, Maximize2, Minus, Play, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/product/filters";

export type MediaItem = {
  _type: "image" | "video";
  _key?: string;
  asset?: { url: string };
  alt?: string;
  title?: string;
  videoFile?: { asset: { url: string } };
  videoUrl?: string;
  poster?: { asset: { url: string } };
};

interface MediaCarouselProps {
  media: MediaItem[];
  imageFit?: "cover" | "contain" | "fill";
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const WIDTHS = [480, 800, 1200, 1600];
const isSanity = (url: string) => url.includes("cdn.sanity.io");
const cdn = (url: string, w: number) => (isSanity(url) ? `${url}${url.includes("?") ? "&" : "?"}w=${w}&auto=format&q=75` : url);
const srcSet = (url: string) => (isSanity(url) ? WIDTHS.map((w) => `${cdn(url, w)} ${w}w`).join(", ") : undefined);
const SIZES = "(min-width: 1024px) 55vw, 100vw";
const FIT = { cover: "object-cover", contain: "object-contain", fill: "object-fill" } as const;

function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&mute=1&rel=0&modestbranding=1`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1`;
  return null;
}

const circle =
  "flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-sm transition-colors hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-30";

// ─── Slide ────────────────────────────────────────────────────────────────────
function Slide({
  item, index, active, near, fit, saveData, onZoom,
}: {
  item: MediaItem; index: number; active: boolean; near: boolean; fit: keyof typeof FIT; saveData: boolean; onZoom: () => void;
}) {
  const [playEmbed, setPlayEmbed] = useState(false);
  const poster = item.poster?.asset?.url;
  const embed = item.videoUrl ? embedUrl(item.videoUrl) : null;
  const fileUrl = item.videoFile?.asset?.url;
  const alt = item.alt || item.title || `Product media ${index + 1}`;

  // Leaving the slide unmounts the embed, which stops playback
  useEffect(() => {
    if (!active) setPlayEmbed(false);
  }, [active]);

  const img = (url: string, eager = false) => (
    <img
      src={cdn(url, 800)}
      srcSet={srcSet(url)}
      sizes={SIZES}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      draggable={false}
      className={cn("absolute inset-0 h-full w-full", FIT[fit])}
    />
  );

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
      {near && item._type === "image" && item.asset?.url && (
        <>
          {img(item.asset.url, index === 0)}
          <button
            type="button"
            tabIndex={active ? 0 : -1}
            aria-label="View image full screen"
            onClick={onZoom}
            className={cn(circle, "absolute bottom-3 right-3", focusRing)}
          >
            <Maximize2 className="h-6 w-6" strokeWidth={1.75} />
          </button>
        </>
      )}

      {near && item._type === "video" && fileUrl && (
        <video
          src={fileUrl}
          poster={poster ? cdn(poster, 800) : undefined}
          controls={active}
          playsInline
          muted
          preload={active && !saveData ? "metadata" : "none"}
          className={cn("absolute inset-0 h-full w-full", FIT[fit])}
          ref={(el) => {
            if (el && !active) el.pause();
          }}
        />
      )}

      {near && item._type === "video" && !fileUrl && embed && (
        playEmbed ? (
          <iframe
            src={embed}
            title={item.title || "Product video"}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <>
            {poster && img(poster)}
            <button
              type="button"
              tabIndex={active ? 0 : -1}
              aria-label="Play video"
              onClick={() => setPlayEmbed(true)}
              className={cn("absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20", focusRing)}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
                <Play className="ml-0.5 h-7 w-7" strokeWidth={1.75} />
              </span>
            </button>
          </>
        )
      )}
    </div>
  );
}

// ─── Carousel ─────────────────────────────────────────────────────────────────
export default function MediaCarousel({ media, imageFit = "cover", className }: MediaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start" });
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    setSaveData(conn?.saveData === true);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  if (!media.length) {
    return (
      <div className={cn("flex aspect-[4/5] w-full items-center justify-center bg-neutral-100", className)}>
        <p className="text-base font-medium text-neutral-500">No media available</p>
      </div>
    );
  }

  const zoomItem:any = zoom !== null ? media[zoom] : null;
  const go = (i: number) => emblaApi?.scrollTo(i);

  return (
    <div className={cn("w-full", className)} role="region" aria-roledescription="carousel" aria-label="Product media">
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {media.map((item, i) => (
              <div
                key={item._key ?? i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${media.length}`}
                aria-hidden={i !== index}
                className="min-w-0 flex-[0_0_100%]"
              >
                <Slide
                  item={item}
                  index={i}
                  active={i === index}
                  near={Math.abs(i - index) <= 1}
                  fit={imageFit}
                  saveData={saveData}
                  onZoom={() => setZoom(i)}
                />
              </div>
            ))}
          </div>
        </div>

        {media.length > 1 && (
          <>
            <button type="button" aria-label="Previous media" disabled={index === 0} onClick={() => go(index - 1)} className={cn(circle, "absolute left-3 top-1/2 hidden -translate-y-1/2 md:flex", focusRing)}>
              <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
            </button>
            <button type="button" aria-label="Next media" disabled={index === media.length - 1} onClick={() => go(index + 1)} className={cn(circle, "absolute right-3 top-1/2 hidden -translate-y-1/2 md:flex", focusRing)}>
              <ChevronRight className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto p-1">
          {media.map((item, i) => {
            const thumb = item._type === "video" ? item.poster?.asset?.url : item.asset?.url;
            return (
              <button
                key={item._key ?? i}
                type="button"
                aria-label={`Show media ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100 ring-offset-2 transition-opacity",
                  i === index ? "opacity-100 ring-2 ring-black" : "opacity-60 hover:opacity-100",
                  focusRing
                )}
              >
                {thumb && <img src={cdn(thumb, 160)} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />}
                {item._type === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                    <Play className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* One fullscreen dialog for the whole carousel, portaled to <body> */}
      <Dialog.Root open={zoomItem !== null} onOpenChange={(o) => !o && setZoom(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none">
            <Dialog.Title className="sr-only">{zoomItem?.title || "Product image"}</Dialog.Title>
            <Dialog.Description className="sr-only">{zoomItem?.alt || "Zoomable product image"}</Dialog.Description>
            {zoomItem?.asset?.url && (
              <TransformWrapper initialScale={1}>
                {({ zoomIn, zoomOut }) => (
                  <>
                    <TransformComponent wrapperClass="!h-svh !w-screen" contentClass="!h-svh !w-screen items-center justify-center">
                      <img src={cdn(zoomItem.asset.url, 1600)} alt={zoomItem.alt || "Full size"} className="max-h-[90svh] max-w-[90vw] object-contain" />
                    </TransformComponent>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                      <button type="button" aria-label="Zoom out" onClick={() => zoomOut()} className={cn(circle, focusRing)}>
                        <Minus className="h-6 w-6" strokeWidth={1.75} />
                      </button>
                      <button type="button" aria-label="Zoom in" onClick={() => zoomIn()} className={cn(circle, focusRing)}>
                        <Plus className="h-6 w-6" strokeWidth={1.75} />
                      </button>
                    </div>
                  </>
                )}
              </TransformWrapper>
            )}
            <Dialog.Close aria-label="Close" className={cn(circle, "absolute right-4 top-4", focusRing)}>
              <X className="h-6 w-6" strokeWidth={1.75} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}