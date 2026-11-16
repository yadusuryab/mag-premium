import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity";

export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

interface Asset {
  url?: string;
  mimeType?: string;
}

interface RawItem {
  _key?: string;
  alt?: string;
  title?: string;
  asset?: Asset | null;
  hotspot?: unknown;
  videoFile?: { asset?: Asset | null } | null;
  videoUrl?: string;
  poster?: { asset?: Asset | null } | null;
}

interface RawProduct {
  images?: RawItem[] | null;
  [key: string]: unknown;
}

const PROJECTION = `{
  _id, name, price, salesPrice, rating, sizes, colors, features,
  quantity, description, soldOut, featured,
  category->{_id, title},
  images[]{
    _key, alt, title, hotspot,
    asset->{url},
    videoFile{ asset->{url, mimeType} },
    videoUrl,
    poster{ asset->{url} }
  }
}`;

// 1) Exact match (fast, uses the index). Also matches the draft version.
const EXACT_QUERY = `*[_type == "product" && _id in [$id, "drafts." + $id]]
  | order(_updatedAt desc)[0]${PROJECTION}`;

// 2) Fallback for ids whose casing was changed (e.g. lowercased in a URL)
const LOOSE_QUERY = `*[_type == "product" && lower(_id) in [lower($id), "drafts." + lower($id)]]
  | order(_updatedAt desc)[0]${PROJECTION}`;

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;

  if (!id || id === "undefined") {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  try {
    let product = await sanityClient.fetch<RawProduct | null>(EXACT_QUERY, { id });

    if (!product) {
      product = await sanityClient.fetch<RawProduct | null>(LOOSE_QUERY, { id });
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found", id }, { status: 404 });
    }

    const { images: raw, ...rest } = product;

    // Images and videos live in one array; split into `media` (new) and `images` (legacy)
    const media = (raw ?? []).flatMap((item, i): any[] => {
      if (item.videoFile || item.videoUrl) {
        return [
          {
            _type: "video" as const,
            _key: item._key ?? `video-${i}`,
            title: item.title ?? "",
            alt: item.alt ?? "",
            videoFile: item.videoFile?.asset
              ? {
                  asset: {
                    url: item.videoFile.asset.url,
                    mimeType: item.videoFile.asset.mimeType,
                  },
                }
              : null,
            videoUrl: item.videoUrl ?? "",
            poster: item.poster?.asset?.url
              ? { asset: { url: item.poster.asset.url } }
              : null,
          },
        ];
      }

      if (item.asset?.url) {
        return [
          {
            _type: "image" as const,
            _key: item._key ?? `img-${i}`,
            asset: { url: item.asset.url },
            alt: item.alt ?? "",
            hotspot: item.hotspot ?? null,
          },
        ];
      }

      return [];
    });

    const images = media.flatMap((m: any) => {
      if (m._type === "image") return [{ url: m.asset.url, alt: m.alt }];
      return m.poster
        ? [
            {
              url: m.poster.asset.url,
              alt: m.alt || m.title || "Video thumbnail",
              isVideo: true,
            },
          ]
        : [];
    });

    return NextResponse.json(
      {
        ...rest,
        images,
        media,
        hasVideos: media.some((m: any) => m._type === "video"),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("[product api] ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}