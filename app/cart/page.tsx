// app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CART_KEY, readCart, type CartItem } from "@/components/utils/add-to-cart";
import { focusRing } from "@/components/product/filters";

const wrap = "mx-auto w-full max-w-[1440px] px-4 sm:px-8";
const pill = "inline-flex h-14 w-full items-center justify-center rounded-full text-base font-semibold transition-colors";
const solid = cn(pill, "bg-black text-white hover:bg-neutral-700", focusRing);
const outline = cn(pill, "border border-neutral-300 bg-white text-black hover:border-black", focusRing);
const iconBtn = cn(
  "flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-30",
  focusRing
);

// Same product in a different size/colour is a separate cart line
const lineKey = (i: CartItem) => `${i._id}|${i.size ?? ""}|${i.color ?? ""}`;
const unitPrice = (i: CartItem) => i.salesPrice || i.price;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const thumb = (u: string) => (u.includes("cdn.sanity.io") ? `${u}${u.includes("?") ? "&" : "?"}w=256&auto=format&q=75` : u);

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Read on mount and stay in sync with other components/tabs
  useEffect(() => {
    const sync = () => setCart(readCart());
    sync();
    setLoading(false);
    window.addEventListener("cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persist = (next: CartItem[]) => {
    setCart(next);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("cart-updated")); // keeps the header badge correct
    } catch {
      toast.error("We couldn’t save your cart.");
    }
  };

  const setQty = (key: string, qty: number) => {
    const line = cart.find((i) => lineKey(i) === key);
    if (!line || qty < 1) return;
    const next = Math.min(qty, line.maxQty);
    if (next !== qty) toast(`Only ${line.maxQty} available.`);
    persist(cart.map((i) => (lineKey(i) === key ? { ...i, cartQty: next } : i)));
  };

  const removeLine = (key: string) => {
    const prev = cart;
    persist(cart.filter((i) => lineKey(i) !== key));
    toast("Removed from cart", { action: { label: "Undo", onClick: () => persist(prev) } });
  };

  const clearCart = () => {
    const prev = cart;
    persist([]);
    toast("Cart cleared", { action: { label: "Undo", onClick: () => persist(prev) } });
  };

  const itemCount = cart.reduce((n, i) => n + i.cartQty, 0);
  const subtotal = cart.reduce((sum, i) => sum + unitPrice(i) * i.cartQty, 0);

  if (loading) {
    return (
      <div className={cn(wrap, "py-8")} aria-busy="true">
        <div className="h-12 w-40 animate-pulse rounded-full bg-neutral-100" />
        <div className="mt-8 space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse gap-4">
              <div className="h-24 w-24 shrink-0 bg-neutral-100 sm:h-32 sm:w-32" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-4 w-2/3 rounded-full bg-neutral-100" />
                <div className="h-4 w-1/3 rounded-full bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter md:text-5xl">Your cart is empty</h1>
        <p className="mt-3 text-base font-medium text-neutral-500">Items you add will show up here.</p>
        <Link href="/products" className={cn(solid, "mt-8 max-w-xs")}>Browse products</Link>
      </div>
    );
  }

  return (
    <div className="bg-white text-black">
      <div className={cn(wrap, "py-8")}>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold uppercase leading-none tracking-tighter md:text-5xl">Cart</h1>
            <p className="mt-2 text-sm font-medium text-neutral-500" aria-live="polite">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <button type="button" onClick={clearCart} className={cn("rounded-full px-3 py-2 text-sm font-semibold underline underline-offset-4", focusRing)}>
            Clear all
          </button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-16">
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {cart.map((item) => {
              const key = lineKey(item);
              const href = `/product/${item._id}`;
              const variant = [item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ");
              return (
                <li key={key} className="flex gap-4 py-5 sm:gap-6">
                  <Link href={href} className={cn("block h-24 w-24 shrink-0 bg-neutral-100 sm:h-32 sm:w-32", focusRing)} tabIndex={-1} aria-hidden="true">
                    {item.image && <img src={thumb(item.image)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={href} className={cn("rounded-sm text-base font-bold leading-snug hover:underline", focusRing)}>
                        {item.name}
                      </Link>
                      <p className="shrink-0 text-base font-bold">{inr(unitPrice(item) * item.cartQty)}</p>
                    </div>

                    {variant && <p className="mt-1 text-sm font-medium capitalize text-neutral-500">{variant}</p>}
                    {item.cartQty > 1 && <p className="text-sm font-medium text-neutral-500">{inr(unitPrice(item))} each</p>}

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-neutral-200" role="group" aria-label={`Quantity for ${item.name}`}>
                        <button type="button" aria-label="Decrease quantity" disabled={item.cartQty <= 1} onClick={() => setQty(key, item.cartQty - 1)} className={iconBtn}>
                          <Minus className="h-5 w-5" strokeWidth={1.75} />
                        </button>
                        <span className="w-8 text-center text-base font-semibold" aria-live="polite">{item.cartQty}</span>
                        <button type="button" aria-label="Increase quantity" disabled={item.cartQty >= item.maxQty} onClick={() => setQty(key, item.cartQty + 1)} className={iconBtn}>
                          <Plus className="h-5 w-5" strokeWidth={1.75} />
                        </button>
                      </div>
                      <button type="button" aria-label={`Remove ${item.name}`} onClick={() => removeLine(key)} className={iconBtn}>
                        <Trash2 className="h-6 w-6" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <section aria-labelledby="summary-title" className="lg:sticky lg:top-24">
            <h2 id="summary-title" className="text-xl font-extrabold uppercase tracking-tight">Summary</h2>
            <dl className="mt-5 space-y-3 text-base font-medium">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd>{inr(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Shipping</dt>
                <dd>Free</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-4 text-lg font-bold">
                <dt>Total</dt>
                <dd>{inr(subtotal)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              <Link href="/checkout" className={solid}>Checkout</Link>
              <Link href="/products" className={outline}>Continue shopping</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}