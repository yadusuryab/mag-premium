"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import Brand from "../utils/brand";

const NAV = [
  { name: "Home", href: "/" },
  { name: "Policies", href: "/terms" },
];

type Panel = "menu" | "search" | null;

const iconBtn =
  "relative flex h-11 w-11 items-center justify-center rounded-full text-black " +
  "transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-black";

export default function Header({ cartCount = 0 }: { cartCount?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => setPanel(null), [pathname]);

  // Hide on scroll down, reveal on scroll up
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - last) > 8) {
          setHidden(y > last && y > 80);
          last = y;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll lock, Escape, autofocus
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    if (panel === "search") requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/products?q=${encodeURIComponent(q)}`);
    setQuery("");
    setPanel(null);
  };

  const fade = (open: boolean) =>
    `transition-[opacity,visibility] duration-200 ${open ? "visible opacity-100" : "invisible opacity-0"}`;

  return (
    <>
      {/* Promo bar */}
      <div className="bg-neutral-100 py-2 text-center text-xs font-medium text-black">
        Free shipping on orders paid online
      </div>

      {/* Dim backdrop for mobile menu */}
      <div
        onClick={() => setPanel(null)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 md:hidden ${fade(panel === "menu")}`}
      />

      <header
        className={`sticky top-0 z-50 border-b border-neutral-200 bg-white transition-transform duration-300 ${
          hidden && !panel ? "-translate-y-full" : ""
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center px-4 sm:px-8 md:h-[72px]">
          <Link href="/" aria-label="Home" className="flex shrink-0 items-center">
            <Brand className="h-9 w-auto md:h-11" />
          </Link>

          {/* Desktop nav sits right next to the logo — no dead space */}
          <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex lg:ml-10">
            {NAV.map(({ name, href }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`border-b-2 px-3 py-1 text-base font-medium text-black transition-colors ${
                  isActive(href) ? "border-black" : "border-transparent hover:border-black"
                }`}
              >
                {name}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setPanel("search")}
              aria-label="Search"
              className="hidden h-11 items-center gap-2 rounded-full bg-neutral-100 pl-4 pr-16 text-base text-neutral-500 transition-colors hover:bg-neutral-200 md:flex"
            >
              <Search className="h-6 w-6 text-black" strokeWidth={1.75} />
              Search
            </button>
            <button
              onClick={() => setPanel("search")}
              aria-label="Search"
              className={`${iconBtn} md:hidden`}
            >
              <Search className="h-7 w-7" strokeWidth={1.75} />
            </button>

            <Link href="/cart" aria-label={`Cart, ${cartCount} items`} className={iconBtn}>
              <ShoppingBag className="h-7 w-7" strokeWidth={1.75} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setPanel(panel === "menu" ? null : "menu")}
              aria-label={panel === "menu" ? "Close menu" : "Open menu"}
              aria-expanded={panel === "menu"}
              className={`${iconBtn} md:hidden`}
            >
              {panel === "menu" ? (
                <X className="h-7 w-7" strokeWidth={1.75} />
              ) : (
                <Menu className="h-7 w-7" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown: height fits content, no empty space */}
        <nav
          aria-label="Mobile"
          className={`absolute inset-x-0 top-full border-b border-neutral-200 bg-white px-6 pb-5 pt-2 shadow-lg md:hidden
            ${fade(panel === "menu")} ${panel === "menu" ? "translate-y-0" : "-translate-y-2"} transition-transform`}
        >
          {NAV.map(({ name, href }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`block py-3 text-2xl font-medium text-black ${
                isActive(href) ? "underline underline-offset-8" : ""
              }`}
            >
              {name}
            </Link>
          ))}
        </nav>
      </header>

      {/* Search overlay (outside header so fixed positioning is never affected) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className={`fixed inset-0 z-[60] bg-white ${fade(panel === "search")}`}
      >
        <form
          onSubmit={submit}
          className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-8 md:h-[72px]"
        >
          <Link href="/" aria-label="Home" className="hidden shrink-0 md:block">
            <Brand className="h-11 w-auto" />
          </Link>
          <div className="flex h-11 flex-1 items-center gap-2 rounded-full bg-neutral-100 px-4 md:mx-auto md:max-w-xl">
            <button type="submit" aria-label="Submit search" className="text-black">
              <Search className="h-6 w-6" strokeWidth={1.75} />
            </button>
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-base text-black outline-none placeholder:text-neutral-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setPanel(null)}
            className="text-base font-medium text-black hover:text-neutral-500"
          >
            Cancel
          </button>
        </form>
      </div>
    </>
  );
}