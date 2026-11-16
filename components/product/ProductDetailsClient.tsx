// components/product/ProductDetailsClient.tsx
"use client";

import { useState, type ReactNode } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import PriceFormat_Sale from "@/components/commerce-ui/price-format-sale";
import StarRating_Basic from "@/components/commerce-ui/star-rating-basic";
import AddToCartButton from "../utils/add-to-cart";
import { focusRing } from "@/components/product/filters";

export interface ProductDetails {
  _id: string;
  name: string;
  description?: string | null;
  price: number;
  salesPrice?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  quantity?: number | null;
  slug?: string | null;
  sizes?: string[] | null;
  colors?: string[] | null;
  features?: string[] | null;
}

// ─── Colours ──────────────────────────────────────────────────────────────────
const COLOR_HEX: Record<string, string> = {
  black: "#000000", white: "#ffffff", silver: "#c0c0c0", gray: "#808080", grey: "#808080",
  red: "#ff0000", blue: "#0000ff", navy: "#000080", green: "#008000", olive: "#808000",
  yellow: "#ffff00", gold: "#ffd700", orange: "#ffa500", pink: "#ffc0cb", purple: "#800080",
  brown: "#a52a2a", beige: "#f5f5dc", cream: "#fffdd0", burgundy: "#800020", maroon: "#800000",
  teal: "#008080", turquoise: "#40e0d0", lavender: "#e6e6fa", "rose gold": "#b76e79",
};

/** Returns a hex for known colour names, or null so the option is shown as a text pill instead of a wrong swatch */
function resolveColor(name: string): string | null {
  const n = name.toLowerCase();
  if (COLOR_HEX[n]) return COLOR_HEX[n];
  const key = Object.keys(COLOR_HEX).find((k) => n.includes(k));
  return key ? COLOR_HEX[key] : null;
}

const LIGHT = ["white", "cream", "beige", "yellow", "lavender", "silver", "pink"];

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-4 py-3 text-sm font-semibold transition-colors",
    active ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-black hover:border-black",
    focusRing
  );

// ─── Option groups ────────────────────────────────────────────────────────────
function OptionGroup({ legend, value, children }: { legend: string; value?: string | null; children: ReactNode }) {
  return (
    <fieldset className="mt-6">
      <legend className="mb-3 text-base font-bold">
        {legend}
        {value && <span className="font-medium text-neutral-500">: {value}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductDetailsClient({ product }: { product: ProductDetails }) {
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [open, setOpen] = useState<string>("description");

  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];
  const features = product.features ?? [];

  const sections = [
    { id: "description", title: "Description", body: <p className="whitespace-pre-line">{product.description || "No description available."}</p> },
    {
      id: "details",
      title: "Details",
      body: features.length ? (
        <ul className="list-disc space-y-1.5 pl-5">
          {features.map((f) => <li key={f}>{f}</li>)}
        </ul>
      ) : (
        <p>No details available.</p>
      ),
    },
    { id: "shipping", title: "Shipping & returns", body: <p>Read our terms and policy.</p> },
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold uppercase leading-none tracking-tighter md:text-5xl">{product.name}</h1>

      <div className="mt-4 flex items-center gap-2">
        {product.rating ? <StarRating_Basic value={product.rating} readOnly iconSize={18} /> : null}
        <a href="#reviews" className={cn("rounded-full text-sm font-medium text-neutral-500 underline underline-offset-4 hover:text-black", focusRing)}>
          {product.reviewCount ? `${product.reviewCount} reviews` : "Be the first to review"}
        </a>
      </div>

      <div className="mt-6">
        {product.salesPrice ? (
          <PriceFormat_Sale
            originalPrice={product.price}
            salePrice={product.salesPrice}
            prefix="₹"
            showSavePercentage
            classNameSalePrice="text-2xl font-bold text-black"
            classNameOriginalPrice="text-lg font-medium text-neutral-500 line-through"
          />
        ) : (
          <p className="text-2xl font-bold">₹{product.price.toLocaleString("en-IN")}</p>
        )}
      </div>

      {sizes.length > 0 && (
        <OptionGroup legend="Size" value={size}>
          {sizes.map((s) => (
            <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={cn(chip(size === s), "min-w-14")}>
              {s}
            </button>
          ))}
        </OptionGroup>
      )}

      {colors.length > 0 && (
        <OptionGroup legend="Color" value={color}>
          {colors.map((c) => {
            const hex = resolveColor(c);
            const active = color === c;
            if (!hex) {
              return (
                <button key={c} type="button" aria-pressed={active} onClick={() => setColor(c)} className={chip(active)}>
                  {c}
                </button>
              );
            }
            return (
              <button
                key={c}
                type="button"
                aria-label={c}
                aria-pressed={active}
                title={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: hex }}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200",
                  active && "ring-2 ring-black ring-offset-2",
                  focusRing
                )}
              >
                {active && (
                  <Check className={cn("h-5 w-5", LIGHT.some((l) => c.toLowerCase().includes(l)) ? "text-black" : "text-white")} strokeWidth={2} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </OptionGroup>
      )}

      <div className="mt-8">
        <AddToCartButton
          product={product}
          selectedSize={size}
          selectedColor={color}
          hasSizes={sizes.length > 0}
          hasColors={colors.length > 0}
          showBuyNow
        />
      </div>

      <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {sections.map((s) => {
          const isOpen = open === s.id;
          return (
            <div key={s.id}>
              <h2>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`pd-${s.id}`}
                  onClick={() => setOpen(isOpen ? "" : s.id)}
                  className={cn("flex min-h-14 w-full items-center justify-between rounded-full text-left text-base font-bold", focusRing)}
                >
                  {s.title}
                  {isOpen ? <Minus className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /> : <Plus className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />}
                </button>
              </h2>
              {isOpen && (
                <div id={`pd-${s.id}`} className="pb-5 text-base font-medium leading-relaxed text-neutral-600">
                  {s.body}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}