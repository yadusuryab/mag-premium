"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";
import Brand from "../utils/brand";

type Category = { name?: string; slug?: string | { current?: string } };
type NavLink = { label: string; href: string };

// Used only if /api/categories fails
const FALLBACK: Category[] = [
  { name: "Men", slug: "men" },
  { name: "Women", slug: "women" },
  { name: "Accessories", slug: "accessories" },
  { name: "Footwear", slug: "footwear" },
];

const HELP: NavLink[] = [{ label: "Contact us", href: "/contact" }];
const COMPANY: NavLink[] = [{ label: "About us", href: "/about" }];
const LEGAL: NavLink[] = [
  { label: "Privacy policy", href: "/privacy-policy" },
  { label: "Terms & conditions", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
];

// Social links without a configured URL are hidden instead of pointing to "#"
const SOCIALS = [
  { label: "Instagram", href: process.env.NEXT_PUBLIC_INSTA, Icon: Instagram },
  { label: "WhatsApp", href: process.env.NEXT_PUBLIC_WHATSAPP, Icon: MessageCircle },
].filter((s): s is typeof s & { href: string } => !!s.href);

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Store";

const linkCls =
  "text-sm text-neutral-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

function Column({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-4 text-sm font-medium text-white">{title}</h3>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={linkCls}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/categories", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setCategories(d))
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const shop: NavLink[] = (categories.length ? categories : FALLBACK)
    .slice(0, 5)
    .map((c) => {
      const slug = typeof c.slug === "string" ? c.slug : c.slug?.current;
      return { label: c.name || "Category", href: slug ? `/products?category=${slug}` : "/products" };
    });
  shop.push({ label: "All products", href: "/products" });

  return (
    <footer className="bg-[color:var(--foreground,#0a0a0a)] text-white">
      <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-14 sm:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link href="/" aria-label="Home" className="mb-5 block w-fit transition-opacity hover:opacity-80">
              <Brand className="h-9 w-auto brightness-0 invert" />
            </Link>
            <p className="mb-6 max-w-sm text-sm text-neutral-400">
              Handpicked fashion, curated for the modern wardrobe. Quality pieces built to last.
            </p>
            {SOCIALS.length > 0 && (
              <div className="flex gap-3">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-neutral-300 transition-colors
                      hover:border-[color:var(--sport-accent,#0169ff)] hover:text-[color:var(--sport-accent,#0169ff)]
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <Icon size={20} strokeWidth={1.75} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <Column title="Shop" links={shop} />
            <Column title="Help" links={HELP} />
            <Column title="Company" links={COMPANY} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-neutral-500 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>

          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls}>
                {l.label}
              </Link>
            ))}
          </nav>

          <a
            href="https://instagram.com/getshopigo"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[color:var(--sport-accent,#0169ff)]"
          >
            Made with ♥ by <span className="underline underline-offset-2">Shopigo</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export { Footer };