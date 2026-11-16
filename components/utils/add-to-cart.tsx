// components/utils/add-to-cart.tsx
"use client";

import { useEffect, useState, type ButtonHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/product/filters";

export type CartItem = {
  _id: string;
  name: string;
  price: number;
  salesPrice?: number;
  image: string;
  quantity: number;
  cartQty: number;
  maxQty: number;
  size?: string | null;
  color?: string | null;
  slug?: string;
};

type CartProduct = {
  _id: string;
  name: string;
  price: number;
  salesPrice?: number | null;
  quantity?: number | null;
  slug?: string | null;
  image?: string | null;
  images?: { url: string }[] | null;
  media?: Array<{ _type: string; asset?: { url: string } }> | null;
};

type Props = {
  product: CartProduct;
  selectedSize?: string | null;
  selectedColor?: string | null;
  hasSizes?: boolean;
  hasColors?: boolean;
  disabled?: boolean;
  showBuyNow?: boolean;
  className?: string;
};

export const CART_KEY = "cart";

export function readCart(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

const isSame = (i: CartItem, id: string, size: string | null, color: string | null) =>
  i._id === id && (i.size ?? null) === size && (i.color ?? null) === color;

function Btn({ variant, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant: "solid" | "outline" }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40",
        variant === "solid" ? "bg-black text-white hover:bg-neutral-700" : "border border-neutral-300 bg-white text-black hover:border-black",
        focusRing,
        className
      )}
    />
  );
}

export default function AddToCartButton({
  product,
  selectedSize,
  selectedColor,
  hasSizes,
  hasColors,
  disabled = false,
  showBuyNow = false,
  className,
}: Props) {
  const router = useRouter();
  const [inCart, setInCart] = useState(false);

  const size = selectedSize ?? null;
  const color = selectedColor ?? null;
  const stock = product.quantity ?? 0;

  // Keep in sync with other components and tabs that change the cart
  useEffect(() => {
    const sync = () => setInCart(readCart().some((i) => isSame(i, product._id, size, color)));
    sync();
    window.addEventListener("cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [product._id, size, color]);

  /** "add" increases quantity if already in cart; "buy" only makes sure the item is in the cart */
  const addToCart = (mode: "add" | "buy"): boolean => {
    if (hasSizes && !size) {
      toast.warning("Select a size first.");
      return false;
    }
    if (hasColors && !color) {
      toast.warning("Select a color first.");
      return false;
    }
    if (stock <= 0) {
      toast.error("This product is out of stock.");
      return false;
    }

    try {
      const cart = readCart();
      const existing = cart.find((i) => isSame(i, product._id, size, color));

      if (existing) {
        if (mode === "add") {
          if (existing.cartQty >= existing.maxQty) {
            toast.error(`You’ve added the maximum quantity (${existing.maxQty}).`);
            return false;
          }
          existing.cartQty += 1;
          toast.success("Quantity updated in your cart.");
        }
      } else {
        cart.push({
          _id: product._id,
          name: product.name,
          price: product.price,
          ...(product.salesPrice ? { salesPrice: product.salesPrice } : {}),
          image:
            product.image ||
            product.images?.[0]?.url ||
            product.media?.find((m) => m._type === "image")?.asset?.url ||
            "",
          quantity: stock,
          cartQty: 1,
          maxQty: stock,
          size,
          color,
          ...(product.slug ? { slug: product.slug } : {}),
        });
        if (mode === "add") toast.success("Added to your cart.");
      }

      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      window.dispatchEvent(new Event("cart-updated"));
      return true;
    } catch {
      toast.error("We couldn’t update your cart. Please try again.");
      return false;
    }
  };

  const buyNow = () => {
    if (addToCart("buy")) router.push("/cart");
  };

  if (stock <= 0) {
    return (
      <div className={className}>
        <Btn variant="outline" disabled>Out of stock</Btn>
      </div>
    );
  }

  const cartButton = inCart ? (
    <Btn variant="outline" onClick={() => router.push("/cart")}>
      <Check className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      View in cart
    </Btn>
  ) : (
    <Btn variant={showBuyNow ? "outline" : "solid"} onClick={() => addToCart("add")} disabled={disabled}>
      <ShoppingBag className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      Add to cart
    </Btn>
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showBuyNow && (
        <Btn variant="solid" onClick={buyNow} disabled={disabled}>
          Buy now
        </Btn>
      )}
      {cartButton}
    </div>
  );
}