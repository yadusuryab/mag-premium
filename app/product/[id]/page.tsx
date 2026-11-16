// app/product/[id]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import MediaCarousel, { type MediaItem } from "@/components/product/MediaCarousel";
import ProductDetailsClient, { type ProductDetails } from "@/components/product/ProductDetailsClient";
import ProductReviewSection from "@/components/sections/reviews";

interface Props {
  params: Promise<{ id: string }>;
}

type ProductData = ProductDetails & {
  media?: MediaItem[] | null;
  quantity?: number | null;
  category?: { title?: string } | null;
};

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "";
const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "SHOPIGO";

// Identical GET requests are de-duplicated by Next, so metadata + page share one fetch
async function getProduct(id: string): Promise<ProductData | null> {
  const res = await fetch(`${BASE}/api/product/${encodeURIComponent(id)}`, { next: { revalidate: 3600 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Product request failed (${res.status})`);
  return res.json();
}

const firstImage = (p: ProductData) => p.media?.find((m) => m._type === "image")?.asset?.url ?? "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const notFound: Metadata = { title: "Product not found", description: "The requested product could not be found." };

  try {
    const p = await getProduct(id);
    if (!p) return notFound;

    const image = firstImage(p);
    const price = p.salesPrice || p.price;
    const description = (p.description || `${p.name} – available now at ${APP}`).slice(0, 160);
    const url = `${BASE}/product/${id}`;

    return {
      title: `${p.name} | ${p.category?.title ?? "Product"} | ${APP}`,
      description,
      openGraph: { title: p.name, description, url, type: "website", images: image ? [{ url: image }] : undefined },
      twitter: { card: "summary_large_image", title: p.name, description, images: image ? [image] : undefined },
      alternates: { canonical: url },
      other: {
        "product:price:amount": String(price),
        "product:price:currency": "INR",
        ...(image && { "product:image": image }),
      },
    };
  } catch {
    return notFound;
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: firstImage(product),
    description: product.description,
    sku: product._id,
    ...(product.rating && product.reviewCount
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount, bestRating: 5 } }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${BASE}/product/${id}`,
      priceCurrency: "INR",
      price: product.salesPrice || product.price,
      priceValidUntil: new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability: (product.quantity ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.category?.title && { category: product.category.title }),
  };

  return (
    <div className="bg-white text-black">
      <script
        type="application/ld+json"
        // Escape "<" so product text can never close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

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
          <ProductReviewSection productId={id} />
        </section>
      </div>
    </div>
  );
}