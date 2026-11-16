import Link from "next/link";

type Stat = { value: string; label: string };

type AboutTeaserProps = {
  imageUrl?: string;
  tag?: string;
  heading?: string;
  body?: string;
  ctaText?: string;
  ctaHref?: string;
  stat1?: Stat;
  stat2?: Stat;
  stat3?: Stat;
};

// Sanity CDN: small WebP/AVIF sizes instead of the original file
const isSanity = (url: string) => url.includes("cdn.sanity.io");
const opt = (url: string, w: number) => `${url}${url.includes("?") ? "&" : "?"}w=${w}&auto=format&q=75`;

export default function AboutTeaser({
  imageUrl = "/hero.avif",
  tag = "Our story",
  heading = "Designed for the\nmodern wardrobe.",
  body = "We believe fashion should feel effortless. Every piece in our collection is thoughtfully sourced — quality fabrics, considered cuts, and a commitment to lasting style over passing trends.",
  ctaText = "Learn more",
  ctaHref = "/about",
  stat1 = { value: "500+", label: "Curated styles" },
  stat2 = { value: "30k+", label: "Happy customers" },
  stat3 = { value: "4.9★", label: "Avg. rating" },
}: AboutTeaserProps) {
  const sanity = isSanity(imageUrl);

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8">
      <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
        {/* Text first, on the left */}
        <div className="md:col-span-5">
          {tag && <p className="mb-3 text-base font-medium text-neutral-500">{tag}</p>}

          <h2 className="mb-5 whitespace-pre-line text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-black sm:text-5xl">
            {heading}
          </h2>

          <p className="mb-8 max-w-md text-base text-neutral-600">{body}</p>

          <Link
            href={ctaHref}
            className="inline-flex h-11 items-center rounded-full bg-black px-6 text-base font-medium text-white transition-colors hover:bg-neutral-700
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            {ctaText}
          </Link>
        </div>

        {/* Image, wider, on the right */}
        <div className="relative min-h-[320px] overflow-hidden rounded-2xl bg-neutral-100 sm:min-h-[420px] md:col-span-7 md:min-h-[520px] md:self-stretch">
          <img
            src={sanity ? opt(imageUrl, 1200) : imageUrl}
            srcSet={sanity ? [600, 900, 1200, 1800].map((w) => `${opt(imageUrl, w)} ${w}w`).join(", ") : undefined}
            sizes="(max-width: 768px) 100vw, 60vw"
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Stats: full-width band underneath */}
        <dl className="grid grid-cols-3 gap-4 border-t border-neutral-200 pt-8 md:col-span-12">
          {[stat1, stat2, stat3].map(({ value, label }) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="mt-1 text-sm text-neutral-500 sm:text-base">{label}</dt>
              <dd className="text-3xl font-extrabold tracking-tight text-black sm:text-5xl">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}