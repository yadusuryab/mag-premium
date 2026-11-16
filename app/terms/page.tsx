import type { Metadata } from "next";
import Link from "next/link";

const APP = process.env.NEXT_PUBLIC_APP_NAME || "SHOPIGO";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: `Return, replacement, shipping and ordering terms for ${APP}.`,
};

type Section = {
  id: string;
  title: string;
  items?: string[];
  notes?: string[];
};

const SECTIONS: Section[] = [
  {
    id: "returns",
    title: "Returns and replacements",
    items: [
      "You can return a product for a replacement if it is the wrong size, incorrect, or damaged.",
      "We do not offer exchanges, returns or refunds for personal preference or dislike. We aim to provide the best, but individual tastes vary.",
    ],
    notes: [
      "Refunds are not available, only replacements. If the courier service loses the product, a refund may apply under specific conditions.",
    ],
  },
  {
    id: "unboxing",
    title: "Unboxing video",
    items: [
      "A continuous 360-degree unboxing video is mandatory for any claim about damage, incorrect size, missing items and similar issues. The issue must be clearly visible, with no pauses or cuts.",
      "The video must begin by showing the address label we sent, including the outer packaging.",
      "Claims must be reported within 24 hours of receiving the parcel.",
    ],
    notes: [
      "We cannot accept videos recorded after the parcel was opened, or videos that appear edited, as proof. All customers follow the same guidelines.",
    ],
  },
  {
    id: "notes",
    title: "Important notes",
    items: [
      "Slight colour variation can occur because of digital photography and screen settings, so images may differ slightly from the actual product.",
      "Minor issues such as loose threads, removable stains or slight stitching imperfections are not considered damage.",
    ],
  },
  {
    id: "keep-in-mind",
    title: "Keep in mind",
    items: [
      "Orders cannot be cancelled after they are placed.",
      "If you want to replace a product, you pay the courier charges. If the issue is on our side, we cover the courier cost once you send the dispatch slip.",
      "Product quality is based on the price you pay.",
    ],
  },
  {
    id: "shipping",
    title: "Shipping and delivery",
    items: [
      "We do not own any courier service. Parcels are sent through third-party couriers.",
      "We are not responsible for courier delays, as they are beyond our control. Our support team is available 24x7 and will do everything possible to resolve the issue. If it stays unresolved, we will settle it through discussion with you.",
      "Refunds and order cancellations are not available because of courier delays. Thank you for your patience.",
    ],
  },
  {
    id: "size",
    title: "Size replacements",
    notes: [
      "If you want the same shoes in a different size, we process it based on stock availability.",
      "If you ordered size 10 and received size 10, you cannot exchange it for a larger size, because we state the maximum available size (10) before purchase. Likewise, if you ordered size 6, you cannot replace it with a smaller size such as 5. Please check your size before ordering.",
    ],
  },
];

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8 md:py-16">
      <header>
        <h1 className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
          Terms &amp; conditions
        </h1>
        <p className="mt-4 max-w-xl text-base font-medium text-neutral-500">
          Please read these terms carefully before you place an order.
        </p>
        <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2">
          {SECTIONS.map(({ id, title }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold transition-colors hover:bg-neutral-100 ${FOCUS}`}
            >
              {title}
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-10 md:mt-14">
        {SECTIONS.map(({ id, title, items, notes }) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-title`}
            className="grid scroll-mt-28 gap-4 border-t border-neutral-200 py-8 md:grid-cols-[1fr_2fr] md:gap-16"
          >
            <h2
              id={`${id}-title`}
              className="text-xl font-extrabold uppercase leading-tight tracking-tight md:text-2xl"
            >
              {title}
            </h2>
            <div className="max-w-2xl space-y-4 text-base font-medium leading-relaxed text-neutral-700">
              {items && (
                <ul className="list-disc space-y-3 pl-5 marker:text-neutral-400">
                  {items.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              )}
              {notes?.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-5 rounded-3xl bg-neutral-100 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
        <div>
          <p className="text-base font-semibold">
            Have a question? Ask us before you order.
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-500">
            Best regards, {APP} team
          </p>
        </div>
        <Link
          href="/contact"
          className={`inline-flex items-center justify-center rounded-full bg-black px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-neutral-700 ${FOCUS}`}
        >
          Contact us
        </Link>
      </div>
    </article>
  );
}