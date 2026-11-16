"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MediaCarousel, { type MediaItem } from "@/components/product/MediaCarousel";
import ProductDetailsClient, { type ProductDetails } from "@/components/product/ProductDetailsClient";
import ProductReviewSection from "@/components/sections/reviews";

type ProductData = ProductDetails & {
  media?: MediaItem[] | null;
  quantity?: number | null;
  category?: { title?: string } | null;
};

export default function ProductPageClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("ProductPageClient id:", id);

    if (!id || id === "undefined") {
      setError("Invalid product link (missing id)");
      setLoading(false);
      return;
    }

    const ac = new AbortController();

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      setProduct(null);

      try {
        const res = await fetch(`/api/product/${encodeURIComponent(id)}`, {
          signal: ac.signal,
        });

        if (res.status === 404) {
          setProduct(null);
          return;
        }
        if (!res.ok) throw new Error(`Product request failed (${res.status})`);

        const data = (await res.json()) as ProductData;
        console.log("product:", data);
        setProduct(data);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError(e.message || "Something went wrong");
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    loadProduct();
    return () => ac.abort();
  }, [id]);

  // Keep the browser tab title in sync (client pages can't use generateMetadata)
  useEffect(() => {
    if (product?.name) {
      document.title = `${product.name} | ${product.category?.title ?? "Product"}`;
    }
  }, [product]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8">
        <div className="grid gap-8 py-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12">
          <div className="aspect-square animate-pulse rounded-2xl bg-neutral-200" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-200" />
            <div className="h-6 w-1/4 animate-pulse rounded bg-neutral-200" />
            <div className="h-24 w-full animate-pulse rounded bg-neutral-200" />
            <div className="h-12 w-full animate-pulse rounded-full bg-neutral-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Something went wrong</h1>
        <p role="alert" className="mt-2 text-base font-medium text-neutral-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-black px-6 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Product not found</h1>
        <p className="mt-2 text-base font-medium text-neutral-500">It may have been removed or the link is wrong.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-black px-6 text-sm font-semibold text-white hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white text-black">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="py-4 text-sm font-medium text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/products" className="hover:text-black">Shop</Link></li>
            {product.category?.title && (
              <>
                <li aria-hidden="true">/</li>
                <li>{product.category.title}</li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-black">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 pb-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12">
          <MediaCarousel media={product.media ?? []} imageFit="cover" />
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductDetailsClient product={product} />
          </div>
        </div>

        <section id="reviews" className="scroll-mt-24 border-t border-neutral-200 py-12">
          <ProductReviewSection productId={id!} />
        </section>
      </div>
    </div>
  );
}