// app/checkout/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronDown, Lock, MessageCircle, Tag, Truck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validations";
import { readCart, type CartItem } from "@/components/utils/add-to-cart";
import Brand from "@/components/utils/brand";
import { focusRing } from "@/components/product/filters";

type FormData = z.infer<typeof checkoutSchema>;
type Payment = "online" | "cod";

const OFFER_PRICE = 1499;
const COD_FEE = 150;
const COD_ADVANCE = 100;
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_PHONE ?? "";
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "SHOPIGO";

const wrap = "mx-auto w-full max-w-[1440px] px-4 sm:px-8";
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const unit = (i: CartItem) => i.salesPrice || i.price;
const thumb = (u: string) => (u.includes("cdn.sanity.io") ? `${u}${u.includes("?") ? "&" : "?"}w=160&auto=format&q=75` : u);
const input =
  "w-full rounded-full border bg-white px-5 text-base font-medium text-black placeholder:text-neutral-400 focus-visible:border-black focus-visible:outline-none";

function readOfferCart(): CartItem[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem("offerCart") ?? "[]");
    return Array.isArray(v) ? (v as CartItem[]) : [];
  } catch {
    return [];
  }
}

function Row({ label, value, strike }: { label: string; value: string; strike?: boolean }) {
  return (
    <div className="flex justify-between text-base font-medium">
      <dt className="text-neutral-500">{label}</dt>
      <dd className={cn(strike && "text-neutral-400 line-through")}>{value}</dd>
    </div>
  );
}

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOffer = searchParams.get("offer") === "true";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [payment, setPayment] = useState<Payment>("online");
  const [summaryOpen, setSummaryOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(checkoutSchema) });

  useEffect(() => {
    setCart(isOffer ? readOfferCart() : readCart());
    setReady(true);
  }, [isOffer]);

  // ── Pricing ─────────────────────────────────────────────────────────────────
  const rawSubtotal = cart.reduce((sum, i) => sum + unit(i) * i.cartQty, 0);
  const subtotal = isOffer ? OFFER_PRICE : rawSubtotal;
  const shipping = payment === "online" ? 0 : COD_FEE;
  const total = subtotal + shipping;
  const deliveryTime = payment === "online" ? "Kerala: 2–3 days · Outside Kerala: 6–7 days" : "Delivery in 7 days";

  // ── WhatsApp message ────────────────────────────────────────────────────────
  const buildMessage = (d: FormData) => {
    const L: string[] = [`*NEW ORDER — ${APP_NAME}*`, "", "*CUSTOMER*", `Name: ${d.customerName}`, `Phone: ${d.phoneNumber}`];
    if (d.alternatePhone) L.push(`Alt: ${d.alternatePhone}`);
    if (d.instagramId) L.push(`Instagram: ${d.instagramId}`);

    L.push("", "*DELIVERY ADDRESS*", d.address, `${d.district}, ${d.state} - ${d.pincode}`);
    if (d.landmark) L.push(`Landmark: ${d.landmark}`);

    L.push("", "*PRODUCTS*");
    if (isOffer) L.push("BOGO OFFER — Buy 1 Get 1 Free");
    cart.forEach((item, i) => {
      L.push(`${i + 1}. ${item.name}${isOffer && i === 1 ? " (FREE)" : ""} x${item.cartQty}`);
      if (item.size) L.push(`   Size: ${item.size}`);
      if (item.color) L.push(`   Colour: ${item.color}`);
      if (!isOffer) L.push(`   Price: ${inr(unit(item) * item.cartQty)}`);
      if (APP_URL) L.push(`   ${APP_URL}/product/${item.slug || item._id}`);
    });

    L.push("", "*PRICE*");
    L.push(isOffer ? `Offer price: ${inr(OFFER_PRICE)}` : `Subtotal: ${inr(rawSubtotal)}`);
    L.push(shipping === 0 ? "Shipping: Free" : `COD charges: ${inr(shipping)}`);
    L.push(`Total: ${inr(total)}`, `Payment: ${payment === "online" ? "Online (UPI/Card)" : "Cash on Delivery"}`);

    return encodeURIComponent(L.join("\n"));
  };

  const handleOrder = (data: FormData) => {
    if (!WHATSAPP_NUMBER) {
      toast.error("Ordering is unavailable right now. Please try again later.");
      return;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildMessage(data)}`;

    // Validation is async, so some browsers block window.open; fall back to same-tab navigation
    const win = window.open(url, "_blank");
    if (!win) window.location.assign(url);

    localStorage.removeItem(isOffer ? "offerCart" : "cart");
    if (isOffer) localStorage.removeItem("offerFirst");
    window.dispatchEvent(new Event("cart-updated"));
  };

  // ── Form field helper (returns JSX, not a component, so inputs never remount) ─
  const field = (
    name: keyof FormData,
    label: string,
    o: { placeholder?: string; optional?: boolean; autoComplete?: string; inputMode?: "tel" | "numeric"; area?: boolean } = {}
  ) => {
    const err = errors[name]?.message as string | undefined;
    const common = {
      id: name,
      placeholder: o.placeholder,
      autoComplete: o.autoComplete,
      "aria-invalid": err ? true : undefined,
      "aria-describedby": err ? `${name}-error` : undefined,
      ...register(name),
    };
    return (
      <div className="space-y-1.5">
        <label htmlFor={name} className="text-sm font-semibold">
          {label}
          {o.optional && <span className="font-medium text-neutral-500"> (optional)</span>}
        </label>
        {o.area ? (
          <textarea rows={3} className={cn(input, "rounded-3xl py-3", err ? "border-red-600" : "border-neutral-200")} {...common} />
        ) : (
          <input inputMode={o.inputMode} className={cn(input, "h-12", err ? "border-red-600" : "border-neutral-200")} {...common} />
        )}
        {err && <p id={`${name}-error`} role="alert" className="text-sm font-medium text-red-600">{err}</p>}
      </div>
    );
  };

  const payOption = (value: Payment, title: string, badge: string, desc: string) => (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-black",
        payment === value ? "border-black" : "border-neutral-200 hover:border-black"
      )}
    >
      <input type="radio" name="payment" value={value} checked={payment === value} onChange={() => setPayment(value)} className="mt-1 h-5 w-5 accent-black" />
      <span className="flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-base font-bold">{title}</span>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">{badge}</span>
        </span>
        <span className="mt-1 block text-sm font-medium text-neutral-500">{desc}</span>
      </span>
    </label>
  );

  // ── States ──────────────────────────────────────────────────────────────────
  if (!ready) return <div className="min-h-svh bg-white" aria-busy="true" />;

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter md:text-5xl">Your cart is empty</h1>
        <p className="mt-3 text-base font-medium text-neutral-500">Add products before checking out.</p>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className={cn("mt-8 inline-flex h-14 items-center rounded-full bg-black px-8 text-base font-semibold text-white hover:bg-neutral-700", focusRing)}
        >
          Continue shopping
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white text-black">
      <header className="border-b border-neutral-200">
        <div className={cn(wrap, "flex h-16 items-center justify-between md:h-[72px]")}>
          <Link href="/" aria-label={`${APP_NAME} home`} className={cn("rounded-full", focusRing)}>
            <Brand className="h-9 w-auto md:h-11" />
          </Link>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            Secure checkout
          </p>
        </div>
      </header>

      <div className={cn(wrap, "grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16")}>
        {/* ── Summary (first on mobile, right on desktop) ── */}
        <aside className="order-first lg:order-last" aria-label="Order summary">
          <div className="rounded-3xl bg-neutral-100 p-5 lg:sticky lg:top-8 lg:p-8">
            <button
              type="button"
              aria-expanded={summaryOpen}
              aria-controls="order-summary"
              onClick={() => setSummaryOpen((o) => !o)}
              className={cn("flex w-full items-center justify-between rounded-full text-left lg:pointer-events-none", focusRing)}
            >
              <span className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight">
                Order summary
                <ChevronDown className={cn("h-5 w-5 transition-transform motion-reduce:transition-none lg:hidden", summaryOpen && "rotate-180")} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="text-lg font-bold" aria-live="polite">{inr(total)}</span>
            </button>

            <div id="order-summary" className={cn("mt-5", summaryOpen ? "block" : "hidden", "lg:block")}>
              {isOffer && (
                <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold">
                  <Tag className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  Buy 1 get 1 free · {inr(OFFER_PRICE)}
                </p>
              )}

              <ul className="space-y-4">
                {cart.map((item, idx) => {
                  const free = isOffer && idx === 1;
                  const variant = [item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ");
                  return (
                    <li key={`${item._id}-${item.size ?? ""}-${item.color ?? ""}`} className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 bg-white">
                        {item.image && <img src={thumb(item.image)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/product/${item.slug || item._id}`} className={cn("block truncate rounded-sm text-base font-bold hover:underline", focusRing)}>
                          {item.name}
                        </Link>
                        <p className="text-sm font-medium capitalize text-neutral-500">
                          {[variant, `Qty ${item.cartQty}`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <p className="shrink-0 text-base font-bold">
                        {free ? (
                          <>
                            <span className="mr-1 text-sm font-medium text-neutral-400 line-through">{inr(unit(item))}</span>Free
                          </>
                        ) : (
                          inr(unit(item) * item.cartQty)
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>

              <dl className="mt-6 space-y-3 border-t border-neutral-300 pt-5">
                <Row label={isOffer ? "Original value" : "Subtotal"} value={inr(rawSubtotal)} strike={isOffer} />
                {isOffer && <Row label="Offer price" value={inr(OFFER_PRICE)} />}
                <Row label={payment === "online" ? "Shipping" : "COD charges"} value={shipping ? inr(shipping) : "Free"} />
                <div className="flex justify-between border-t border-neutral-300 pt-4 text-lg font-bold">
                  <dt>Total</dt>
                  <dd>{inr(total)}</dd>
                </div>
              </dl>

              <p className="mt-5 flex items-start gap-2 text-sm font-medium text-neutral-500">
                <Truck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {deliveryTime}
              </p>
            </div>
          </div>
        </aside>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(handleOrder)} noValidate className="max-w-xl space-y-10">
          <p className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4 text-sm font-medium text-neutral-600">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-black" strokeWidth={1.75} aria-hidden="true" />
            Fill in your details and we’ll open WhatsApp with your order, including product links, pre-filled.
          </p>

          <section aria-labelledby="delivery-title" className="space-y-4">
            <h2 id="delivery-title" className="text-xl font-extrabold uppercase tracking-tight">Delivery details</h2>
            {field("customerName", "Full name", { placeholder: "Your full name", autoComplete: "name" })}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("phoneNumber", "Phone", { placeholder: "10-digit number", autoComplete: "tel", inputMode: "tel" })}
              {field("alternatePhone", "Alternate phone", { optional: true, autoComplete: "tel", inputMode: "tel" })}
            </div>
            {field("instagramId", "Instagram ID", { optional: true, placeholder: "@username" })}
            {field("address", "Full address", { placeholder: "House no., building, street, area", autoComplete: "street-address", area: true })}
            <div className="grid gap-4 sm:grid-cols-3">
              {field("district", "District", { placeholder: "Kannur" })}
              {field("state", "State", { placeholder: "Kerala", autoComplete: "address-level1" })}
              {field("pincode", "Pincode", { placeholder: "670001", autoComplete: "postal-code", inputMode: "numeric" })}
            </div>
            {field("landmark", "Landmark", { optional: true, placeholder: "Near school, temple…" })}
          </section>

          <fieldset className="space-y-3">
            <legend className="mb-4 text-xl font-extrabold uppercase tracking-tight">Payment</legend>
            {payOption("online", "Online payment", "Free shipping", "UPI or card. The payment link is shared on WhatsApp.")}
            {payOption(
              "cod",
              "Cash on delivery",
              `+${inr(COD_FEE)}`,
              isOffer ? `Total ${inr(OFFER_PRICE + COD_FEE)} · ${inr(COD_ADVANCE)} advance, rest on delivery` : `${inr(COD_ADVANCE)} advance, rest on delivery`
            )}
          </fieldset>

          <div className="space-y-3">
            <p className="text-sm font-medium text-neutral-500">
              By placing your order you agree to our{" "}
              <Link href="/terms" target="_blank" className={cn("rounded-sm font-semibold text-black underline underline-offset-4", focusRing)}>
                return policy
              </Link>
              . All sales are final unless specified.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-black text-base font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-40",
                focusRing
              )}
            >
              <MessageCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              Place order on WhatsApp
            </button>
            <p className="text-center text-sm font-medium text-neutral-500">You’ll be taken to WhatsApp to confirm with us.</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-white" aria-busy="true" />}>
      <CheckoutInner />
    </Suspense>
  );
}