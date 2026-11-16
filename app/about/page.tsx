// app/about/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Heart, MessageCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "SHOPIGO";
const PHONE = process.env.NEXT_PUBLIC_PHONE ?? "919400941277"; // digits with country code
const INSTAGRAM = "kerala_kicks_online";
/** Optional full-bleed hero photo, e.g. "/about-hero.jpg" in /public. Leave null for a plain black hero. */
const HERO_IMAGE: string | null = null;

const phoneDisplay = PHONE.replace(/^(\d{2})(\d{5})(\d{5})$/, "+$1 $2 $3");

export const metadata: Metadata = {
  title: `About | ${APP_NAME}`,
  description: `${APP_NAME} brings you carefully curated watches and gadgets, built for life and priced for everyone.`,
};

// Server component: keep these class strings local (values exported from client files aren't usable here)
const ring = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
const btn = "inline-flex h-12 items-center justify-center rounded-full px-7 text-base font-semibold transition-colors";
const onLight = {
  solid: cn(btn, ring, "bg-black text-white hover:bg-neutral-700 focus-visible:outline-black"),
  outline: cn(btn, ring, "border border-neutral-300 bg-white text-black hover:border-black focus-visible:outline-black"),
};
const onDark = {
  solid: cn(btn, ring, "bg-white text-black hover:bg-neutral-200 focus-visible:outline-white"),
  outline: cn(btn, ring, "border border-white/60 text-white hover:border-white focus-visible:outline-white"),
};
const wrap = "mx-auto w-full max-w-[1440px] px-4 sm:px-8";
const h2 = "text-3xl font-extrabold uppercase leading-none tracking-tighter md:text-5xl";

const STATS = [
  { value: "2,290+", label: "Happy customers" },
  { value: "84+", label: "Products listed" },
  { value: "4.9★", label: "Average rating" },
  { value: "24h", label: "Reply guarantee" },
];

const DETAILS = [
  { label: "Category", value: "Watches & gadgets" },
  { label: "Location", value: "Kerala, India" },
  { label: "Payment", value: "COD & online" },
  { label: "Shipping", value: "Pan India" },
  { label: "Instagram", value: `@${INSTAGRAM}`, href: `https://instagram.com/${INSTAGRAM}` },
  { label: "WhatsApp", value: phoneDisplay, href: `https://wa.me/${PHONE}` },
];

const VALUES = [
  { icon: Clock, title: "Built for everyday", body: "Every piece we carry is chosen for real life: durable, versatile and worth wearing every single day." },
  { icon: ShieldCheck, title: "Trusted quality", body: "We source directly and verify every product. What you see is exactly what arrives at your door." },
  { icon: Heart, title: "Best price promise", body: "Premium doesn’t have to mean expensive. We negotiate hard so you get the best price without compromise." },
  { icon: MessageCircle, title: "Fast, friendly support", body: "Real replies, not bots. Message us on Instagram or WhatsApp and hear back within hours." },
];

export default function AboutPage() {
  return (
    <div className="bg-white text-black">
      {/* Hero: shorter than the screen so the next section peeks in */}
      <section className="relative flex h-[58svh] min-h-[420px] max-h-[720px] items-end overflow-hidden bg-black md:h-[68svh]">
        {HERO_IMAGE && <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden="true" />

        <div className={cn(wrap, "relative pb-8 md:pb-12")}>
          <h1 className="max-w-3xl text-5xl font-extrabold uppercase leading-[0.95] tracking-tighter text-white md:text-8xl">
            Designed for everyday.
          </h1>
          <p className="mt-4 max-w-md text-base font-medium text-white/80">
            Great design should be accessible. {APP_NAME} brings you carefully curated timepieces and gadgets, built for life and priced for everyone.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className={onDark.solid}>Shop now</Link>
            <a href={`https://instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener noreferrer" className={onDark.outline}>
              Follow on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={cn(wrap, "py-12 md:py-16")} aria-label="Store highlights">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col-reverse gap-1 border-t border-black pt-4">
              <dt className="text-base font-medium text-neutral-500">{s.label}</dt>
              <dd className="text-4xl font-extrabold tracking-tighter md:text-6xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Story */}
      <section className={cn(wrap, "grid gap-10 pb-12 md:grid-cols-2 md:gap-16 md:pb-20")}>
        <div>
          <h2 className={h2}>Started with a passion for great watches.</h2>
          <div className="mt-6 max-w-xl space-y-4 text-base font-medium leading-relaxed text-neutral-600">
            <p>
              {APP_NAME} started as a simple idea: premium watches shouldn’t cost a fortune, and finding them online shouldn’t feel like a gamble.
            </p>
            <p>
              Every piece is personally reviewed before it’s listed. We check build quality, accuracy and everyday wearability, so you get exactly what you see.
            </p>
            <p>Based in Kerala, shipping across India. COD available. Fast replies, always.</p>
          </div>
          <a href={`tel:+${PHONE}`} className={cn(onLight.outline, "mt-8")}>
            Call {phoneDisplay}
          </a>
        </div>

        <dl className="divide-y divide-neutral-200 border-y border-neutral-200 self-start">
          {DETAILS.map((d) => (
            <div key={d.label} className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-base font-medium text-neutral-500">{d.label}</dt>
              <dd className="text-right text-base font-bold">
                {d.href ? (
                  <a href={d.href} target="_blank" rel="noopener noreferrer" className={cn(ring, "rounded-sm underline underline-offset-4 hover:text-neutral-600 focus-visible:outline-black")}>
                    {d.value}
                  </a>
                ) : (
                  d.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Values */}
      <section className={cn(wrap, "pb-12 md:pb-20")}>
        <h2 className={h2}>What we stand for</h2>
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1 text-base font-medium text-neutral-500">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className={cn(wrap, "pb-12 md:pb-20")}>
        <div className="rounded-3xl bg-neutral-100 p-8 md:p-16">
          <h2 className={cn(h2, "max-w-2xl")}>Find your next favourite watch.</h2>
          <p className="mt-4 max-w-md text-base font-medium text-neutral-600">
            New arrivals every week, all handpicked and ready to ship.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className={onLight.solid}>Browse collection</Link>
            <a href={`https://wa.me/${PHONE}`} target="_blank" rel="noopener noreferrer" className={onLight.outline}>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}