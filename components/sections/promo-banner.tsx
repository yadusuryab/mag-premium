import Link from "next/link";

type PromoBannerProps = {
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaHref?: string;
  imageUrl?: string;
  /** Small label above the heading, e.g. "Just in". Hidden when empty. */
  tag?: string;
};

// Sanity CDN: small WebP/AVIF sizes instead of the original file
const isSanity = (url: string) => url.includes("cdn.sanity.io");
const opt = (url: string, w: number) => `${url}${url.includes("?") ? "&" : "?"}w=${w}&auto=format&q=75`;

export default function PromoBanner({
  heading = "The New Season\nIs Here.",
  subheading = "Discover the latest drops — curated pieces built for the modern wardrobe.",
  ctaText = "Shop the Collection",
  ctaHref = "/products",
  imageUrl = "/hero.avif",
  tag = "",
}: PromoBannerProps) {
  const sanity = isSanity(imageUrl);

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-900 sm:aspect-[21/9] md:max-h-[640px]">
        {/* Below the fold: lazy-loaded (no priority preload), decorative so alt is empty */}
       
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-start justify-end p-6 sm:p-10 md:p-14">
          {tag && <p className="mb-3 text-base font-medium text-white">{tag}</p>}

          <h2 className="mb-3 max-w-2xl whitespace-pre-line text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {heading}
          </h2>

          {subheading && <p className="mb-6 max-w-md text-base font-medium text-white/90">{subheading}</p>}

          <Link
            href={ctaHref}
            className="inline-flex h-11 items-center rounded-full bg-white px-6 text-base font-medium text-black transition-colors hover:bg-neutral-200
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
}